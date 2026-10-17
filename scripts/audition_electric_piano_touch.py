"""One gentler electric-piano candidate; reuse cached melody and source dynamics."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
previous_dir=root/'exports/singing/electric-piano-phrasing-2026-10-16'
out=root/'exports/singing/electric-piano-touch-2026-10-16'
out.mkdir(exist_ok=True)
report=json.loads((previous_dir/'report.json').read_text())
seconds=report['seconds']
notes=[list(n) for n in json.loads(Path(report['guide']).read_text()) if n[0]<seconds]
for n in notes:n[1]=min(n[1],seconds)
levels=[max(1,round(v*.88)) for v in report['velocities']]
candidate=np.zeros(round(seconds*SR),dtype=np.float32)
groups={1.05:[],1.8:[]}
for i,(a,b,p,c) in enumerate(notes):groups[1.8 if b-a>=.4 else 1.05].append(i)
for release,indices in groups.items():
    if indices:candidate+=render_soundfont([notes[i] for i in indices],seconds,root,4,0,midi_velocities=[levels[i] for i in indices],release_scale=release)
previous,sr=sf.read(previous_dir/'dynamic-decay.wav')
assert sr==SR and len(candidate)==len(previous) and np.isfinite(candidate).all()
candidate*=np.sqrt(np.mean(previous**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(previous)),1e-9))
sf.write(out/'previous.wav',previous*gain,SR)
sf.write(out/'gentler-touch.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(source=str(previous_dir),seconds=seconds,notes=len(notes),velocities=levels,groups={str(k):v for k,v in groups.items()},method='Same cached source-driven dynamics, MIDI velocity scaled.88 for gentler sample response. Notes shorter than400ms release1.05; held notes release1.8. Identical pitches/attacks/note-off times; no added notes/pedal/overlaps. RMS matched so comparison is touch/decay, not just lower output volume. No model rerun or app change.'),indent=2))
print(out)
