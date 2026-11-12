from pathlib import Path
import os,json,subprocess,hashlib,re
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf
from scipy.signal import welch
source=root/'exports/singing/1794090410615/backing-extracted.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
out=root/'exports/singing/flowedit-country-textfield-guided-20261108';out.mkdir(parents=True,exist_ok=True)
original,sr=sf.read(source,dtype='float32',always_2d=True);original=original[6*sr:18*sr]
fixture=out/'source.wav';sf.write(fixture,original,sr,subtype='FLOAT')
source_caption='Acoustic country instrumental, fingerpicked acoustic guitar, country folk accompaniment. No vocals.'
env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
env['ACE_FLOW_EDIT_SOURCE_CAPTION']=source_caption
env['ACE_FLOW_EDIT_AVERAGE']='1'
env['ACE_FLOW_EDIT_TEXT_CONTEXT']='1'
env['ACE_FLOW_EDIT_GUIDANCE']='1'
env['PATH']='C:/AI/acestep.cpp/build/Release;'+env.get('PATH','')
reports=[]
for label,caption in [('Identity',source_caption),('Rock','Rock instrumental, electric rhythm guitar, electric bass, rock drum kit, strong rock backbeat. No vocals.')]:
 folder=out/label;folder.mkdir(exist_ok=True)
 request=dict(task_type='cover-nofsq',caption=caption,lyrics='[Instrumental]',duration=12,seed=42,synth_model='acestep-v15-base-Q8_0.gguf',audio_cover_strength=1.,cover_noise_strength=0.,inference_steps=50,guidance_scale=1.,output_format='wav16')
 path=folder/'request.json';path.write_text(json.dumps(request,indent=2),encoding='utf-8')
 assert not (folder/'request0.wav').exists()
 print('FlowEdit '+label,flush=True)
 with (folder/'native.log').open('w',encoding='utf-8') as log:
  subprocess.run([str(root/'work/native-flowedit/build/Release/ace-flowedit.exe'),'--models','C:/AI/Manaverse-BGM-Generator/models','--src-audio',str(fixture),'--request',str(path),'--vae-chunk','256'],env=env,cwd=folder,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 text=(folder/'native.log').read_text(encoding='utf-8')
 delta=float(re.search(r'relative latent delta ([0-9.eE+-]+)',text)[1])
 audio,rate=sf.read(folder/'request0.wav',always_2d=True,dtype='float32')
 assert np.isfinite(audio).all() and abs(len(audio)/rate-12)<.1
 freq,power=welch(audio.mean(1),rate,nperseg=8192)
 low=float(power[freq<100].sum()/max(power.sum(),1e-9))
 if label=='Identity':assert delta<.001,'Identity control changed source; stop before style test'
 audio*=min(.07/max(float(np.sqrt(np.mean(audio*audio))),1e-9),.95/max(float(abs(audio).max()),1e-9))
 sf.write(out/(label+' - 12s.wav'),audio,rate,subtype='PCM_16')
 report=dict(case=label,relativeLatentChange=delta,energyBelow100Hz=low,productionChanged=False,listeningApproved=False)
 reports.append(report);print(json.dumps(report),flush=True)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(dict(source=str(source),sourceOffset=6,sourceUnchanged=True,cases=reports,method='isolated paired velocity difference editing; source clean latent initialization',downloads=False,productionChanged=False),indent=2),encoding='utf-8')
print('FLOWEDIT_TEST_READY',flush=True)
