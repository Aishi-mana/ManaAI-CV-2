from pathlib import Path
import os,json,math
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly,welch
base=root/'exports/singing'
def load(path):
 a,sr=sf.read(path,always_2d=True,dtype='float32');g=math.gcd(sr,24000)
 return resample_poly(a.mean(1),24000//g,sr//g)
source=load(base/'flowedit-country-stable-20261108/source.wav')
def chroma(a):return librosa.feature.chroma_stft(y=a,sr=24000,hop_length=256)
cs=chroma(source)
report={}
for label,path in [('source',base/'flowedit-country-stable-20261108/source.wav'),('rejected',base/'flowedit-country-stable-20261108/Rock - 12s.wav'),('averaged',base/'flowedit-country-averaged-20261108/Rock - 12s.wav')]:
 a=load(path);spec=abs(librosa.stft(a,hop_length=256));freq=librosa.fft_frequencies(sr=24000)
 c=chroma(a)
 report[label]=dict(waveformCorrelation=float(np.corrcoef(source,a)[0,1]),chromaCosine=float(np.mean(np.sum(cs*c,axis=0)/np.maximum(np.linalg.norm(cs,axis=0)*np.linalg.norm(c,axis=0),1e-9))),meanSpectralFlatness=float(librosa.feature.spectral_flatness(S=spec).mean()),energyAbove6kHz=float(np.sum(spec[freq>6000]**2)/np.sum(spec**2)))
report['warning']='Diagnostic only; does not prove artifact reduction, genre change or audible quality.'
(base/'flowedit-country-averaged-20261108/comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
