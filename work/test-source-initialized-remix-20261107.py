from pathlib import Path
import json,subprocess,os,hashlib,math
import numpy as np,soundfile as sf
from scipy.signal import welch,resample_poly
root=Path(__file__).resolve().parents[1];out=root/'exports/singing/genre-controlled-20261107'
folder=out/'G - Source initialized remix';folder.mkdir(exist_ok=True)
source=out/'source.wav';digest=hashlib.sha256(source.read_bytes()).hexdigest()
old=json.loads((out/'B - Jazz request/request.json').read_text())
request={**old,'cover_noise_strength':.8}
assert set(request)-set(old)=={'cover_noise_strength'}
path=folder/'request.json';path.write_text(json.dumps(request,indent=2))
assert not (folder/'request0.wav').exists()
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
with (folder/'native.log').open('w') as log:
 subprocess.run(['C:/AI/acestep.cpp/build/Release/ace-synth.exe','--models','C:/AI/Manaverse-BGM-Generator/models','--src-audio',str(source),'--ref-audio',str(source),'--request',str(path),'--vae-chunk','256'],cwd=folder,env=env,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
a,sr=sf.read(folder/'request0.wav',always_2d=True,dtype='float32');assert np.isfinite(a).all() and abs(len(a)/sr-12)<.1
b,br=sf.read(source,always_2d=True,dtype='float32');g=math.gcd(br,sr);b=resample_poly(b,sr//g,br//g,axis=0);n=min(len(a),len(b))
f,p=welch(a.mean(1),sr,nperseg=8192)
report=dict(seconds=len(a)/sr,energyBelow100Hz=float(p[f<100].sum()/p.sum()),waveformCorrelation=float(np.corrcoef(a[:n].ravel(),b[:n].ravel())[0,1]),changedParameter='cover_noise_strength',previous=0,current=.8,sourceSha256=digest,productionChanged=False,listeningApproved=False)
a*=min(.07/float(np.sqrt(np.mean(a*a))),.95/max(float(abs(a).max()),1e-6));sf.write(out/'G - Source initialized remix.wav',a,sr,subtype='PCM_16')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(folder/'checks.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
