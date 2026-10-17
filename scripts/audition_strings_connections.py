"""Small cached-note audition; does not run transcription or alter app presets."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont, SR

root = Path(__file__).resolve().parents[1]
old = root / 'exports/singing/arrangement-1791794463189164800'
out = root / 'exports/singing/strings-connections-2026-10-16'
out.mkdir(exist_ok=True)
start, end = .8, 8.5
original = json.loads((old / 'notes.json').read_text())
notes = [list(n) for n in original if start <= n[0] < end]
connected = [n.copy() for n in notes]
for i, note in enumerate(connected[:-1]):
    following = connected[i + 1]
    gap = following[0] - note[1]
    if note[2] != following[2] and 0 <= gap <= .1:
        note[1] = min(end, following[0] + .075)
assert all(a[0] == b[0] and a[2:] == b[2:] for a, b in zip(notes, connected))
# Render only this short passage, retaining the original pitches and attacks.
local = [[a-start, min(b,end)-start, p, v] for a,b,p,v in connected]
candidate = render_soundfont(local, end-start, root, 48, 0, release_scale=1.5)
baseline, rate = sf.read(old / 'strings.wav')
assert rate == SR
baseline = baseline[round(start*SR):round(end*SR)]
if baseline.ndim > 1: baseline = baseline.mean(axis=1)
candidate *= np.sqrt(np.mean(baseline**2)) / max(1e-9, np.sqrt(np.mean(candidate**2)))
assert len(candidate) == len(baseline) and np.isfinite(candidate).all()
gain = min(1., .95/max(np.max(np.abs(candidate)), np.max(np.abs(baseline)), 1e-9))
sf.write(out/'previous.wav', baseline*gain, SR)
sf.write(out/'connected.wav', candidate*gain, SR)
(out/'report.json').write_text(json.dumps({'source':str(old), 'passage':[start,end], 'notes':len(notes), 'changed_holds':sum(a[1]!=b[1] for a,b in zip(notes,connected)), 'new_transcription':False, 'pitch_and_attack_preserved':True}, indent=2))
print(out)
