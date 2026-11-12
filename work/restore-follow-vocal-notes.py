from pathlib import Path
import json,sys
import numpy as np,soundfile as sf
from scipy.ndimage import median_filter
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
from source_band import render
out=root/'exports/singing/follow-vocal-country-audition'
baseline=json.loads((out/'analysis.json').read_text())['melody']
guide,rate=sf.read(out/'Original vocal guide.wav',dtype='float32')
pitch_data=np.load(root/'work/follow-vocal-country-pitch.npz')
f0,voiced,prob=(pitch_data[k] for k in ('f0','voiced','prob'))
hop=.005
valid=voiced & np.isfinite(f0) & (prob>=.42)
pitch=np.zeros(len(f0),int)
pitch[valid]=np.rint(69+12*np.log2(f0[valid]/440)).astype(int)
pitch=median_filter(pitch,size=5)
bounds=np.r_[0,np.flatnonzero(pitch[1:]!=pitch[:-1])+1,len(pitch)]
rms=lambda a,b:float(np.sqrt(np.mean(guide[round(a*rate):round(b*rate)]**2)))
ref=np.percentile([rms(a,b) for a,b,_,_ in baseline],85)
rests=[(0.,baseline[0][0])]+[(a[1],b[0]) for a,b in zip(baseline,baseline[1:])]
added=[]
for a,b in zip(bounds,bounds[1:]):
 if pitch[a]<=0 or b-a<11:continue
 for start,end in rests:
  begin,finish=max(a*hop,start),min(b*hop,end)
  if finish-begin<.07:continue
  confidence=float(np.mean(prob[round(begin/hop):round(finish/hop)]))
  strength=rms(begin,finish)/ref
  print(begin,finish,int(pitch[a]),confidence,strength)
  if confidence>=.65 and strength>=.035:
   added.append([begin,finish,int(pitch[a]),float(np.clip(strength,.18,1))])
assert added
melody=sorted(baseline+added)
assert all(a[1]<=b[0]+1e-9 for a,b in zip(melody,melody[1:]))
base=root/'work/country-band-audition/band'
score=json.loads((base/'band-analysis.json').read_text())['score']
mix,stems=render(dict(score,lead='acoustic-guitar',melody=melody),root)
for name in ('acoustic-guitar','bass','drums'):
 assert np.array_equal(stems[name].astype('float32'),sf.read(base/f'{name}.wav',dtype='float32')[0])
assert np.isfinite(mix).all() and len(mix)==len(guide)
sf.write(out/'Country band - Restored notes.wav',mix,rate,subtype='PCM_16')
sf.write(out/'Acoustic lead - Restored notes.wav',stems['lead'],rate,subtype='PCM_16')
(out/'restored-notes.json').write_text(json.dumps({'added':added,'melody':melody},indent=2))
print('Restored:',added)

