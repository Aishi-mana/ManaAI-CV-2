"""Approved rock drums: source-dynamic kick/snare plus trimmed cymbals at -6dB."""
import sys
import numpy as np
import librosa
from scipy.optimize import nnls
from scipy.signal import butter,sosfilt,find_peaks
from scipy.ndimage import median_filter
SR=24000

def spectral(x):return np.abs(librosa.stft(x,n_fft=1024,hop_length=120))

def analyze(source,templates):
    if not np.isfinite(source).all():raise ValueError('Non-finite drum source.')
    if len(source)<1024 or float(np.sqrt(np.mean(source*source)))<1e-8:return [],[]
    # Include snare in the fit so its hiss need not become a hi-hat every time.
    pitches=[38,42,46,49,51];freq=librosa.fft_frequencies(sr=SR,n_fft=1024)
    band=(freq>=1800)&(freq<=11000);s=spectral(source)[band]
    whiten=1/np.maximum(np.mean(s,axis=1),max(float(np.max(s))*.003,1e-9))**.55
    columns=[]
    for p in pitches:
        spec=spectral(templates[p])[band]
        columns.append(np.mean(spec[:,10:25],axis=1)*whiten) #50–125ms after stream start, note starts40ms
    matrix=np.column_stack(columns);matrix/=np.maximum(np.linalg.norm(matrix,axis=0),1e-9)
    activity=np.array([nnls(matrix,s[:,frame]*whiten)[0] for frame in range(s.shape[1])]).T
    notes=[];evidence=[]
    for i,p in enumerate(pitches[1:],1):
        level=median_filter(activity[i],size=3)
        rise=np.maximum(level-np.r_[0,level[:-1]],0)
        if rise.max()<1e-6:continue
        distance=8 if p in [42,46] else 30 if p==49 else 14
        peaks,_=find_peaks(rise,height=rise.max()*.14,prominence=rise.max()*.08,distance=distance)
        for frame in peaks:
            lo=max(0,frame-2);hi=min(len(level),frame+4)
            own=float(np.mean(activity[i,lo:hi]));total=float(np.sum(activity[1:,lo:hi]))/max(1,hi-lo)
            snare=float(np.mean(activity[0,lo:hi]))
            if own<total*.22 or (own<snare*.18 and p in [42,46]):continue
            time=max(0,frame*.005-.005)
            if time>=len(source)/SR-.02:continue
            # One cymbal interpretation per near-simultaneous template event.
            strength=float(np.clip(rise[frame]/rise.max(),0,1))
            evidence.append(dict(time=time,pitch=p,strength=strength,share=own/max(total,1e-9),score=own))
    groups=[]
    for event in sorted(evidence,key=lambda e:e['time']):
        if groups and event['time']-groups[-1][0]['time']<=.025:groups[-1].append(event)
        else:groups.append([event])
    crash_scores=[e['score'] for e in evidence if e['pitch']==49]
    crash_floor=float(np.percentile(crash_scores,85)) if crash_scores else float('inf')
    last={}
    for group in groups:
        ranked=sorted(group,key=lambda e:e['score'],reverse=True)
        event=next((e for e in ranked if e['pitch']!=49 or (e['strength']>=.6 and e['score']>=crash_floor)),None)
        if event is None:continue
        p=event['pitch'];time=event['time'];spacing=.5 if p==49 else .08 if p==51 else .04
        if time-last.get(p,-10)<spacing:continue
        last[p]=time
        held={42:.06,46:.35,49:1.2,51:.65}[p]
        notes.append([time,min(len(source)/SR,time+held),p,event['strength']])
    for i,n in enumerate(notes):
        following=next((v[0] for v in notes[i+1:] if v[2]==n[2]),len(source)/SR)
        n[1]=min(n[1],following)
    return notes,evidence

def fuller(evidence,seconds):
    groups=[]
    for e in sorted(evidence,key=lambda e:e['time']):
        if groups and e['time']-groups[-1][0]['time']<=.025:groups[-1].append(e)
        else:groups.append([e])
    notes=[];last={}
    for group in groups:
        e=max(group,key=lambda e:e['score']);p=e['pitch'];time=e['time']
        # Drop the previous top15% crash filter, while retaining per-voice repeat limits.
        if e['share']<.22 or e['strength']<.10:continue
        spacing=.20 if p==49 else .065 if p==51 else .035
        if time-last.get(p,-10)<spacing:continue
        last[p]=time
        notes.append([time,min(seconds,time+{42:.08,46:.5,49:1.8,51:1.0}[p]),p,e['strength']])
    for i,n in enumerate(notes):n[1]=min(n[1],next((v[0] for v in notes[i+1:] if v[2]==n[2]),seconds))
    return notes

def trim(notes,seconds):
    removed=[];eligible=[]
    for i,n in enumerate(notes):
        if n[2] in [49,51] and n[3]<.20:
            removed.append(dict(index=i,note=n,reason='weak crash/ride evidence'))
        else:eligible.append((i,list(n)))
    # Strongest metal event wins over a substantially weaker neighboring label.
    keep=[]
    for i,n in sorted(eligible,key=lambda item:item[1][3],reverse=True):
        reason=None
        if n[2] in [49,51]:
            for _,other in keep:
                delta=abs(n[0]-other[0])
                if other[2]==n[2] and delta<(.30 if n[2]==49 else .09):reason='same-voice retrigger';break
                if other[2] in [49,51] and delta<.10 and n[3]<other[3]*.65:reason='weaker neighboring metal label';break
        if reason:removed.append(dict(index=i,note=n,reason=reason))
        else:keep.append((i,n))
    keep.sort(key=lambda item:item[1][0]);result=[n for _,n in keep]
    # Restore ringing time when an intervening false trigger was removed.
    for i,n in enumerate(result):
        next_time=next((v[0] for v in result[i+1:] if v[2]==n[2]),seconds)
        n[1]=min(seconds,n[0]+{42:.08,46:.5,49:1.8,51:1.0}[n[2]],next_time)
    return result,removed

def levels_from_source(source,notes):
    levels=[0]*len(notes)
    for pitch,lo,hi,floor in [(36,35,170,50),(38,180,4000,35)]:
        band=sosfilt(butter(3,[lo,hi],'bandpass',fs=SR,output='sos'),source)
        indices=[i for i,n in enumerate(notes) if n[2]==pitch];strengths=[]
        if not indices:continue
        for i in indices:
            start=round(notes[i][0]*SR);end=min(len(band),start+round(.055*SR))
            segment=band[start:end]
            strengths.append(float(np.sqrt(np.mean(segment**2))) if len(segment) else 0)
        ref=max(float(np.percentile(strengths,90)),1e-9)
        for i,value in zip(indices,strengths):levels[i]=int(round(floor+(115-floor)*np.clip(value/ref,0,1)**.8))
    return levels

def render_rock(path,seconds,root):
    from arrangement_replacement import drum_hits,render_soundfont
    sys.path.insert(0,str(root/'data/transcription-packages'))
    import pretty_midi
    source,_=librosa.load(path,sr=SR,duration=seconds)
    if not np.isfinite(source).all() or len(source)<1024:raise ValueError('Choose an audible drum section.')
    original=drum_hits(source,seconds)
    low=[n for n in original if n[2] in [36,38]]
    templates={p:render_soundfont([[.04,.1,p,.8]],1.25,root,16,0,percussion=True) for p in [38,42,46,49,51]}
    strict,evidence=analyze(source,templates)
    cymbal_notes,_=trim(fuller(evidence,seconds),seconds)
    levels=levels_from_source(source,low)
    cymbal_levels=[int(round(55+55*np.sqrt(n[3]))) for n in cymbal_notes]
    old_drums=render_soundfont(low,seconds,root,16,0,percussion=True)
    drums=render_soundfont(low,seconds,root,16,0,percussion=True,midi_velocities=levels)
    rms=lambda x:float(np.sqrt(np.mean(x*x)))
    drums*=rms(old_drums)/max(rms(drums),1e-9)
    cymbals=render_soundfont(cymbal_notes,seconds,root,16,0,percussion=True,midi_velocities=cymbal_levels)
    reference_cymbals=render_soundfont(strict,seconds,root,16,0,percussion=True)
    high=sosfilt(butter(3,3500,'highpass',fs=SR,output='sos'),source)
    balance=min(2.,max(.5,(rms(high)/max(rms(source),1e-9))*rms(old_drums)/max(rms(reference_cymbals),1e-9)))
    audio=drums+cymbals*balance*10**(-6/20)
    if not np.isfinite(audio).all() or rms(audio)<1e-7:raise ValueError('No usable rock drum performance detected.')
    audio*=min(1,.95/max(float(np.max(np.abs(audio))),1e-9))
    midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=16,is_drum=True)
    # MIDI stores detected hits/velocities; calibrated audio lane gains are in rendered audio.
    pairs=sorted(list(zip(low,levels))+list(zip(cymbal_notes,cymbal_levels)),key=lambda p:(p[0][0],p[0][2]))
    for (a,b,p,_),v in pairs:track.notes.append(pretty_midi.Note(velocity=v,pitch=p,start=a,end=b))
    midi.instruments.append(track)
    return audio,midi,[n for n,v in pairs]
