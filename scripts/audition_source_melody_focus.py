"""Filter original audio around cached melody pitches; no instrument synthesis."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import stft,istft
from scipy.ndimage import gaussian_filter
from flute_replacement import prepare_flute

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/arrangement-1791794436553863700'
out=root/'exports/singing/source-melody-focus-2026-10-16'
out.mkdir(exist_ok=True)
start,end=.8,8.5
x,sr=sf.read(base/'guitar-guide.wav')
if x.ndim>1:x=x.mean(axis=1)
x=x[:round(end*sr)]
notes=[n for n in json.loads((base/'notes.json').read_text()) if n[0]<end]
corrected,_,_=prepare_flute(notes,x,end,sr)
freq,times,z=stft(x,fs=sr,nperseg=4096,noverlap=4096-120)
mask=np.zeros(z.shape)
for i,(a,b,p,c) in enumerate(notes):
    p=corrected[i][2]
    # Follow one cached note at a time; do not retain its tail beneath the next note.
    b=min(b,notes[i+1][0] if i+1<len(notes) else end,end)
    frames=(times>=a)&(times<b)
    hz=440*2**((p-69)/12)
    profile=np.zeros(len(freq))
    for harmonic in range(1,17):
        centre=hz*harmonic
        if centre>min(7500,sr/2):break
        width=max(10,centre*.014)
        profile=np.maximum(profile,np.exp(-.5*((freq-centre)/width)**2))
    mask[:,frames]=np.maximum(mask[:,frames],profile[:,None])
mask=np.clip(gaussian_filter(mask,sigma=(.4,1.5)),0,1)
_,filtered=istft(z*mask,fs=sr,nperseg=4096,noverlap=4096-120)
filtered=filtered[:len(x)]
a,b=round(start*sr),round(end*sr)
original=x[a:b];focused=filtered[a:b]
assert original.shape==focused.shape and np.isfinite(focused).all()
assert np.sqrt(np.mean(focused**2))>1e-6
focused*=np.sqrt(np.mean(original**2))/np.sqrt(np.mean(focused**2))
gain=min(1.,.95/max(np.max(np.abs(original)),np.max(np.abs(focused)),1e-9))
sf.write(out/'original.wav',original*gain,sr)
sf.write(out/'melody-focused.wav',focused*gain,sr)
(out/'report.json').write_text(json.dumps(dict(source=str(base/'guitar-guide.wav'),passage=[start,end],method='Original-audio STFT harmonic mask following cached corrected melody pitches, one note window at a time, original phase retained. No synthesized replacement. RMS matched with shared peak protection.',limitations='Not clean source separation or ground-truth transcription. Follows existing note estimates; overlapping layers at shared harmonics remain and wanted tone/noise can be removed. Useful only as a listening aid, not independent proof of correct melody.'),indent=2))
print(out)
