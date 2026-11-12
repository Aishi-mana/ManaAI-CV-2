from pathlib import Path
import json, sys
import numpy as np
import soundfile as sf
root = Path.cwd()
sys.path.insert(0, str(root / 'scripts'))
from source_band import render
baseline = root / 'work/band-controls-runtime/jazz/genre-remix'
score = json.loads((baseline / 'band-analysis.json').read_text())['score']
mix, stems = render(dict(score, lead='muted-trumpet'), root)
assert len(mix) == round(score['seconds'] * 24000) and np.isfinite(mix).all()
clarinet = sf.read(baseline / 'lead.wav')[0]
assert abs(stems['lead']).max() > .001 and not np.allclose(stems['lead'], clarinet)
for name in ('piano', 'bass', 'drums'):
    assert np.array_equal(stems[name].astype('float32'), sf.read(baseline / (name + '.wav'), dtype='float32')[0]), name
print('Country Roads: distinct trumpet lead and identical piano, bass and drums.')
