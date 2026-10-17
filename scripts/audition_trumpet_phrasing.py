"""Small LiveHQ trumpet audition on the approved focused-guide melody."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont,SR

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/violin-focused-guide-2026-10-16'
out=root/'exports/singing/trumpet-phrasing-2026-10-16'
out.mkdir(exist_ok=True)
raw=json.loads((base/'notes.json').read_text())
source,sr=sf.read(base/'focused-original.wav')
assert sr==SR
seconds=len(source)/sr
notes=[list(n) for n in raw]
shift=12 if np.median([n[2] for n in raw])<60 else 0
plain=render_soundfont(raw,seconds,root,56,shift)
velocities=[]
for i,n in enumerate(notes):
    entrance=i==0 or n[0]-raw[i-1][1]>.12
    base_level=int(48+55*np.clip(n[3],0,1))
    velocities.append(max(1,min(127,round(base_level*(1.04 if entrance else .96)))))
    if i+1<len(notes):
        following=notes[i+1]
        if following[2]!=n[2] and 0<=following[0]-n[1]<=.06:n[1]=min(seconds,following[0]+.035)
candidate=render_soundfont(notes,seconds,root,56,shift,midi_velocities=velocities,release_scale=1.25)
assert all(a[0]==b[0] and a[2]==b[2] for a,b in zip(raw,notes))
assert len(candidate)==len(plain)==len(source) and np.isfinite(candidate).all() and np.isfinite(plain).all()
candidate*=np.sqrt(np.mean(plain**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(plain)),1e-9))
sf.write(out/'plain-trumpet.wav',plain*gain,SR)
sf.write(out/'phrased-trumpet.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(guide=str(base/'notes.json'),seconds=seconds,notes=len(notes),shift=shift,program=56,bank='LiveHQ',method='Same focused-guide cached melody for both trumpet auditions; candidate mildly accents phrase entrances, softens connected notes, connects nearby different pitches by 35ms, release 1.25x. Existing rests retained. RMS matched. Not an extracted original trumpet. No new transcription or app change.'),indent=2))
print(out)
