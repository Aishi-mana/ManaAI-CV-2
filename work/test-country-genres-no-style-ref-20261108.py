from pathlib import Path
import os,json,subprocess,hashlib,math
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf
from scipy.signal import resample_poly,welch
source=root/'exports/singing/1794090410615/backing-extracted.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
out=root/'exports/singing/country-three-genres-20261108';out.mkdir(parents=True,exist_ok=True)
a,sr=sf.read(source,dtype='float32',always_2d=True);a=a[:20*sr]
assert len(a)==20*sr
fixture=out/'source.wav';sf.write(fixture,a,sr,subtype='FLOAT')
def audition(name,a,rate):
 a=a.copy();rms=float(np.sqrt(np.mean(a*a)));assert rms>1e-6 and np.isfinite(a).all()
 a*=min(.07/rms,.95/max(float(abs(a).max()),1e-9));sf.write(out/(name+'.wav'),a,rate,subtype='PCM_16')
audition('Original Country Roads backing',a,sr)
captions={
 'Rock':'Rock band instrumental arrangement, distorted electric rhythm guitars, electric bass, acoustic rock drum kit, strong backbeat. No vocals. Preserve the source melody, chord changes, tempo and phrase timing.',
 'Jazz':'Jazz ensemble instrumental arrangement, jazz guitar, upright bass, brushed drums, subtle piano comping, relaxed jazz phrasing. No vocals. Preserve the source melody, chord changes, tempo and phrase timing.',
 'Pop':'Modern pop instrumental arrangement, clean rhythmic guitar, bright synth keys, electric bass, tight pop drums, polished pop production. No vocals. Preserve the source melody, chord changes, tempo and phrase timing.'}
reports=[]
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
for genre,caption in captions.items():
 folder=out/genre;folder.mkdir(exist_ok=True)
 request=dict(task_type='cover',caption=caption,lyrics='[Instrumental]',duration=20,seed=42,synth_model='acestep-v15-base-Q8_0.gguf',audio_cover_strength=1.,inference_steps=50,guidance_scale=1.,output_format='wav16')
 path=folder/'request.json';path.write_text(json.dumps(request,indent=2),encoding='utf-8')
 target=folder/'request0.wav';assert not target.exists(),'Do not overwrite an existing trial'
 command=['C:/AI/acestep.cpp/build/Release/ace-synth.exe','--models','C:/AI/Manaverse-BGM-Generator/models','--src-audio',str(fixture),'--request',str(path),'--vae-chunk','256']
 assert '--ref-audio' not in command
 print('Rendering '+genre+'; no timbre reference',flush=True)
 with (folder/'native.log').open('w',encoding='utf-8') as log:
  subprocess.run(command,cwd=folder,env=env,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 audio,rate=sf.read(target,dtype='float32',always_2d=True)
 assert np.isfinite(audio).all() and abs(len(audio)/rate-20)<.1
 freq,power=welch(audio.mean(1),rate,nperseg=8192)
 low=float(power[freq<100].sum()/max(power.sum(),1e-9))
 audition(genre+' backing test',audio,rate)
 report=dict(genre=genre,duration=len(audio)/rate,energyBelow100Hz=low,styleReference=False,sourceStrength=1.,productionChanged=False,listeningApproved=False)
 reports.append(report);print(json.dumps(report),flush=True)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(dict(source=str(source),sourceUnchanged=True,sourceSha256=digest,experiment='standard cover, source-only, high structure guidance, same fixture and seed across genres',cases=reports,scope='Research audition, no guaranteed genre or melody fidelity'),indent=2),encoding='utf-8')
print('THREE_GENRE_TEST_READY',flush=True)
