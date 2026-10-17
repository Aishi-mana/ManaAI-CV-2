"""Compare bright lead phrasing on the same cached warm-pad melody."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/synth-lead-phrasing-2026-10-17'
out.mkdir(exist_ok=True)
guide=root/'exports/singing/whereabout-36s-vocal-diagnosis/notes.json'
seconds=8
raw=[list(n) for n in json.loads(guide.read_text()) if n[0]<seconds]
for n in raw:n[1]=min(seconds,n[1])
plain=render_soundfont(raw,seconds,root,81,0,release_scale=1.2)
notes=[list(n) for n in raw];levels=[]
for i,n in enumerate(notes):
    entrance=i==0 or n[0]-raw[i-1][1]>.12
    levels.append(max(1,min(127,round(int(48+55*np.clip(n[3],0,1))*(1.03 if entrance else .94)))))
    if i+1<len(notes):
        nxt=notes[i+1]
        if n[2]!=nxt[2] and 0<=nxt[0]-n[1]<=.045:n[1]=min(seconds,nxt[0]+.02)
candidate=render_soundfont(notes,seconds,root,81,0,midi_velocities=levels,release_scale=1)
assert len(candidate)==len(plain)==seconds*SR and np.isfinite(candidate).all()
assert all(a[0]==b[0] and a[2]==b[2] for a,b in zip(raw,notes))
candidate*=np.sqrt(np.mean(plain**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(plain)),1e-9))
sf.write(out/'plain.wav',plain*gain,SR)
sf.write(out/'clearer-phrasing.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(guide=str(guide),song_start=32,seconds=seconds,notes=len(notes),program=81,method='LiveHQ saw lead. Same notes/pitches/attacks/register as warm-pad comparison. Plain release1.2, confidence velocities. Candidate release1, entrance1.03x/connected.94x velocities,20ms connection only between different pitches with gaps<=45ms. No glide, vibrato, harmony or accompaniment added. RMS matched. No tracking/extraction rerun or app change.'),indent=2))
print(out)
