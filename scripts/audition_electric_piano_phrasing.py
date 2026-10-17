"""Short electric-piano comparison from cached cleaned vocal melody."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16'
out=root/'exports/singing/electric-piano-phrasing-2026-10-16'
out.mkdir(exist_ok=True)
seconds=8
notes=[list(n) for n in json.loads((base/'notes.json').read_text()) if n[0]<seconds]
for n in notes:n[1]=min(n[1],seconds)
source,_=librosa.load(root/'exports/singing/vocal-extraction-170s-2026-10-13/lead-vocal-raw.wav',sr=SR,duration=seconds)
plain=render_soundfont(notes,seconds,root,4,0,release_scale=1)
# Vocal energy, rather than detector confidence, controls key strength.
strengths=[]
for a,b,p,c in notes:
    section=source[round(a*SR):round(min(b,a+.15)*SR)]
    strengths.append(float(np.sqrt(np.mean(section**2))) if len(section) else 0.)
reference=max(float(np.percentile(strengths,85)),1e-9)
levels=[int(round(28+67*np.clip(s/reference,0,1)**.8)) for s in strengths]
candidate=render_soundfont(notes,seconds,root,4,0,midi_velocities=levels,release_scale=1.6)
assert len(candidate)==len(plain)==seconds*SR and np.isfinite(candidate).all() and np.isfinite(plain).all()
candidate*=np.sqrt(np.mean(plain**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(plain)),np.max(np.abs(candidate)),1e-9))
sf.write(out/'plain.wav',plain*gain,SR)
sf.write(out/'dynamic-decay.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(guide=str(base/'notes.json'),song_start=170,seconds=seconds,notes=len(notes),program=4,velocities=levels,method='LiveHQ electric piano, same approved cached vocal melody and sung register, identical note starts/ends/pitches. Plain confidence velocities and release1; candidate first150ms vocal RMS velocities28–95 with .8 exponent, release1.6 for natural key decay. No added note overlap, sustain pedal, notes or accompaniment. RMS matched. No extraction/pitch tracking or app changes.'),indent=2))
print(out)
