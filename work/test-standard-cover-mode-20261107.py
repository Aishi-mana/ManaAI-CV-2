from pathlib import Path
import os,json,subprocess,hashlib
import numpy as np,soundfile as sf
from scipy.signal import welch
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/genre-controlled-20261107'
folder=out/'E - Standard cover mode';folder.mkdir(exist_ok=True)
source=out/'source.wav';digest=hashlib.sha256(source.read_bytes()).hexdigest()
old=json.loads((out/'B - Jazz request/request.json').read_text(encoding='utf-8'))
request={**old,'task_type':'cover'}
assert {k for k in request if request[k]!=old[k]}=={'task_type'}
path=folder/'request.json';path.write_text(json.dumps(request,indent=2),encoding='utf-8')
generated=folder/'request0.wav'
assert not generated.exists(),'Do not overwrite or reuse a previous render'
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
with (folder/'native.log').open('w',encoding='utf-8') as log:
 subprocess.run(['C:/AI/acestep.cpp/build/Release/ace-synth.exe','--models','C:/AI/Manaverse-BGM-Generator/models','--src-audio',str(source),'--ref-audio',str(source),'--request',str(path),'--vae-chunk','256'],cwd=folder,env=env,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
audio,sr=sf.read(generated,always_2d=True,dtype='float32')
assert np.isfinite(audio).all() and abs(len(audio)/sr-12)<.1
freq,power=welch(audio.mean(axis=1),sr,nperseg=8192)
audio*=min(.07/float(np.sqrt(np.mean(audio*audio))),.95/max(float(abs(audio).max()),1e-6))
target=out/'E - Standard cover mode.wav';sf.write(target,audio,sr,subtype='PCM_16')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
report=dict(onlyChangedParameter='task_type',previous='cover-nofsq',current='cover',sourceSha256=digest,seconds=len(audio)/sr,rms=float(np.sqrt(np.mean(audio*audio))),peak=float(abs(audio).max()),energyBelow100Hz=float(power[freq<100].sum()/power.sum()),audition=str(target),productionChanged=False,listeningApproved=False)
(folder/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2),flush=True)
