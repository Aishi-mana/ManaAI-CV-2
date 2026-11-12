from pathlib import Path
import json, sys
import numpy as np
import soundfile as sf
root = Path.cwd()
sys.path.insert(0, str(root / 'scripts'))
from source_band import render
from piano_arrangement import balance
base = root / 'work/country-band-audition'
score = json.loads((base/'band/band-analysis.json').read_text())['score']
vocal, rate = sf.read(base/'mana-vocal.wav', dtype='float32')
assert rate == 24000
out = root/'exports/singing/country-lead-comparison'
out.mkdir(parents=True, exist_ok=True)
heard = [sf.read(base/'band/lead.wav')[0]]
for lead, filename in [('banjo','Banjo.wav')]:
    mix, stems = render(dict(score, lead=lead), root)
    for name in ('acoustic-guitar','bass','drums'):
        assert np.array_equal(stems[name].astype('float32'),sf.read(base/'band'/f'{name}.wav',dtype='float32')[0]), name
    assert abs(stems['lead']).max()>.001 and all(not np.allclose(previous,stems['lead']) for previous in heard)
    heard.append(stems['lead'])
    mixed = balance(np.stack([vocal,vocal]), np.stack([mix,mix]))
    assert mixed.shape==(2,len(vocal)) and np.isfinite(mixed).all()
    sf.write(out/filename,mixed.T,rate,subtype='PCM_16')
print('16-second Banjo lead verified with identical acoustic guitar, bass and drums.')

