from pathlib import Path
import os,json,math
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
out=root/'exports/singing/flowedit-country-stable-20261108'
def load(path):
 a,sr=sf.read(path,dtype='float32',always_2d=True);a=a.mean(1);g=math.gcd(sr,24000)
 return resample_poly(a,24000//g,sr//g)
a=load(out/'source.wav');b=load(out/'Rock - 12s.wav');identity=load(out/'Identity - 12s.wav')
def cosine(x,y):
 p=librosa.feature.chroma_stft(y=x,sr=24000,hop_length=256)
 q=librosa.feature.chroma_stft(y=y,sr=24000,hop_length=256)
 return float(np.mean(np.sum(p*q,axis=0)/np.maximum(np.linalg.norm(p,axis=0)*np.linalg.norm(q,axis=0),1e-9)))
report=dict(sourceToIdentityWaveformCorrelation=float(np.corrcoef(a,identity)[0,1]),sourceToRockWaveformCorrelation=float(np.corrcoef(a,b)[0,1]),timeAlignedChromaCosine=cosine(a,b),listeningApproved=False,warning='Signal similarity does not establish audible melody fidelity or rock style.')
p=out/'fidelity-checks.json';p.write_text(json.dumps(report,indent=2),encoding='utf-8')
original,sr=sf.read(out/'source.wav',dtype='float32',always_2d=True)
original*=min(.07/float(np.sqrt(np.mean(original**2))),.95/max(float(abs(original).max()),1e-9))
sf.write(out/'Original - 12s.wav',original,sr,subtype='PCM_16')
print(json.dumps(report),flush=True)
