"""Offline melodic-voice selection and softer sax articulation comparison."""
import json, re, base64, io
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter,sosfilt
from scipy.ndimage import median_filter
from arrangement_band import SR

root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/guitar-midi-sax-audition'
out=root/'exports/singing/sampled-sax-audition';out.mkdir(parents=True,exist_ok=True)
events=json.loads((source/'note-events.json').read_text())
duration=12;hop=.01;frames=round(duration/hop)
pitches=np.array([0]+sorted({int(e[2]) for e in events}))
energy=np.zeros((frames,len(pitches)))
for begin,end,pitch,amplitude,*_ in events:
    if end-begin<.075 or amplitude<.32:continue
    a=max(0,round(begin/hop));b=min(frames,round(end/hop))
    k=int(np.where(pitches==pitch)[0][0]);energy[a:b,k]=np.maximum(energy[a:b,k],amplitude)
# Add direct fundamental support from the isolated guitar to discourage octave harmonics.
guitar,_=librosa.load(source/'isolated-guitar.wav',sr=SR,duration=duration)
spectrum=np.abs(librosa.stft(guitar,n_fft=2048,hop_length=240))
freqs=librosa.fft_frequencies(sr=SR,n_fft=2048)
support=np.zeros_like(energy)
for k,pitch in enumerate(pitches[1:],1):
 frequency=librosa.midi_to_hz(int(pitch));bins=np.where(np.abs(freqs-frequency)<max(18,frequency*.035))[0]
 if len(bins):
  values=spectrum[bins].max(axis=0);count=min(frames,len(values));support[:count,k]=values[:count]
support/=np.maximum(support.max(axis=1,keepdims=True),.001)
# Prefer sustained, confident notes with a continuous register over first-arriving chord notes.
emission=energy*3-.7+support*.22*(energy>0)
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
    if line[first]>0 and (frame-first)*hop>=.075:
        confidence=float(energy[first:frame,int(np.where(pitches==line[first])[0][0])].mean())
        notes.append([first*hop,frame*hop,int(line[first]),confidence])
    first=frame
# One fixed octave placement for sax; no per-note octave folding.
shift=12 if notes and np.median([n[2] for n in notes])<58 else 0
rng=np.random.default_rng(42)
bank_text=(root/'data/instrument-samples/FluidR3_GM/alto_sax-mp3.js').read_text()
match=re.search(r'MIDI\.Soundfont\.alto_sax\s*=\s*(\{.*\})',bank_text,re.S)
if not match:raise ValueError('Sax bank format is not recognized.')
bank=json.loads(re.sub(r',\s*}', '}', match.group(1)))
cache={}
def sax(pitch,seconds,velocity):
 key=librosa.midi_to_note(int(pitch),unicode=False)
 for sharp,flat in [('C#','Db'),('D#','Eb'),('F#','Gb'),('G#','Ab'),('A#','Bb')]:key=key.replace(sharp,flat)
 if key not in cache:
  raw=base64.b64decode(bank[key].split(',',1)[1]);audio,rate=sf.read(io.BytesIO(raw))
  if audio.ndim>1:audio=audio.mean(axis=1)
  if rate!=SR:audio=librosa.resample(audio,orig_sr=rate,target_sr=SR)
  cache[key]=audio
 sample=cache[key];count=round(seconds*SR);signal=np.zeros(count)
 n=min(count,len(sample));signal[:n]=sample[:n]
 t=np.arange(count)/SR
 envelope=np.minimum(t/.008,1)*np.minimum(np.maximum(seconds-t,0)/.045,1)
 return signal*envelope*(.7+.3*np.clip(velocity,0,1))

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
sf.write(out/'mana-sampled-sax-refined.wav',mixed,SR,subtype='PCM_16')
sf.write(out/'sampled-sax-solo.wav',melody*.8/max(np.max(np.abs(melody)),.001),SR,subtype='PCM_16')
assert len(mixed)/SR==duration and np.isfinite(mixed).all() and np.max(np.abs(mixed))<=.951
(out/'analysis.json').write_text(json.dumps(dict(notes=notes,octaveShift=shift,approved=False,method='continuity plus isolated-guitar fundamental support; sampled FluidR3_GM alto sax; no beat quantization'),indent=2))
print('Saved refined sax; notes:',len(notes),'fixed octave shift:',shift,flush=True)

# Same prior notes with the new instrument: isolates timbre from note-selection changes.
previous=json.loads((root/'exports/singing/refined-sax-audition/analysis.json').read_text())
comparison=np.zeros(size)
for begin,end,pitch,velocity in previous['notes']:
 signal=sax(pitch+previous['octaveShift'],end-begin,velocity);offset=round(begin*SR);count=min(len(signal),size-offset)
 comparison[offset:offset+count]+=signal[:count]
control=vocal+residual*level*.28/rms(residual)+comparison*level*.25/rms(comparison)
control*=min(1,.95/max(float(np.max(np.abs(control))),.001))
sf.write(out/'mana-sampled-sax-same-notes.wav',control,SR,subtype='PCM_16')
print('Saved sample-based sax comparison; sample notes loaded:',len(cache),flush=True)
