"""Recognition experiment: estimated lead plus optional retained original backing.
Dense polyphonic pitch estimates are approximate; never replaces approved files.
"""
import json
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.ndimage import median_filter
from arrangement_job import run, SR
from arrangement_band import tone

root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791717415984'
out=root/'exports/singing/riff-preservation-audition'
out.mkdir(parents=True,exist_ok=True)
result=json.loads((source/'result.json').read_text())
seconds=12
baseline=run(dict(style='rock',start=0,seconds=seconds,vocal=result['vocal'],instrumental=str(source/'instrumental.wav'),output=str(out/'baseline')))
vocal,_=sf.read(baseline['vocal'])
backing,_=sf.read(out/'baseline/instrumental.wav')
original,_=librosa.load(source/'instrumental.wav',sr=SR,offset=0,duration=seconds)
original=original[:len(vocal)]
print('Estimating the prominent instrumental line…',flush=True)
harmonic=librosa.effects.harmonic(original)
pitch,magnitude=librosa.piptrack(y=harmonic,sr=SR,n_fft=2048,hop_length=256,fmin=160,fmax=1500,threshold=.2)
indices=np.argmax(magnitude,axis=0)
frequencies=pitch[indices,np.arange(pitch.shape[1])]
strength=magnitude[indices,np.arange(pitch.shape[1])]
midi=np.zeros(len(frequencies),dtype=int)
voiced=(frequencies>0)&(strength>max(float(np.max(strength))*.08,.001))
midi[voiced]=np.rint(librosa.hz_to_midi(frequencies[voiced])).astype(int)
midi=median_filter(midi,size=5)
lead=np.zeros(len(vocal));notes=[];rng=np.random.default_rng(42)
first=0
for frame in range(1,len(midi)+1):
    if frame<len(midi) and midi[frame]==midi[first]:continue
    begin=first*256/SR;end=min(frame*256/SR,seconds)
    if midi[first]>0 and end-begin>=.055:
        signal=tone(int(midi[first]),end-begin,'guitar',rng)
        offset=round(begin*SR);count=min(len(signal),len(lead)-offset)
        if count>0:lead[offset:offset+count]+=signal[:count]
        notes.append(dict(start=begin,end=end,midi=int(midi[first])))
    first=frame

def match(signal,target):
    return signal*target/max(float(np.sqrt(np.mean(signal**2))),.001)

level=max(float(np.sqrt(np.mean(vocal**2))),.001)
def save(name,signal):
    mixed=vocal+signal
    mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001))
    sf.write(out/(name+'.wav'),mixed,SR,subtype='PCM_16')
    assert len(mixed)/SR==seconds and np.max(np.abs(mixed))<=.951

save('original-reference',match(original,level*.42))
save('current-rock',backing)
rebuilt=match(backing,level*.22)+match(lead,level*.26)
save('rock-with-estimated-riff',rebuilt)
# Hybrid intentionally keeps part of the source instruments to retain their exact riffs.
save('rock-hybrid-preserved',match(original,level*.32)+match(rebuilt,level*.22))
(out/'analysis.json').write_text(json.dumps(dict(source=str(source),seconds=seconds,notes=notes,approved=False,hybridRetainsOriginal=True),indent=2))
print('Saved four comparison mixes; estimated lead notes:',len(notes),flush=True)
