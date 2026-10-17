"""Source-led sax phrasing audition on the user-approved Elvis extraction."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
from arrangement_replacement import SR,render,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2')

def detect(source,seconds):
    rate=12000;hop=60;step=.005
    low=librosa.resample(source,orig_sr=SR,target_sr=rate)
    low=sosfiltfilt(butter(3,[100,2200],'bandpass',fs=rate,output='sos'),low)
    f0,_,prob=librosa.pyin(low,fmin=110,fmax=1000,sr=rate,frame_length=1024,hop_length=hop,fill_na=np.nan)
    rms=librosa.feature.rms(y=low,frame_length=512,hop_length=hop)[0]
    count=min(len(f0),len(rms));keys=np.zeros(count,dtype=int)
    valid=np.isfinite(f0[:count])&(prob[:count]>=.12)&(rms[:count]>max(rms.max()*.025,1e-6))
    keys[valid]=np.rint(librosa.hz_to_midi(f0[:count][valid])).astype(int)
    keys=median_filter(keys,size=3)
    # Brief same-key pitch-estimation dropouts should not become a new breath.
    for i in range(1,count-16):
        if keys[i]!=0 or keys[i-1]==0:continue
        for gap in range(1,17):
            if keys[i+gap]==keys[i-1] and np.min(rms[i:i+gap])>rms.max()*.035:
                keys[i:i+gap]=keys[i-1];break
            if keys[i+gap]>0:break
    notes=[];first=0
    for frame in range(1,count+1):
        if frame<count and keys[frame]==keys[first]:continue
        if keys[first] and (frame-first)*step>=.05:
            notes.append([first*step,min(seconds,frame*step),int(keys[first]),float(np.mean(prob[first:frame]))])
        first=frame
    if not notes:raise ValueError('No clear sax notes detected.')
    original=[list(n) for n in notes];connections=0
    for i,n in enumerate(notes[:-1]):
        next_note=notes[i+1];gap=next_note[0]-n[1]
        a=max(0,round((n[1]-.02)/step));b=min(len(rms),round((next_note[0]+.02)/step))
        if 0<=gap<=.09 and n[2]!=next_note[2] and b>a and np.min(rms[a:b])>rms.max()*.04:
            n[1]=min(seconds,next_note[0]+.025);connections+=1
    strengths=[]
    for a,b,_,_ in notes:
        segment=source[round((a+.01)*SR):max(round((a+.01)*SR)+1,round(min(b,a+.14)*SR))]
        strengths.append(float(np.sqrt(np.mean(segment*segment))))
    ref=max(float(np.percentile(strengths,90)),1e-9)
    velocities=[int(round(25+80*np.clip(v/ref,0,1))) for v in strengths]
    return notes,velocities,dict(connected_notes=connections,before_connections=original)

def main():
    source=ROOT/'exports/singing/sax-demucs-elvis-audition/song-Sax.wav'
    x,_=librosa.load(source,sr=SR,duration=15)
    source_frames=len(x)
    if abs(source_frames-15*SR)>4:raise ValueError(f'Unexpected source duration: {source_frames} frames')
    x=librosa.util.fix_length(x,size=15*SR)
    baseline,_,old=render(source,15,ROOT,'sax',bank='separate',source_name='sax-extracted')
    notes,velocities,details=detect(x,15)
    candidate=render_separate(notes,15,ROOT,'sax',0,None,midi_velocities=velocities)
    out=ROOT/'exports/singing/sax-phrasing-elvis-2026-10-16';out.mkdir(exist_ok=True)
    results=[]
    for name,audio in [('original-extracted-sax',x),('previous-sax',baseline),('phrased-sax',candidate)]:
        assert audio.shape==(360000,) and np.isfinite(audio).all(), (name,audio.shape,bool(np.isfinite(audio).all()))
        gain=min(.065/max(float(np.sqrt(np.mean(audio*audio))),1e-9),.9/max(float(np.max(np.abs(audio))),1e-9))
        sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(audio*gain)))))
    report=dict(source=str(source),source_resampled_frames=source_frames,song_start=60,song_end=75,old_notes=len(old),notes=notes,velocities=velocities,details=details,results=results,method='Same Weresax patch, source110–1000Hz pYIN at5ms hop/1024frame,15ms median/min50ms notes. Bridge<=80ms same-key dropout only over source energy; connect neighboring different-key gaps<=90ms with25ms overlap only when source has continuous energy. Source-based velocities25–105, no fixed octave shift. Actual breaths preserved by gate; mixed bleed can still mislead. No source blended. Audition only, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(old_notes=len(old),candidate_notes=len(notes),connected_notes=details['connected_notes'],pitch_range=[min(n[2] for n in notes),max(n[2] for n in notes)],results=results),indent=2))

if __name__=='__main__':main()
