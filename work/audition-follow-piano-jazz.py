from pathlib import Path
import json, os, sys

import numpy as np
import soundfile as sf

root = Path.cwd()
sys.path.insert(0, str(root / 'scripts'))
os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')
from music_beats import detect
from source_band import plan, render

source = root / 'exports/singing/genre-controlled-20261107/source.wav'
cached = root / 'exports/singing/piano-production-smoke-20261108/genre-remix'
metadata = json.loads((cached / 'piano-analysis.json').read_text())
piano_notes = metadata['notes']
original, source_rate = sf.read(source, always_2d=True)
seconds = len(original) / source_rate
assert seconds == metadata['seconds']
beats = detect(source, root)
score = plan(piano_notes, beats, seconds, 'jazz', 'sax')
audio, parts = render(score, root)
assert set(parts) == {'lead', 'piano', 'bass', 'drums'}
assert len(audio) == round(seconds * 24000) and np.isfinite(audio).all()
assert all(np.sqrt(np.mean(part**2)) > .001 for part in parts.values())
for begin, end, pitch, _ in score['melody']:
    assert any(pitch == n[2] and begin < n[1] and end > n[0] for n in piano_notes)
for row, evidence in zip(score['bass'], score['bassEvidence']):
    assert row[2] % 12 == piano_notes[evidence['source_note_index']][2] % 12
out = root / 'exports/singing/follow-piano-jazz-audition'
out.mkdir(exist_ok=True)
sf.write(out / 'Original backing.wav', original, source_rate, subtype='PCM_16')
sf.write(out / 'Jazz swing - Follow piano.wav', audio, 24000, subtype='PCM_16')
(out / 'analysis.json').write_text(json.dumps({'source':str(source),'sourceInstrument':'piano','score':score},indent=2))
print(f'{seconds:g}s, {len(piano_notes)} piano notes, {len(score["melody"])} sax notes, {len(beats["beats"])} source beats.')
