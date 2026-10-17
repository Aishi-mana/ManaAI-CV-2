"""Short warm-pad envelope audition using cached approved vocal notes."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/warm-pad-phrasing-2026-10-17'
out.mkdir(exist_ok=True)
base=root/'exports/singing/whereabout-36s-vocal-diagnosis'
seconds=8
notes=[list(n) for n in json.loads((base/'notes.json').read_text()) if n[0]<seconds]
for n in notes:n[1]=min(seconds,n[1])
plain=render_soundfont(notes,seconds,root,89,0,release_scale=1.2)
# Render phrase lanes independently so entrance/exit envelopes do not duck the
# tail of another phrase. No new notes or extension of the detected note holds.
phrases=[]
for n in notes:
    if not phrases or n[0]-phrases[-1][-1][1]>.2:phrases.append([])
    phrases[-1].append(n)
candidate=np.zeros(round(seconds*SR),dtype=np.float32)
for phrase in phrases:
    levels=[max(1,round(int(48+55*np.clip(n[3],0,1))*.88)) for n in phrase]
    lane=render_soundfont(phrase,seconds,root,89,0,midi_velocities=levels,release_scale=1.65)
    a=round(phrase[0][0]*SR);b=round(phrase[-1][1]*SR)
    attack=min(round(.09*SR),max(1,b-a))
    lane[a:a+attack]*=np.sin(np.linspace(0,np.pi/2,attack))**2
    tail=min(round(.3*SR),len(lane)-b)
    if tail>0:lane[b:b+tail]*=np.cos(np.linspace(0,np.pi/2,tail))**2
    lane[b+tail:]=0
    candidate+=lane
assert candidate.shape==plain.shape and np.isfinite(candidate).all() and np.isfinite(plain).all()
candidate*=np.sqrt(np.mean(plain**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(plain)),1e-9))
sf.write(out/'plain.wav',plain*gain,SR)
sf.write(out/'soft-phrases.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(guide=str(base/'notes.json'),song_start=32,seconds=seconds,notes=len(notes),phrases=len(phrases),program=89,method='LiveHQ warm pad, same cached stabilized vocal melody, original sung register and note holds. Plain release1.2. Candidate velocities.88x, release1.65,90ms phrase entrance and300ms phrase-tail fade. Phrases split at gaps>200ms; independent lanes keep other tails from being ducked. RMS matched. No new extraction/tracking, accompaniment or app change.'),indent=2))
print(out)
