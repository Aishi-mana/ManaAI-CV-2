from pathlib import Path
import os,sys,json,hashlib,math
root=Path(__file__).resolve().parents[1]
for key,value in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[key]=str(value)
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
from optional_separators import extract
prior=root/'exports/singing/note-jazz-prototype-20261108'
source=Path(json.loads((prior/'notes-and-chords.json').read_text())['source'])
digest=hashlib.sha256(source.read_bytes()).hexdigest()
a,sr=sf.read(source,dtype='float32',always_2d=True);g=math.gcd(sr,24000)
a=resample_poly(a.mean(1),24000//g,sr//g)
out=root/'exports/singing/source-piano-extraction-20261108';out.mkdir(parents=True,exist_ok=True)
print('Extracting existing source piano; no note synthesis',flush=True)
piano=extract(a,root,'piano-extract')
assert len(piano)==len(a) and np.isfinite(piano).all()
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
for label,data in [('Original excerpt',a),('Extracted piano',piano),('Remaining backing',a-piano)]:
 sf.write(out/(label+' - 12s.wav'),data,24000,subtype='FLOAT')
(out/'checks.json').write_text(json.dumps(dict(duration=len(a)/24000,sourceUnchanged=True,noteSynthesis=False,normalization=False,peak=float(abs(piano).max()),rms=float(np.sqrt(np.mean(piano*piano))),reconstructionError=float(abs(piano+(a-piano)-a).max()),productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('EXTRACTION_READY',flush=True)
