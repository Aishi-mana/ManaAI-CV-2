from pathlib import Path
import json,os,sys

import numpy as np
import soundfile as sf

root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
from arrangement_replacement import SR
from scipy.signal import resample_poly
from math import gcd
from source_band import render
from vocal_melody import track_vocal_notes

base=root/'work/country-band-audition'
score=json.loads((base/'band/band-analysis.json').read_text())['score']
source=root/'exports/singing/1794090410615/lead-extracted.wav'
seconds=score['seconds']
with sf.SoundFile(source) as f:
 rate=f.samplerate
 f.seek(round(4*rate))
 guide=f.read(round(seconds*rate),always_2d=True,dtype='float32').mean(1)
 divisor=gcd(rate,SR)
 guide=resample_poly(guide,SR//divisor,rate//divisor)
guide=guide[:round(seconds*SR)]
notes=track_vocal_notes(guide,seconds,'electric-piano')
assert notes and len(guide)==round(seconds*SR)
strengths=[float(np.sqrt(np.mean(guide[round(a*SR):round(b*SR)]**2))) for a,b,_,_ in notes]
reference=max(float(np.percentile(strengths,85)),1e-9)
melody=[[a,b,p,float(np.clip(rms/reference,.15,1))] for (a,b,p,_),rms in zip(notes,strengths) if rms>=reference*.10]
assert len(melody)>=5
audio,stems=render(dict(score,lead='acoustic-guitar',melody=melody),root)
for name in ('acoustic-guitar','bass','drums'):
 original,_=sf.read(base/'band'/f'{name}.wav',dtype='float32')
 assert np.array_equal(stems[name].astype('float32'),original),name
assert len(audio)==len(guide) and np.isfinite(audio).all() and abs(stems['lead']).max()>.001
out=root/'exports/singing/follow-vocal-country-audition'
out.mkdir(exist_ok=True)
sf.write(out/'Original vocal guide.wav',guide*(.85/abs(guide).max()),SR,subtype='PCM_16')
sf.write(out/'Country band - Follow vocal melody.wav',audio,SR,subtype='PCM_16')
(out/'analysis.json').write_text(json.dumps({'source':str(source),'start':4,'seconds':seconds,'melody':melody},indent=2))
print(f'{seconds:g}-second instrumental preview, {len(melody)} notes from the source vocal, same Country rhythm stems.')
