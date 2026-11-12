from pathlib import Path
import json, os, sys
root = Path.cwd()
sys.path.insert(0, str(root / 'src-tauri/target/debug/scripts'))
os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')
os.environ['TEMP'] = os.environ['TMP'] = str(root / 'work')
import soundfile as sf
import numpy as np
from arrangement_job import run
from source_band import render
source = root / 'exports/singing/1794090410615'
out = root / 'work/band-controls-runtime'
out.mkdir(exist_ok=True)
result = json.loads((out / 'result.json').read_text()) if (out / 'result.json').exists() else run(dict(style='pop', genre_lead='clean-guitar', start=4, seconds=22,
    vocal=str(source / 'vc_mana-trained-v1.wav'), instrumental=str(source / 'backing-extracted.wav'),
    data_root=str(root), output=str(out / 'pop')))
(out / 'result.json').write_text(json.dumps(result))
result['instrumental'] = str(Path(result['vocal']).with_name('instrumental.wav'))
for key in ('vocal', 'instrumental', 'mix'):
    a, sr = sf.read(result[key], always_2d=True)
    assert len(a) == 22 * sr and np.isfinite(a).all() and abs(a).max() > .001, key
metadata = json.loads(next((out / 'pop').rglob('band-analysis.json')).read_text(encoding='utf-8'))
assert metadata['lead'] == 'clean-guitar'
score = metadata['score']
main = []
for lead in ('clean-guitar', 'electric-piano', 'acoustic-piano', 'synth-lead'):
    mix, stems = render(dict(score, lead=lead), root)
    assert np.isfinite(mix).all() and len(mix) == 22 * 24000
    if main:
        assert all(np.array_equal(stems[name], rhythm[name]) for name in rhythm)
        assert all(not np.allclose(stems['lead'], earlier) for earlier in main)
    else:
        rhythm = {name: stem for name, stem in stems.items() if name != 'lead'}
    main.append(stems['lead'])
print('Verified production Edit Tracks Pop and four distinct leads with identical rhythm stems.', flush=True)

