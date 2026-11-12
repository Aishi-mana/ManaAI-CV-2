from pathlib import Path
import json, os, sys
root = Path.cwd()
sys.path.insert(0, str(root / 'src-tauri/target/debug/scripts'))
os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')
os.environ['TEMP'] = os.environ['TMP'] = str(root / 'work')
import soundfile as sf
import numpy as np
from cover_genre import restyle_backing
from source_band import render
src = root / 'exports/singing/1794090410615/backing-extracted.wav'
with sf.SoundFile(src) as f:
    sr = f.samplerate
    f.seek(4 * sr)
    backing = f.read(16 * sr, always_2d=True, dtype='float32').T
for style, lead in [('jazz', 'clarinet'), ('rock', None)]:
    audio, profile = restyle_backing(backing, sr, style, root / 'work/band-controls-runtime' / style, root, lead=lead)
    assert audio.shape == backing.shape and np.isfinite(audio).all() and abs(audio).max() > .001
    assert sf.info(profile['instrumental']).frames == backing.shape[-1]
    if style == 'jazz':
        assert profile['lead'] == 'clarinet'
        _, clarinet = render(profile['score'], root)
        _, sax = render(dict(profile['score'], lead='sax'), root)
        assert not np.allclose(clarinet['lead'], sax['lead'])
        assert all(np.array_equal(clarinet[n], sax[n]) for n in ('piano', 'bass', 'drums'))
    print(f'Packaged Create Cover backing verified for {style}.', flush=True)
