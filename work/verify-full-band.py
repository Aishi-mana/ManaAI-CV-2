from pathlib import Path
import os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from arrangement_job import run
import json
source=root/'exports/singing/1791866715929'
out=root/'work/full-band-audition'
result=run(dict(style='country',start=0,seconds=201,vocal=str(source/'vc_guide-vocals_singing_1.0_50_0.7.wav'),
                instrumental=str(source/'backing-extracted.wav'),data_root=str(root),output=str(out)))
for name in ('mana-vocal.wav','instrumental.wav','arrangement-mix.wav','band/lead.wav','band/acoustic-guitar.wav','band/bass.wav','band/drums.wav'):
    a,rate=sf.read(out/name)
    assert len(a)==201*rate and np.isfinite(a).all() and abs(a).max()>.001, name
meta=json.loads((out/'band/band-analysis.json').read_text())
assert meta['genre']=='country' and meta['lead']=='fiddle'
print('Reach Out to the Truth Country band: four audible instruments and 201-second mix.')

