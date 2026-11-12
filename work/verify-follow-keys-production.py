from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from cover_genre import restyle_backing
approved=json.loads((root/'exports/singing/follow-keys-pop-audition/analysis.json').read_text())
source,rate=sf.read(approved['source'],always_2d=True,dtype='float32')
audio,info=restyle_backing(source.T,rate,'pop',root/'work/follow-keys-production',root,lead='synth-lead',source='keys')
assert info['sourceInstrument']=='keys' and audio.shape==source.T.shape and np.isfinite(audio).all()
reference=approved['score']['melody']
actual=info['score']['melody']
matches=sum(any(p==q and min(b,d)>max(a,c) for c,d,q,_ in actual) for a,b,p,_ in reference)
print(f'Production Follow keys rendered {len(actual)} notes, matching {matches}/{len(reference)} of the approved lead notes by pitch and overlapping time.')
assert matches==len(reference)
