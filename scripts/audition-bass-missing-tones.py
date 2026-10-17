"""Recover short source-supported notes only in the accepted bass MIDI gaps."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
from arrangement_replacement import render_soundfont,SR
ROOT=Path('C:/AI/ManaAI-CV-2')

def recover(source,notes,seconds):
    low=librosa.resample(source,orig_sr=SR,target_sr=12000)
    low=sosfiltfilt(butter(3,700,'lowpass',fs=12000,output='sos'),low)
    f0,_,prob=librosa.pyin(low,fmin=30.87,fmax=246.95,sr=12000,frame_length=2048,hop_length=60,fill_na=np.nan)
    yin=librosa.yin(low,fmin=30.87,fmax=246.95,sr=12000,frame_length=2048,hop_length=60)
    rms=librosa.feature.rms(y=low,frame_length=512,hop_length=60)[0]
    count=min(len(f0),len(yin),len(rms));pitches=np.zeros(count,dtype=int)
    valid=np.isfinite(f0[:count])&(prob[:count]>=.20)&(rms[:count]>max(rms.max()*.04,1e-6))
    pitches[valid]=np.rint(librosa.hz_to_midi(f0[:count][valid])).astype(int)
    pitches=median_filter(pitches,size=3)
    agreement=librosa.hz_to_midi(yin[:count])
    # Never replace or retrigger an accepted note. Search uncovered spans only.
    covered=np.zeros(count,dtype=bool)
    for a,b,_,_ in notes:covered[max(0,round(a/.005)):min(count,round(b/.005))]=True
    pitches[covered]=0
    added=[];first=0
    for frame in range(1,count+1):
        if frame<count and pitches[frame]==pitches[first]:continue
        p=int(pitches[first]);a=first*.005;b=min(seconds,frame*.005)
        if p and b-a>=.045:
            support=float(np.mean(np.abs(agreement[first:frame]-p)<.55))
            confidence=float(np.mean(prob[first:frame]))
            # Same-pitch gaps may be a decay/dropout rather than a new picked note.
            neighbors=[n for n in notes if abs(n[1]-a)<.03 or abs(n[0]-b)<.03]
            if support>=.65 and not any(n[2]==p for n in neighbors):
                added.append([a,b,p,confidence])
        first=frame
    return added

def main():
    base=ROOT/'exports/singing/bass-phrase-review-2026-10-15'
    data=json.loads((base/'report.json').read_text(encoding='utf-8'))
    source,_=librosa.load(ROOT/'exports/singing/arrangement-1791744247383209600/bass.wav',sr=SR,duration=19)
    added=recover(source,data['notes'],19)
    pairs=[(list(n),v) for n,v in zip(data['notes'],data['velocities'])]
    original_pairs=list(pairs)
    strengths=[float(np.sqrt(np.mean(source[round(n[0]*SR):round(n[1]*SR)]**2))) for n in data['notes']]
    ref=max(float(np.percentile(strengths,90)),1e-9)
    for n in added:
        strength=float(np.sqrt(np.mean(source[round(n[0]*SR):round(n[1]*SR)]**2)))
        pairs.append((n,int(round(18+78*np.clip(strength/ref,0,1)))))
    pairs.sort(key=lambda pair:pair[0][0]);notes=[n for n,v in pairs];velocities=[v for n,v in pairs]
    assert all((n,v) in pairs for n,v in original_pairs)
    out=ROOT/'exports/singing/bass-missing-tones-2026-10-15';out.mkdir(exist_ok=True)
    results=[]
    for name,program in [('finger-recovered',33),('picked-recovered',34)]:
        audio=render_soundfont(notes,19,ROOT,program,0,midi_velocities=velocities,release_scale=4)
        assert audio.shape==(456000,) and np.isfinite(audio).all()
        gain=min(.065/max(float(np.sqrt(np.mean(audio**2))),1e-9),.9/max(float(np.max(np.abs(audio))),1e-9))
        sf.write(out/(name+'.wav'),audio*gain,SR)
        sf.write(out/(name+'-9-19.wav'),audio[216000:456000]*gain,SR)
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(audio*gain)))))
    import shutil
    shutil.copyfile(base/'original-9-19.wav',out/'original-9-19.wav')
    report=dict(notes=notes,velocities=velocities,added=added,previous_count=len(data['notes']),results=results,method='Accepted attack-corrected44notes and velocities unchanged,4xrelease. Recover uncovered45ms+ runs from5ms pYIN with>=.2confidence, source energy and>=65%YIN agreement within55cents. Reject same-pitch immediate neighbors to avoid retriggering release tails. New notes use softer source-derived velocities. No original blended; extraction bleed can still cause false notes; audition only.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(added=added,total=len(notes)),indent=2))

if __name__=='__main__':main()
