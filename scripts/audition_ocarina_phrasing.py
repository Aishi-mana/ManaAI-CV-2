"""Short ocarina phrasing comparison from approved cached vocal melody."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16'
out=root/'exports/singing/ocarina-phrasing-2026-10-16'
out.mkdir(exist_ok=True)
seconds=8
raw=[list(n) for n in json.loads((base/'notes.json').read_text()) if n[0]<seconds]
for n in raw:n[1]=min(n[1],seconds)
notes=[n.copy() for n in raw]
levels=[int(48+55*np.clip(n[3],0,1)) for n in raw]
plain=render_soundfont(raw,seconds,root,79,0,midi_velocities=levels,release_scale=1.2)
soft_levels=[];entrances=[]
for i,n in enumerate(notes):
    entrance=i==0 or n[0]-raw[i-1][1]>.12
    if entrance:entrances.append(n[0])
    soft_levels.append(max(1,round(levels[i]*(.86 if entrance else .95))))
    if i+1<len(notes):
        nxt=notes[i+1]
        if n[2]!=nxt[2] and 0<=nxt[0]-n[1]<=.05:n[1]=min(seconds,nxt[0]+.025)
candidate=render_soundfont(notes,seconds,root,79,0,midi_velocities=soft_levels,release_scale=1.35)
for onset in entrances:
    first=round(onset*SR);count=min(round(.022*SR),len(candidate)-first)
    if count>0:candidate[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
assert len(candidate)==len(plain)==seconds*SR and np.isfinite(candidate).all() and np.isfinite(plain).all()
assert all(a[0]==b[0] and a[2]==b[2] for a,b in zip(raw,notes))
candidate*=np.sqrt(np.mean(plain**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(plain)),np.max(np.abs(candidate)),1e-9))
sf.write(out/'plain.wav',plain*gain,SR)
sf.write(out/'gentler.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(guide=str(base/'notes.json'),song_start=170,seconds=seconds,notes=len(notes),program=79,method='LiveHQ ocarina, same cached approved cleaned vocal melody at original sung register. Plain release1.2; candidate release1.35, softer phrase entries and22ms entrance fades,25ms connection only across different pitches with gaps<=50ms. Rests retained, RMS matched. No new extraction/pitch tracking or app changes.'),indent=2))
print(out)
