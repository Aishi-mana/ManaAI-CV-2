from pathlib import Path
import json, os, sys
import numpy as np
import soundfile as sf
root = Path.cwd()
sys.path.insert(0, str(root / 'scripts'))
os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')
os.environ['TEMP'] = os.environ['TMP'] = str(root / 'work')
from cover_genre import restyle_backing
base = root / 'work/band-controls-runtime/rock/genre-remix'
backing, sr = sf.read(base / 'original-backing.wav', dtype='float32', always_2d=True)
audio, result = restyle_backing(backing.T, sr, 'rock', root / 'work/rock-organ-preview', root, lead='rock-organ')
crunch = Path(result['instrumental']).parent
prior = json.loads((base / 'band-analysis.json').read_text())
assert result['lead'] == 'rock-organ'
assert result['score']['melody'] and prior['score']['melody'] != result['score']['melody']
assert audio.shape == backing.T.shape and np.isfinite(audio).all()
assert not np.allclose(sf.read(base / 'lead.wav')[0], sf.read(crunch / 'lead.wav')[0])
for name in ('bass.wav', 'drums.wav'):
    assert np.array_equal(sf.read(base / name)[0], sf.read(crunch / name)[0]), name
print('Verified distinct Rock organ with identical bass and drums.')

