"""Separate bass sustain repair from a steadier low-register melody candidate."""
import json,sys,runpy
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def extend(notes,source,seconds):
    hop=120
    spectrum=np.abs(librosa.cqt(source,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(23),n_bins=49))
    energy=librosa.feature.rms(y=source,frame_length=1024,hop_length=hop)[0]
    result=[list(n) for n in notes]
    for i,n in enumerate(result):
        a,b,p,_=n
        if not 23<=p<=71:continue
        first=round(b*SR/hop);on=max(0,round(a*SR/hop))
        ref=float(np.percentile(spectrum[p-23,on:max(on+1,first)],70))
        # Let the outgoing note ring briefly into a different pitch, never a same-key reattack.
        next_key=min((v[0] for v in notes[i+1:] if v[2]==p),default=seconds)
        next_attack=notes[i+1][0]+.08 if i+1<len(notes) else seconds
        limit=min(seconds,b+.35,next_key,next_attack)
        last=first
        for k in range(first+1,min(round(limit*SR/hop),spectrum.shape[1],len(energy))):
            if spectrum[p-23,k]<max(ref*.16,1e-7) or energy[k]<max(float(energy.max())*.03,1e-6):break
            last=k
        if last>first:n[1]=max(b,last*hop/SR)
    return result

def steadier(source,seconds):
    low=librosa.resample(source,orig_sr=SR,target_sr=12000)
    low=sosfiltfilt(butter(3,500,'lowpass',fs=12000,output='sos'),low)
    f0,voiced,prob=librosa.pyin(low,fmin=30.87,fmax=196,sr=12000,frame_length=4096,hop_length=120,fill_na=np.nan)
    rms=librosa.feature.rms(y=low,frame_length=1024,hop_length=120)[0]
    count=min(len(f0),len(rms));pitches=np.zeros(count,dtype=int)
    valid=np.isfinite(f0[:count])&(prob[:count]>=.08)&(rms[:count]>max(float(rms.max())*.03,1e-6))
    pitches[valid]=np.rint(librosa.hz_to_midi(f0[:count][valid])).astype(int)
    pitches=median_filter(pitches,size=5)
    for i in range(1,count-8):
        if pitches[i]==0 and pitches[i-1]>0:
            for gap in range(1,9):
                if pitches[i+gap]==pitches[i-1] and np.min(rms[i:i+gap])>rms.max()*.04:
                    pitches[i:i+gap]=pitches[i-1];break
                if pitches[i+gap]>0:break
    notes=[];first=0
    for frame in range(1,count+1):
        if frame<count and pitches[frame]==pitches[first]:continue
        if pitches[first] and frame-first>=7:
            notes.append([first*.01,min(seconds,frame*.01),int(pitches[first]),float(np.mean(prob[first:frame]))])
        first=frame
    # Long-window pitch is slower: align each boundary to nearby source attacks only.
    attacks=librosa.onset.onset_detect(y=source,sr=SR,hop_length=240,units='time')
    for i,n in enumerate(notes):
        possible=[float(a) for a in attacks if abs(a-n[0])<=.07 and a<n[1]-.06 and (i==0 or a>notes[i-1][0]+.06)]
        if possible:n[0]=min(possible,key=lambda a:abs(a-n[0]))
        if i and notes[i-1][1]>n[0]:notes[i-1][1]=max(notes[i-1][0]+.01,n[0])
    return notes

def velocities(notes,source):
    strengths=[float(np.sqrt(np.mean(source[round(a*SR):max(round(a*SR)+1,round(min(b,a+.16)*SR))]**2))) for a,b,_,_ in notes]
    ref=max(float(np.percentile(strengths,90)),1e-9)
    return [int(round(22+83*float(np.clip(v/ref,0,1)))) for v in strengths]

def main():
    base=ROOT/'exports/singing/bass-performance-2026-10-15'
    old=json.loads((base/'report.json').read_text(encoding='utf-8'))
    source,_=librosa.load(old['source'],sr=SR,duration=19)
    held=extend(old['notes'],source,19)
    revised=extend(steadier(source,19),source,19)
    assert all(n[1]>=b[1] and n[0]==b[0] and n[2]==b[2] for n,b in zip(held,old['notes']))
    assert old['notes']!=held and revised
    out=ROOT/'exports/singing/bass-sustain-melody-2026-10-15';out.mkdir(exist_ok=True)
    report=dict(hold_only=held,melody_candidate=revised,extended_notes=sum(n[1]>b[1] for n,b in zip(held,old['notes'])),results=[])
    clips={'original':source,'finger-hold-only':render_soundfont(held,19,ROOT,33,0,midi_velocities=old['velocities'])}
    for name,program in [('finger-melody-pass',33),('picked-melody-pass',34)]:
        clips[name]=render_soundfont(revised,19,ROOT,program,0,midi_velocities=velocities(revised,source))
    for name,x in clips.items():
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        report['results'].append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    report['method']='Hold-only keeps previous pitches/attacks; source-key CQT and RMS permit up to350ms extra, max80ms overlap into different next note, no same-key overlap. Melody pass uses4096-frame pYIN, lower dropout threshold, <=80ms same-pitch fill only over source energy, source-onset alignment within70ms. Longer window can blur fast changes; not verified ground truth. No original layered in. App unchanged.'
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(extended_notes=report['extended_notes'],old_notes=len(held),new_notes=len(revised),results=report['results']),indent=2))

if __name__=='__main__':main()
