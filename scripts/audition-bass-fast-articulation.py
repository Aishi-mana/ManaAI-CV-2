"""Source-guided fast bass attack alignment and false same-key retrigger repair."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def refine(source,notes,velocities):
    low=sosfiltfilt(butter(3,550,'lowpass',fs=SR,output='sos'),source)
    attacks=librosa.onset.onset_detect(y=low,sr=SR,hop_length=60,units='time',backtrack=True)
    rms=librosa.feature.rms(y=low,frame_length=256,hop_length=60)[0]
    result=[];levels=[];edits=[]
    for i,(original,velocity) in enumerate(zip(notes,velocities)):
        n=list(original);a,b,p,confidence=n
        if a<9.36:result.append(n);levels.append(velocity);continue
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
        if previous and previous[0]>=9.36 and previous[2]==p and -.002<=n[0]-previous[1]<=.04 and not has_attack and gap_energy:
            previous[1]=max(previous[1],n[1]);edits.append(dict(kind='merge-detector-retrigger',start=n[0],pitch=p))
        else:result.append(n);levels.append(velocity)
    return result,levels,edits

def render(notes,velocities,root,program):
    audio=np.zeros(19*SR,dtype=np.float32)
    for scale,indices in [(4,[i for i,n in enumerate(notes) if n[1]-n[0]>=.15]),(1.5,[i for i,n in enumerate(notes) if n[1]-n[0]<.15])]:
        if indices:audio+=render_soundfont([notes[i] for i in indices],19,root,program,0,midi_velocities=[velocities[i] for i in indices],release_scale=scale)
    return audio

def main():
    base=ROOT/'exports/singing/bass-fast-riffs-2026-10-15'
    old=json.loads((base/'report.json').read_text(encoding='utf-8'))
    source,_=librosa.load(ROOT/'exports/singing/arrangement-1791744247383209600/bass.wav',sr=SR,duration=19)
    snapshot=json.dumps(old['notes']);notes,velocities,edits=refine(source,old['notes'],old['velocities'])
    assert snapshot==json.dumps(old['notes']) and len(notes)==len(velocities)
    assert all(b>a and 0<=a<b<=19.001 for a,b,_,_ in notes)
    out=ROOT/'exports/singing/bass-fast-articulation-2026-10-15';out.mkdir(exist_ok=True)
    results=[]
    for name,program in [('finger-refined',33),('picked-refined',34)]:
        x=render(notes,velocities,ROOT,program)
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    import shutil
    shutil.copyfile(base/'original-9-19.wav',out/'original-9-19.wav')
    shutil.copyfile(base/'fast-short-tails-9-19.wav',out/'previous-short-tails-9-19.wav')
    report=dict(notes=notes,velocities=velocities,edits=edits,results=results,method='Fast-run candidate retained, pitches unchanged. Source low-band attack alignment -55/+15ms only at envelope rise, earlier phrase before9.36 unchanged. Merge same-pitch detector gaps<=40ms only without nearby measured pick. Quick<150ms notes1.5xrelease, sustained4x. Merging can change tail class. Not pitch correction; no original blended; source separation can mislead attack detection. Audition only, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(old_count=len(old['notes']),new_count=len(notes),edits=edits),indent=2))

if __name__=='__main__':main()
