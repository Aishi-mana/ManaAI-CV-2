"""Two controlled renders from one cached backing. No app/model changes."""
from pathlib import Path
import os,json,subprocess,hashlib,math
import soundfile as sf
import numpy as np
from scipy.signal import resample_poly,welch
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/genre-controlled-20261107';out.mkdir(parents=True,exist_ok=True)
source=root/'exports/singing/1794064484684/genre-remix/original-backing.wav'
before=hashlib.sha256(source.read_bytes()).hexdigest()
info=sf.info(source)
audio,sr=sf.read(source,start=4*info.samplerate,frames=12*info.samplerate,always_2d=True,dtype='float32')
assert len(audio)==12*sr and np.isfinite(audio).all()
sf.write(out/'source.wav',audio,sr,subtype='FLOAT')
binary=Path('C:/AI/acestep.cpp/build/Release/ace-synth.exe')
models=Path('C:/AI/Manaverse-BGM-Generator/models')
common=dict(task_type='cover-nofsq',lyrics='[Instrumental]',duration=12,seed=42,synth_model='acestep-v15-base-Q8_0.gguf',audio_cover_strength=.5,inference_steps=50,guidance_scale=1.0,output_format='wav16')
captions={
 'A - No genre change':'Instrumental music. Preserve the original instruments, melody, tempo, structure and arrangement. No singing or spoken voices.',
 'B - Jazz request':'Jazz combo arrangement, acoustic piano, upright walking bass, brushed jazz drums, warm intimate jazz sound. Instrumental only, no singing or spoken voices. Preserve the source song structure, tempo and phrase timing.',
}
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
rows=[]
def audition(label,a,rate):
 rms=float(np.sqrt(np.mean(a*a)));assert rms>1e-6
 a=a*min(.07/rms,.95/max(float(abs(a).max()),1e-6))
 target=out/(label+'.wav');sf.write(target,a,rate,subtype='PCM_16')
 f,p=welch(a.mean(axis=1),rate,nperseg=8192)
 rows.append(dict(label=label,path=str(target),seconds=len(a)/rate,rms=float(np.sqrt(np.mean(a*a))),peak=float(abs(a).max()),energyBelow100Hz=float(p[f<100].sum()/p.sum())))
audition('Original backing',audio,sr)
for label,caption in captions.items():
 folder=out/label;folder.mkdir(exist_ok=True)
 request={**common,'caption':caption}
 path=folder/'request.json';path.write_text(json.dumps(request,indent=2),encoding='utf-8')
 generated=folder/'request0.wav'
 assert not generated.exists(),'Do not silently reuse an earlier render'
 print('RENDER',label,flush=True)
 with (folder/'native.log').open('w',encoding='utf-8') as log:
  subprocess.run([str(binary),'--models',str(models),'--src-audio',str(out/'source.wav'),'--ref-audio',str(out/'source.wav'),'--request',str(path),'--vae-chunk','256'],cwd=folder,env=env,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 a,rate=sf.read(generated,always_2d=True,dtype='float32')
 assert np.isfinite(a).all() and abs(len(a)/rate-12)<.1
 audition(label,a,rate)
 print('READY',label,flush=True)
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
(out/'comparison.json').write_text(json.dumps(dict(source=str(source),sourceSha256=before,sourceStart=4,sourceSeconds=12,parameters=common,onlyChangedParameter='caption',outputs=rows,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('COMPARISON_READY',flush=True)
