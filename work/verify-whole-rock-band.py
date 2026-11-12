from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'src-tauri/target/debug/scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from arrangement_job import run,SR
source=root/'exports/singing/1793880399944'
out=root/'work/whole-rock-band-audition'
vocal=source/'vc_mana-trained-v1.wav'
backing=source/'backing-extracted.wav'
duration=sf.info(vocal).duration
assert duration==sf.info(backing).duration and duration>60
result=run(dict(style='rock',genre_lead='crunch-guitar',start=0,seconds=duration,
                vocal=str(vocal),instrumental=str(backing),data_root=str(root),output=str(out)))
for name in ('mana-vocal.wav','instrumental.wav','arrangement-mix.wav','band/lead.wav','band/bass.wav','band/drums.wav'):
    a,rate=sf.read(out/name)
    assert abs(len(a)-round(duration*rate))<=1 and np.isfinite(a).all() and abs(a).max()>.001, name
score=json.loads((out/'band/band-analysis.json').read_text())['score']
assert score['lead']=='crunch-guitar'
assert any(n[0]<30 for n in score['melody']) and any(n[0]>60 for n in score['melody'])
assert any(n[0]>60 for n in score['drums'])
print(f'Packaged Edit Tracks rendered the complete {duration:.2f}-second source in one Rock band mix.')
