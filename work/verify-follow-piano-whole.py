from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from arrangement_job import run
source=root/'exports/singing/1792320947530'
out=root/'work/follow-piano-whole-smoke'
vocal=source/'vc_guide-vocals_singing_1.0_50_0.7.wav'
backing=source/'backing-extracted.wav'
seconds=sf.info(vocal).duration
assert seconds==sf.info(backing).duration and seconds>60
run(dict(style='jazz',genre_lead='sax',band_source='piano',start=0,seconds=seconds,vocal=str(vocal),instrumental=str(backing),data_root=str(root),output=str(out)))
for name in ('instrumental.wav','arrangement-mix.wav','band/lead.wav','band/piano.wav','band/bass.wav','band/drums.wav'):
 a,rate=sf.read(out/name)
 assert abs(len(a)-seconds*rate)<=2 and np.isfinite(a).all() and abs(a).max()>.001,name
data=json.loads((out/'band/band-analysis.json').read_text())
assert data['sourceInstrument']=='piano' and any(n[0]>60 for n in data['score']['melody'])
print(f'Follow piano rendered complete {seconds:.2f}-second Jazz swing arrangement.')
