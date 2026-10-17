"""Bass-specific fundamental tracking audition. Does not change app routing."""
import json,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import median_filter
from arrangement_replacement import render,render_soundfont,SR
ROOT=Path('C:/AI/ManaAI-CV-2')

def detect(source,seconds):
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

def main():
    out=ROOT/'exports/singing/bass-performance-2026-10-15';out.mkdir(exist_ok=True)
    source=ROOT/'exports/singing/arrangement-1791744247383209600/bass.wav'
    x,_=librosa.load(source,sr=SR,duration=19)
    baseline,_,old=render(source,19,ROOT,'finger-bass',bank='livehq',source_name='bass')
    notes,velocities=detect(x,19)
    candidates={'original-bass':x,'previous-finger-bass':baseline,
                'candidate-finger-bass':render_soundfont(notes,19,ROOT,33,0,midi_velocities=velocities),
                'candidate-picked-bass':render_soundfont(notes,19,ROOT,34,0,midi_velocities=velocities)}
    results=[]
    for name,audio in candidates.items():
        assert audio.shape==(19*SR,) and np.isfinite(audio).all()
        gain=min(.065/max(float(np.sqrt(np.mean(audio**2))),1e-9),.9/max(float(np.max(np.abs(audio))),1e-9))
        sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),audio[9*SR:19*SR]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(audio*gain)))))
    report=dict(source=str(source),old_note_count=len(old),candidate_note_count=len(notes),notes=notes,velocities=velocities,results=results,method='pYIN30.87–246.95Hz low-register fundamental tracking, light median smoothing, only <=30ms matching-pitch dropout fill, envelope-supported restrikes, source RMS-based MIDI22–105. No automatic octave folding, no original blended into candidates. LiveHQ programs33/34. Audition only; extraction artifacts can affect pitch.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['old_note_count','candidate_note_count','results']},indent=2))

if __name__=='__main__':main()
