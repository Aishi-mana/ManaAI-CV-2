"""First finer drum-transient audition. Heuristic classes, no production change."""
import json,sys
from collections import Counter
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfilt,find_peaks
from scipy.ndimage import median_filter
from arrangement_replacement import SR,drum_hits,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def detailed_hits(source,seconds):
    hop=60;step=hop/SR;frames=len(source)//hop
    if frames<4 or np.sqrt(np.mean(source**2))<1e-6:return []
    bands=[];attacks=[];peaks=[]
    for lo,hi in [(35,140),(140,450),(450,2200),(2200,5000),(5000,11000)]:
        signal=sosfilt(butter(3,[lo,hi],'bandpass',fs=SR,output='sos'),source)
        rms=np.sqrt(np.mean(signal[:frames*hop].reshape(frames,hop)**2,axis=1))
        level=median_filter(rms,size=3);bands.append(level)
        onset=np.maximum(level-np.r_[0,level[:-1]],0);attacks.append(onset)
        p,_=find_peaks(onset,height=max(float(onset.max())*.09,1e-6),prominence=max(float(onset.max())*.055,1e-6),distance=12)
        peaks.append(p)
    bands=np.array(bands);attacks=np.array(attacks)
    # Group close-band detections but keep separately detected kick and snare at one time.
    candidates=sorted(set(int(p) for group in peaks for p in group));groups=[]
    for frame in candidates:
        if groups and frame-groups[-1][0]<=4:groups[-1].append(frame)
        else:groups.append([frame])
    notes=[];last={};velocities=[]
    def add(time,pitch,strength):
        separation=.09 if pitch==36 else .055 if pitch==38 else .07 if pitch in [45,47,50] else .03
        if time-last.get(pitch,-10)<separation:return
        last[pitch]=time;notes.append([time,min(seconds,time+.04),pitch,float(np.clip(strength,0,1))])
    maxima=np.maximum(attacks.max(axis=1),1e-9)
    for group in groups:
        frame=max(group,key=lambda k:float(np.sum(attacks[:,k]/maxima)))
        a=max(0,frame-4);b=min(frames,frame+5)
        impulse=attacks[:,a:b].max(axis=1)/maxima
        level=bands[:,frame:min(frames,frame+12)].mean(axis=1)
        time=max(0,frame*step-.004)
        if time>=seconds-.02:continue
        kick=any(np.any(np.abs(peaks[0]-p)<=4) for p in group) and impulse[0]>=.10
        mid=any(np.any(np.abs(peaks[k]-frame)<=5) for k in [1,2,3])
        snare=False
        if kick:add(time,36,impulse[0])
        if mid and max(impulse[1:4])>=.13:
            segment=source[round(time*SR):min(len(source),round((time+.065)*SR))]
            power=np.abs(np.fft.rfft(segment*np.hanning(len(segment))))**2+1e-12
            flatness=float(np.exp(np.mean(np.log(power)))/np.mean(power))
            # Tom labels only when the middle transient is strongly low/tonal.
            if level[1]>max(level[2]*3.5,level[3]*6) and flatness<.03 and impulse[1]>.2 and impulse[4]<.25 and not kick:
                freq=librosa.fft_frequencies(sr=SR,n_fft=len(segment));valid=(freq>=100)&(freq<=450)
                f=float(freq[np.flatnonzero(valid)[np.argmax(power[valid])]])
                add(time,45 if f<160 else 47 if f<240 else 50,float(max(impulse[1:3])))
            elif level[2]+level[3]>level[0]*.5 and impulse[2]+impulse[3]>.25:
                add(time,38,float(max(impulse[2:4])));snare=True
        high=any(np.any(np.abs(peaks[4]-p)<=4) for p in group)
        if high and impulse[4]>=.10:
            # Reduce snare bleed becoming a duplicate hi-hat; preserve strong simultaneous highs.
            if snare and level[4]<level[3]*.70:continue
            peak=float(bands[4,frame:min(frames,frame+12)].max())
            tail=float(bands[4,min(frames-1,frame+24):min(frames,frame+72)].mean())
            ratio=tail/max(peak,1e-9)
            next_high=min((p for p in peaks[4] if p>frame+4),default=frames)
            space=(next_high-frame)*step
            pitch=49 if impulse[4]>.65 and ratio>.45 and space>.22 else 46 if ratio>.30 and space>.15 else 42
            add(time,pitch,impulse[4])
    notes.sort(key=lambda n:(n[0],n[2]))
    return notes

def main():
    source=ROOT/'exports/singing/arrangement-1791744247383209600/drums.wav'
    x,_=librosa.load(source,sr=SR,duration=19)
    old=drum_hits(x,19);notes=detailed_hits(x,19)
    assert notes and all(0<=a<b<=19 for a,b,_,_ in notes)
    velocities=[int(round(25+85*n[3])) for n in notes]
    out=ROOT/'exports/singing/drum-detail-2026-10-16';out.mkdir(exist_ok=True)
    clips={'original-drums':x,'previous-rock-kit':render_soundfont(old,19,ROOT,16,0,percussion=True),
           'detailed-rock-kit':render_soundfont(notes,19,ROOT,16,0,percussion=True,midi_velocities=velocities),
           'detailed-standard-kit':render_soundfont(notes,19,ROOT,0,0,percussion=True,midi_velocities=velocities)}
    results=[]
    for name,audio in clips.items():
        assert audio.shape==(456000,) and np.isfinite(audio).all()
        gain=min(.065/max(float(np.sqrt(np.mean(audio*audio))),1e-9),.9/max(float(np.max(np.abs(audio))),1e-9))
        sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),audio[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(audio*gain)))))
    report=dict(source=str(source),notes=notes,velocities=velocities,previous_counts=dict(Counter(n[2] for n in old)),candidate_counts=dict(Counter(n[2] for n in notes)),results=results,method='Five transient bands,2.5ms hop,band-peak30ms minimum then class-specific spacing:kick90ms/snare55ms/toms70ms/highs30ms (previousall60ms). Grouped detections permit simultaneous kick/snare; conservative tonal mid tom labels and high-tail closed/open/crash estimates. Reduced duplicate high/snare bleed. Source-relative MIDI25–110. Heuristic drum identities, not verified individual stems; no beat quantization/source blended. Audition only, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(previous=report['previous_counts'],candidate=report['candidate_counts'],results=results),indent=2))

if __name__=='__main__':main()
