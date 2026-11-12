"""Neural edit of isolated source guitar; not a production conversion feature."""
from pathlib import Path
import os,json,subprocess,hashlib
import numpy as np,soundfile as sf
from scipy.signal import resample_poly,welch
root=Path.cwd();out=root/'exports/singing/melodyflow-guitar-electric-20261108';out.mkdir(exist_ok=True)
origin=root/'exports/singing/country-guitar-drive-20261108/guitar-with-context.npy'
g=np.load(origin)[:,2*44100:12*44100].T
source=out/'source-guitar.wav';sf.write(source,g,44100,subtype='FLOAT')
digest=hashlib.sha256(origin.read_bytes()).hexdigest()
models=root/'data/melodyflow-models/converted'
target=out/'neural-electric-raw.wav'
caption='A solo distorted electric guitar playing a rock rhythm guitar part. Crunchy electric guitar amplifier tone, tight picked strings and sustained overdriven chords. Guitar only. No singing, no drums.'
(out/'prompt.txt').write_text(caption,encoding='utf-8')
command=[str(root/'work/melodyflow-native/build-cpu/bin/Release/mf-edit.exe'),
    '--dit',str(models/'melodyflow-dit-f16.gguf'),'--codec',str(models/'melodyflow-codec-f32.gguf'),
    '--t5',str(models/'t5-base-f16.gguf'),'--input',str(source),'--prompt-file',str(out/'prompt.txt'),
    '--seconds','10','--steps','25','--flowstep','0.05','--cfg-coef','6','--seed','1234',
    '--device','CPU','--out',str(target)]
(out/'request.json').write_text(json.dumps({'command':command,'caption':caption,'sourceHash':digest,
    'scope':'isolated guitar neural edit, stronger edit than prior whole-backing test; notes may change'},indent=2),encoding='utf-8')
env=os.environ.copy();env['AC_THREADS']='8'
if not target.exists():
    with (out/'native.log').open('w',encoding='utf-8') as log:
        subprocess.run(command,env=env,cwd=out,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=1200,
            creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
a,sr=sf.read(target,always_2d=True,dtype='float32')
assert np.isfinite(a).all() and len(a)==10*sr
def rms(x):return float(np.sqrt(np.mean(x*x)))
assert rms(a)>1e-5
def audition(name,x,rate):
    x=x*min(.07/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
    sf.write(out/name,x,rate,subtype='PCM_24')
audition('Original guitar.wav',g,44100)
audition('Neural electric guitar.wav',a,sr)
back,br=sf.read(root/'exports/singing/1794090410615/backing-extracted.wav',always_2d=True,dtype='float32')
back=back[18*br:28*br]
a44=resample_poly(a,147,160,axis=0) if sr==48000 else a
assert len(a44)==len(g) and br==44100
if a44.shape[1]==1:a44=np.repeat(a44,2,axis=1)
# Compare timbre at source-stem loudness, without layering the acoustic guitar back in.
a44*=rms(g)/max(rms(a44),1e-8)
mixed=back-g+a44
audition('Neural electric backing.wav',mixed,br)
f,p=welch(a.mean(1),sr,nperseg=8192)
checks={'seconds':len(a)/sr,'finite':True,'rawPeak':float(np.abs(a).max()),'rawRms':rms(a),
    'powerBelow80Hz':float(p[f<80].sum()/p.sum()),'sourceUnchanged':hashlib.sha256(origin.read_bytes()).hexdigest()==digest,
    'productionChanged':False,'listeningApproved':False,'originalGuitarOverlaid':False}
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps(checks),flush=True)
