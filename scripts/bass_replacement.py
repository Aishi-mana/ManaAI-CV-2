"""Bass-specific adaptive tracking and articulation for uploaded bass stems."""
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
SR=24000

def detect_slow(source,seconds):
    # Low register fundamental tracker instead of guitar-oriented chord reduction.
    rate=12000;hop=120
    low=librosa.resample(source,orig_sr=SR,target_sr=rate)
    low=sosfiltfilt(butter(3,700,'lowpass',fs=rate,output='sos'),low)
    f0,voiced,prob=librosa.pyin(low,fmin=30.87,fmax=246.95,sr=rate,frame_length=2048,hop_length=hop,fill_na=np.nan)
    rms=librosa.feature.rms(y=low,frame_length=1024,hop_length=hop)[0]
    count=min(len(f0),len(rms));f0=f0[:count];prob=prob[:count];rms=rms[:count]
    pitches=np.zeros(count,dtype=int);valid=np.isfinite(f0)&(prob>=.12)&(rms>max(float(rms.max())*.025,1e-6))
    pitches[valid]=np.rint(librosa.hz_to_midi(f0[valid])).astype(int)
    pitches=median_filter(pitches,size=5)
    # Fill only very short same-pitch dropouts, keeping actual rests.
    for i in range(1,len(pitches)-3):
        if pitches[i]==0 and pitches[i-1]>0:
            for gap in range(1,4):
                if pitches[i+gap]==pitches[i-1]:pitches[i:i+gap]=pitches[i-1];break
                if pitches[i+gap]>0:break
    attacks=librosa.onset.onset_detect(y=source,sr=SR,hop_length=240,units='time',backtrack=False)
    notes=[];first=0
    for frame in range(1,count+1):
        if frame<count and pitches[frame]==pitches[first]:continue
        a=first*.01;b=min(seconds,frame*.01);p=int(pitches[first])
        if p and b-a>=.08:
            cuts=[a]
            for onset in attacks:
                if a+.10<onset<b-.09 and onset-cuts[-1]>=.10:
                    k=round(onset/.01);pre=float(np.mean(rms[max(0,k-5):max(1,k-1)]));post=float(np.max(rms[k:min(count,k+5)]))
                    if post>pre*1.25:cuts.append(float(onset))
            cuts.append(b)
            notes.extend([[x,y,p,float(np.mean(prob[first:frame]))] for x,y in zip(cuts,cuts[1:])])
        first=frame
    if not notes:raise ValueError('No clear bass fundamentals detected.')
    strengths=[]
    for a,b,_,_ in notes:
        x=source[round(a*SR):max(round(a*SR)+1,round(min(b,a+.16)*SR))]
        strengths.append(float(np.sqrt(np.mean(x*x))))
    ref=max(float(np.percentile(strengths,90)),1e-8)
    velocities=[int(round(22+83*float(np.clip(v/ref,0,1)))) for v in strengths]
    return notes,velocities

def detect_fast(source):
    rate=12000;hop=30;step=hop/rate
    low=librosa.resample(source,orig_sr=SR,target_sr=rate)
    low=sosfiltfilt(butter(3,650,'lowpass',fs=rate,output='sos'),low)
    f0,_,prob=librosa.pyin(low,fmin=30.87,fmax=246.95,sr=rate,frame_length=1024,hop_length=hop,fill_na=np.nan)
    energy=librosa.feature.rms(y=low,frame_length=256,hop_length=hop)[0]
    count=min(len(f0),len(energy));prob=prob[:count]
    keys=np.zeros(count,dtype=int)
    valid=np.isfinite(f0[:count])&(prob>=.08)&(energy[:count]>max(energy.max()*.025,1e-6))
    keys[valid]=np.rint(librosa.hz_to_midi(f0[:count][valid])).astype(int)
    keys=median_filter(keys,size=3) # 7.5ms, rather than50ms smoothing.
    notes=[];first=0;duration=len(source)/SR
    for frame in range(1,count+1):
        if frame<count and keys[frame]==keys[first]:continue
        a=first*step;b=min(duration,frame*step)
        if keys[first] and b-a>=.025:
            notes.append([a,b,int(keys[first]),float(np.mean(prob[first:frame]))])
        first=frame
    # Restore quick same-key picks only at a measured source-envelope rise.
    attacks=librosa.onset.onset_detect(y=low,sr=rate,hop_length=60,units='time',backtrack=True)
    articulated=[]
    for a,b,p,confidence in notes:
        cuts=[a]
        for attack in attacks:
            if not a+.045<attack<b-.035 or attack-cuts[-1]<.045:continue
            k=round(attack/step)
            before=float(np.mean(energy[max(0,k-12):max(1,k-2)]))
            after=float(np.max(energy[k:min(count,k+16)]))
            if after>max(before*1.30,energy.max()*.04):cuts.append(float(attack))
        cuts.append(b)
        articulated.extend([[x,y,p,confidence] for x,y in zip(cuts,cuts[1:])])
    return articulated

def refine(source,notes,velocities):
    low=sosfiltfilt(butter(3,550,'lowpass',fs=SR,output='sos'),source)
    attacks=librosa.onset.onset_detect(y=low,sr=SR,hop_length=60,units='time',backtrack=True)
    rms=librosa.feature.rms(y=low,frame_length=256,hop_length=60)[0]
    result=[];levels=[];edits=[]
    for i,(original,velocity) in enumerate(zip(notes,velocities)):
        n=list(original);a,b,p,confidence=n
        nearby=[float(t) for t in attacks if a-.055<=t<=a+.015 and (not result or t>result[-1][0]+.025) and t<b-.025]
        if nearby:
            t=min(nearby,key=lambda t:abs(t-a));k=round(t*SR/60)
            before=float(np.mean(rms[max(0,k-12):max(1,k-2)]));after=float(np.max(rms[k:min(len(rms),k+20)]))
            if after>max(before*1.25,float(rms.max())*.04):
                n[0]=t
                if abs(t-a)>.0025:edits.append(dict(kind='attack',old=a,new=t,pitch=p))
                if result and result[-1][1]>t:result[-1][1]=max(result[-1][0]+.01,t)
        # A detector dropout can retrigger a held key even though the source has no pick.
        previous=result[-1] if result else None
        has_attack=any(abs(float(t)-n[0])<.025 for t in attacks)
        gap_energy=False
        if previous:
            start=max(0,round(previous[1]*SR/60));end=min(len(rms),max(start+1,round(n[0]*SR/60)))
            gap_energy=end>start and float(np.min(rms[start:end]))>max(float(rms.max())*.025,1e-6)
        if previous and previous[2]==p and -.002<=n[0]-previous[1]<=.04 and not has_attack and gap_energy:
            previous[1]=max(previous[1],n[1]);edits.append(dict(kind='merge-detector-retrigger',start=n[0],pitch=p))
        else:result.append(n);levels.append(velocity)
    return result,levels,edits

def fast_regions(notes,seconds):
    quick=[n for n in notes if n[1]-n[0]<.15 and n[3]>=.2]
    regions=[]
    for i,n in enumerate(quick):
        group=[v for v in quick[i:] if v[0]-n[0]<=.65]
        if len(group)<3 or len({v[2] for v in group})<2:continue
        a=max(0,n[0]-.25);b=min(seconds,group[-1][1]+.25)
        if regions and a<=regions[-1][1]+.35:regions[-1][1]=max(regions[-1][1],b)
        else:regions.append([a,b])
    return regions

def combine(slow,fast,regions):
    result=[]
    for n in slow:
        spans=[(n[0],n[1])]
        for a,b in regions:
            spans=[part for x,y in spans for part in ([(x,min(a,y))] if x<a else [])+([(max(b,x),y)] if y>b else []) if part[1]-part[0]>=.025]
        result.extend([[a,b,*n[2:]] for a,b in spans])
    for n in fast:
        for a,b in regions:
            x=max(a,n[0]);y=min(b,n[1])
            if y-x>=.025:result.append([x,y,*n[2:]])
    return sorted(result,key=lambda n:n[0])

def render_bass(path,seconds,root,program,custom=None):
    from arrangement_replacement import render_soundfont,validate_custom,customize_notes
    import sys
    sys.path.insert(0,str(root/'data/transcription-packages'))
    import pretty_midi
    custom=validate_custom(custom)
    source,_=librosa.load(path,sr=SR,duration=seconds)
    slow,_=detect_slow(source,seconds);fast=detect_fast(source)
    regions=fast_regions(fast,seconds)
    notes=combine(slow,fast,regions)
    if not notes:raise ValueError('No clear bass notes detected. Try another section.')
    strengths=[float(np.sqrt(np.mean(source[round(a*SR):max(round(a*SR)+1,round(min(b,a+.12)*SR))]**2))) for a,b,_,_ in notes]
    ref=max(float(np.percentile(strengths,90)),1e-9)
    velocities=[int(round(22+83*np.clip(v/ref,0,1))) for v in strengths]
    notes,velocities,_=refine(source,notes,velocities)
    # Classify articulation before user extension so extra hold does not silently change the preset.
    quick=[n[1]-n[0]<.15 for n in notes]
    notes=customize_notes(notes,seconds,custom.get('extension',0));shift=int(custom.get('pitch',0))
    audio=np.zeros(round(seconds*SR),dtype=np.float32)
    for fast_class,scale in [(True,1.5),(False,4)]:
        indices=[i for i,value in enumerate(quick) if value==fast_class]
        if indices:audio+=render_soundfont([notes[i] for i in indices],seconds,root,program,shift,midi_velocities=[velocities[i] for i in indices],release_scale=scale)
    if not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-7:raise ValueError('No usable bass performance returned.')
    midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=program)
    for (a,b,p,_),v in zip(notes,velocities):track.notes.append(pretty_midi.Note(velocity=v,pitch=p+shift,start=a,end=b))
    midi.instruments.append(track)
    return audio,midi,notes
