"""Offline melodic-voice selection and softer sax articulation comparison."""
import json
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter,sosfilt
from scipy.ndimage import median_filter
from arrangement_band import SR

root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/guitar-midi-sax-audition'
out=root/'exports/singing/refined-sax-audition';out.mkdir(parents=True,exist_ok=True)
events=json.loads((source/'note-events.json').read_text())
duration=12;hop=.02;frames=round(duration/hop)
pitches=np.array([0]+sorted({int(e[2]) for e in events}))
energy=np.zeros((frames,len(pitches)))
for begin,end,pitch,amplitude,*_ in events:
    if end-begin<.1 or amplitude<.3:continue
    a=max(0,round(begin/hop));b=min(frames,round(end/hop))
    k=int(np.where(pitches==pitch)[0][0]);energy[a:b,k]=np.maximum(energy[a:b,k],amplitude)
# Prefer sustained, confident notes with a continuous register over first-arriving chord notes.
emission=energy*3-.7
emission[:,0]=np.where(energy.max(axis=1)>.3,-.7,.3)
emission[:,1:]+=np.clip((pitches[1:]-48)/24,0,1)*.18
distance=np.abs(pitches[:,None]-pitches[None,:])
transition=np.minimum(distance*.035,.55)
transition[0,:]=.18;transition[:,0]=.18;np.fill_diagonal(transition,0)
scores=emission[0].copy();history=np.zeros((frames,len(pitches)),dtype=int)
for frame in range(1,frames):
    candidates=scores[:,None]-transition
    history[frame]=candidates.argmax(axis=0)
    scores=candidates.max(axis=0)+emission[frame]
path=np.zeros(frames,dtype=int);path[-1]=scores.argmax()
for frame in range(frames-1,0,-1):path[frame-1]=history[frame,path[frame]]
line=median_filter(pitches[path],size=3)
notes=[];first=0
for frame in range(1,frames+1):
    if frame<frames and line[frame]==line[first]:continue
    if line[first]>0 and (frame-first)*hop>=.1:
        confidence=float(energy[first:frame,int(np.where(pitches==line[first])[0][0])].mean())
        notes.append([first*hop,frame*hop,int(line[first]),confidence])
    first=frame
# One fixed octave placement for sax; no per-note octave folding.
shift=12 if notes and np.median([n[2] for n in notes])<58 else 0
rng=np.random.default_rng(42)
def sax(pitch,seconds,velocity):
    t=np.arange(round(seconds*SR))/SR
    f=440*2**((pitch-69)/12)
    vibrato=.0025*np.sin(2*np.pi*5*t)*np.clip((t-.16)/.2,0,1)
    phase=2*np.pi*f*np.cumsum(1+vibrato)/SR
    tone=np.zeros(len(t))
    for h in range(1,18):
        hz=f*h;colour=.3+.8*np.exp(-((hz-750)/550)**2)+.2*np.exp(-((hz-1800)/700)**2)
        tone+=np.sin(phase*h)*colour/h**1.35
    tone=sosfilt(butter(2,3200,fs=SR,output='sos'),tone)
    tone/=max(np.max(np.abs(tone)),.001)
    attack=np.sin(np.minimum(t/.035,1)*np.pi/2)**2
    release=np.sin(np.minimum(np.maximum(seconds-t,0)/.055,1)*np.pi/2)**2
    swell=.85+.15*np.sin(np.minimum(t/max(seconds,.01),1)*np.pi)
    return tone*attack*release*swell*(.7+.3*np.clip(velocity,0,1))

melody=np.zeros(duration*SR)
for begin,end,pitch,velocity in notes:
    signal=sax(pitch+shift,end-begin,velocity);start=round(begin*SR)
    count=min(len(signal),len(melody)-start);melody[start:start+count]+=signal[:count]
original= root/'exports/singing/1791717415984'
result=json.loads((original/'result.json').read_text())
vocal,_=librosa.load(result['vocal'],sr=SR,duration=duration)
residual,_=librosa.load(source/'remaining-original-instruments.wav',sr=SR,duration=duration)
size=min(len(vocal),len(residual),len(melody));vocal=vocal[:size];residual=residual[:size];melody=melody[:size]
def rms(a):return max(float(np.sqrt(np.mean(a*a))),.001)
level=rms(vocal)
mixed=vocal+residual*level*.28/rms(residual)+melody*level*.25/rms(melody)
mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001))
sf.write(out/'mana-refined-sax.wav',mixed,SR,subtype='PCM_16')
sf.write(out/'refined-sax-solo.wav',melody*.8/max(np.max(np.abs(melody)),.001),SR,subtype='PCM_16')
assert len(mixed)/SR==duration and np.isfinite(mixed).all() and np.max(np.abs(mixed))<=.951
(out/'analysis.json').write_text(json.dumps(dict(notes=notes,octaveShift=shift,approved=False,method='continuity-based note selection; softer synthetic reed; no beat quantization'),indent=2))
print('Saved refined sax; notes:',len(notes),'fixed octave shift:',shift,flush=True)
