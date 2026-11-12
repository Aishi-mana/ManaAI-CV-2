from pathlib import Path
import os,sys,subprocess,json,hashlib,math
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf
from scipy.signal import welch
cpu='--cpu' in sys.argv;seconds=8 if cpu else 12
longer='--longer' in sys.argv
if longer:seconds=20
out=root/('exports/singing/melodyflow-country-cpu-20261108' if cpu else 'exports/singing/melodyflow-country-20261108');out.mkdir(parents=True,exist_ok=True)
source=root/'exports/singing/flowedit-country-stable-20261108/source.wav'
if longer:
 out=root/'exports/singing/melodyflow-country-longer-20261108';out.mkdir(parents=True,exist_ok=True)
 original=root/'exports/singing/1794090410615/backing-extracted.wav'
 original_hash=hashlib.sha256(original.read_bytes()).hexdigest()
 samples,rate=sf.read(original,dtype='float32',always_2d=True)
 source=out/'source.wav';sf.write(source,samples[6*rate:26*rate],rate,subtype='FLOAT')
digest=hashlib.sha256(source.read_bytes()).hexdigest()
models=root/'data/melodyflow-models/converted'
binary=root/('work/melodyflow-native/build-cpu/bin/Release/mf-edit.exe' if cpu else 'work/melodyflow-native/build-cuda/bin/Release/mf-edit.exe')
assert binary.is_file(),'GPU editor must be built first'
target=out/'native-rock.wav';assert not target.exists(),'Keep prior trials intact'
caption='A rock band playing electric guitars, bass guitar and an acoustic drum kit. Instrumental music.'
prompt=out/'prompt.txt';prompt.write_text(caption,encoding='utf-8')
command=[str(binary),'--dit',str(models/'melodyflow-dit-f16.gguf'),'--codec',str(models/'melodyflow-codec-f32.gguf'),'--t5',str(models/'t5-base-f16.gguf'),'--input',str(source),'--prompt-file',str(prompt),'--seconds',str(seconds),'--steps','25','--flowstep','0.12','--seed','1234','--device','CPU' if cpu else 'CUDA0','--out',str(target)]
(out/'request.json').write_text(json.dumps(dict(command=command,source=str(source),sourceSha256=digest,steps=25,flowstep=.12,regularize=True,regularizeIters=2,keepLastK=1,prompt=caption,productionChanged=False),indent=2),encoding='utf-8')
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None);env['AC_THREADS']='8'
with (out/'native.log').open('w',encoding='utf-8') as log:
 subprocess.run(command,cwd=out,env=env,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=1800,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
a,sr=sf.read(target,dtype='float32',always_2d=True)
assert np.isfinite(a).all() and abs(len(a)/sr-seconds)<.05
raw_rms=float(np.sqrt(np.mean(a*a)));raw_peak=float(abs(a).max());assert raw_rms>1e-6
for name,path in [('Original backing',source),('MelodyFlow Rock',target)]:
 audio,rate=sf.read(path,dtype='float32',always_2d=True)
 audio=audio[:seconds*rate]
 audio*=min(.07/max(float(np.sqrt(np.mean(audio*audio))),1e-9),.95/max(float(abs(audio).max()),1e-9))
 sf.write(out/(name+f' - {seconds}s.wav'),audio,rate,subtype='PCM_16')
f,p=welch(a.mean(1),sr,nperseg=8192)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
if longer:assert hashlib.sha256(original.read_bytes()).hexdigest()==original_hash
(out/'checks.json').write_text(json.dumps(dict(seconds=len(a)/sr,rawRms=raw_rms,rawPeak=raw_peak,energyBelow100Hz=float(p[f<100].sum()/p.sum()),sourceUnchanged=True,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('MELODYFLOW_COUNTRY_READY',flush=True)
