"""Fast bass-run audition, leaving accepted earlier sustained phrases intact."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

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

def main():
    old=json.loads((ROOT/'exports/singing/bass-phrase-review-2026-10-15/report.json').read_text(encoding='utf-8'))
    source,_=librosa.load(ROOT/'exports/singing/arrangement-1791744247383209600/bass.wav',sr=SR,duration=19)
    # Include context before the audition; preserve the previously accepted long note into9.36s.
    offset=8.8;start=9.36
    fast=detect_fast(source[round(offset*SR):])
    fast=[[max(start,a+offset),b+offset,p,c] for a,b,p,c in fast if b+offset>start+.025]
    fast=[n for n in fast if n[1]-n[0]>=.025]
    pairs=[(list(n),v) for n,v in zip(old['notes'],old['velocities']) if n[0]<start]
    strengths=[float(np.sqrt(np.mean(source[round(a*SR):max(round(a*SR)+1,round(min(b,a+.12)*SR))]**2))) for a,b,_,_ in fast]
    ref=max(float(np.percentile(strengths,90)),1e-9)
    pairs.extend((n,int(round(22+83*np.clip(v/ref,0,1)))) for n,v in zip(fast,strengths))
    pairs.sort(key=lambda item:item[0][0]);notes=[n for n,v in pairs];velocities=[v for n,v in pairs]
    out=ROOT/'exports/singing/bass-fast-riffs-2026-10-15';out.mkdir(exist_ok=True)
    def render(scale,subset=None):
        indices=list(range(len(notes))) if subset is None else subset
        return render_soundfont([notes[i] for i in indices],19,ROOT,33,0,midi_velocities=[velocities[i] for i in indices],release_scale=scale)
    sustained=[i for i,n in enumerate(notes) if n[1]-n[0]>=.15]
    quick=[i for i,n in enumerate(notes) if n[1]-n[0]<.15]
    clips={'original':source,'fast-fixed-4x':render(4),'fast-short-tails':render(4,sustained)+render(1.5,quick)}
    results=[]
    for name,x in clips.items():
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x**2))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    assert all(n[1]>n[0] and 23<=n[2]<=59 for n in notes)
    report=dict(notes=notes,velocities=velocities,fast_note_count=len(fast),quick_notes=len(quick),results=results,method='Only region9.36–19s uses shorter1024-frame pYIN,2.5ms hop,7.5ms median,min25ms notes,prob>=.08 and source energy gate. Same-key source rises may split45ms+ picks. Earlier accepted notes retained. Both candidates same MIDI; release fixed4x or1.5x on<150ms notes/4x sustained, mixed from separate renders. More permissive detection can add false notes or mistake slides for steps; no original blended. Audition only, production unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(previous_fast_count=sum(n[0]>=start for n in old['notes']),fast_count=len(fast),quick_count=len(quick),results=results),indent=2))

if __name__=='__main__':main()
