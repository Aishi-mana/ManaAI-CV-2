"""Short lead-vocal melody to harmonica, no vocal conversion or separation rerun."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.ndimage import median_filter
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
source_path=root/'exports/singing/vocal-extraction-170s-2026-10-13/lead-vocal-raw.wav'
out=root/'exports/singing/whereabout-vocal-harmonica-2026-10-16'
out.mkdir(exist_ok=True)
seconds=12
source,_=librosa.load(source_path,sr=SR,duration=seconds)
seconds=len(source)/SR;hop=120
print('Tracking the short lead-vocal melody...',flush=True)
f0,voiced,prob=librosa.pyin(source,sr=SR,fmin=librosa.note_to_hz('C3'),fmax=librosa.note_to_hz('C6'),frame_length=2048,hop_length=hop,fill_na=np.nan)
valid=voiced & np.isfinite(f0) & (prob>=.45)
pitch=np.zeros(len(f0),dtype=int)
pitch[valid]=np.rint(librosa.hz_to_midi(f0[valid])).astype(int)
# Fill only tiny tracker holes; leave genuine breaths/rests silent.
for i in range(1,len(pitch)-1):
    if pitch[i]==0 and pitch[i-1]==pitch[i+1] and pitch[i-1]>0:pitch[i]=pitch[i-1]
line=median_filter(pitch,size=5)
notes=[];first=0
for i in range(1,len(line)+1):
    if i<len(line) and line[i]==line[first]:continue
    a,b=first*hop/SR,min(seconds,i*hop/SR)
    if line[first]>0 and b-a>=.08:
        confidence=float(np.mean(prob[first:i]))
        notes.append([a,b,int(line[first]),confidence])
    first=i
if not notes:raise ValueError('No stable sung melody in this section.')
strengths=[float(np.sqrt(np.mean(source[round(a*SR):round(b*SR)]**2))) for a,b,p,c in notes]
reference=max(float(np.percentile(strengths,85)),1e-9)
levels=[int(round(35+55*np.clip(s/reference,0,1))) for s in strengths]
audio=render_soundfont(notes,seconds,root,22,0,midi_velocities=levels,release_scale=1.2)
assert len(audio)==len(source) and np.isfinite(audio).all()
audio*=.1/max(1e-9,float(np.sqrt(np.mean(audio**2))))
vocal=source*(.1/max(1e-9,float(np.sqrt(np.mean(source**2)))))
gain=min(1.,.95/max(np.max(np.abs(vocal)),np.max(np.abs(audio)),1e-9))
sf.write(out/'lead-vocal.wav',vocal*gain,SR)
sf.write(out/'harmonica.wav',audio*gain,SR)
(out/'notes.json').write_text(json.dumps(notes,indent=2))
(out/'report.json').write_text(json.dumps(dict(source=str(source_path),song_start=170,seconds=seconds,notes=len(notes),method='Monophonic pYIN on existing Mega lead-only vocal; 5ms hop, voiced probability >=.45, 25ms pitch median, >=80ms notes. LiveHQ harmonica program22 at sung register, source RMS velocities35–90, 1.2x release. Vocal breaths retained; no accompaniment or synthesized voice. Separate listening RMS matching with shared peak cap. Pitch tracking can miss slides/vibrato/quiet notes; audition only.'),indent=2))
print(json.dumps(dict(output=str(out),notes=len(notes))),flush=True)
