from pathlib import Path
import json,os,sys
from math import gcd
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from cover_genre import restyle_backing
backing,rate=sf.read(root/'work/country-band-audition/band/original-backing.wav',always_2d=True,dtype='float32')
with sf.SoundFile(root/'exports/singing/1794090410615/lead-extracted.wav') as f:
 f.seek(4*f.samplerate)
 guide=f.read(16*f.samplerate,always_2d=True,dtype='float32').mean(1)
 divisor=gcd(rate,f.samplerate)
 guide=resample_poly(guide,rate//divisor,f.samplerate//divisor)
audio,meta=restyle_backing(backing.T,rate,'country',root/'work/follow-vocal-production',root,lead='acoustic-guitar',source='vocal',vocal=guide)
assert audio.shape==backing.T.shape and np.isfinite(audio).all() and meta['sourceInstrument']=='vocal'
approved=json.loads((root/'exports/singing/follow-vocal-country-audition/restored-notes.json').read_text())
for a,b,p,_ in approved['added']:
 assert any(abs(a-n[0])<.011 and abs(b-n[1])<.011 and p==n[2] for n in meta['score']['melody']),(a,b,p)
for name in ('acoustic-guitar','bass','drums'):
 original=sf.read(root/'work/country-band-audition/band'/f'{name}.wav',dtype='float32')[0]
 current=sf.read(Path(meta['instrumental']).parent/f'{name}.wav',dtype='float32')[0]
 assert np.array_equal(original,current),name
print('Production Follow vocal melody recovered both approved quiet notes and retained the Country rhythm tracks.')
