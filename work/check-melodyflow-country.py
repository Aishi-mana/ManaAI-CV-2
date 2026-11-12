from pathlib import Path
import os,sys,json,math
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
longer='--longer' in sys.argv;seconds=20 if longer else 8
out=root/('exports/singing/melodyflow-country-longer-20261108' if longer else 'exports/singing/melodyflow-country-cpu-20261108')
def load(path):
 a,sr=sf.read(path,always_2d=True,dtype='float32');g=math.gcd(sr,24000)
 return resample_poly(a.mean(1),24000//g,sr//g)
a=load(out/f'Original backing - {seconds}s.wav');b=load(out/f'MelodyFlow Rock - {seconds}s.wav')
assert len(a)==len(b)==seconds*24000
ca=librosa.feature.chroma_stft(y=a,sr=24000,hop_length=256)
cb=librosa.feature.chroma_stft(y=b,sr=24000,hop_length=256)
similarity=float(np.mean(np.sum(ca*cb,axis=0)/np.maximum(np.linalg.norm(ca,axis=0)*np.linalg.norm(cb,axis=0),1e-9)))
report=dict(timeAlignedChromaCosine=similarity,waveformCorrelation=float(np.corrcoef(a,b)[0,1]),spectralFlatness=float(librosa.feature.spectral_flatness(y=b).mean()),warning='Diagnostic checks cannot certify song fidelity, genre or musical quality.',listeningApproved=False)
(out/'fidelity-checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
