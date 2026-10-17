"""Independent cymbal template audition, retaining previous kick/snare MIDI."""
import json
from pathlib import Path
from collections import Counter
import numpy as np
import librosa,soundfile as sf
from scipy.optimize import nnls
from scipy.signal import butter,sosfilt,find_peaks
from scipy.ndimage import median_filter
from arrangement_replacement import SR,drum_hits,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

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

def main():
    source,_=librosa.load(ROOT/'exports/singing/arrangement-1791744247383209600/drums.wav',sr=SR,duration=19)
    original=drum_hits(source,19);low=[n for n in original if n[2] in [36,38]]
    snapshot=json.dumps(low)
    templates={p:render_soundfont([[.04,.1,p,.8]],1.25,ROOT,16,0,percussion=True) for p in [38,42,46,49,51]}
    notes,evidence=analyze(source,templates)
    if not notes:raise ValueError('No supported cymbal candidates found.')
    cymbals=render_soundfont(notes,19,ROOT,16,0,percussion=True)
    kick_snare=render_soundfont(low,19,ROOT,16,0,percussion=True)
    assert snapshot==json.dumps(low)
    high=sosfilt(butter(3,3500,'highpass',fs=SR,output='sos'),source)
    rms=lambda x:float(np.sqrt(np.mean(x*x)))
    # Rough source high-range balance, capped because that range also contains snare hiss.
    cymbal_mix_gain=min(2.,max(.5,(rms(high)/max(rms(source),1e-9))*rms(kick_snare)/max(rms(cymbals),1e-9)))
    out=ROOT/'exports/singing/cymbal-layer-2026-10-16';out.mkdir(exist_ok=True)
    results=[]
    for name,x in [('source-high-range',high),('cymbal-candidates',cymbals),('previous-kick-snare',kick_snare),('combined-candidate',kick_snare+cymbals*cymbal_mix_gain),('original-drums',source)]:
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    report=dict(kick_snare=low,cymbals=notes,evidence=evidence,cymbal_mix_gain=cymbal_mix_gain,counts=dict(Counter(n[2] for n in notes)),results=results,method='Previous kick/snare notes and confidence velocities unchanged. Independent high-spectrum NNLS fit using local rock-kit snare/closedhat/openhat/crash/ride templates. Positive activity rises and dominant near-simultaneous class; only strong top15%crash evidence,500ms crash spacing. Held lengths closedhat60ms/openhat350ms/crash1.2s/ride650ms, capped before same-key retrigger. Replaces old generic closed-hat lane, not added on top. Rough source-high-range balance for mix capped.5–2x; high range includes snare hiss. Source-high-range is3500Hz highpass listening aid, not isolated cymbals. Template timbre mismatch can misclassify or miss cymbals. No source blended in reconstruction; no grid quantization; audition only/app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(previous_kick_snare=len(low),cymbal_counts=report['counts'],results=results),indent=2))

if __name__=='__main__':main()
