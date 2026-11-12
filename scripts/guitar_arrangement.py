"""Source guitar notes → electric samples/amp, retaining the other instruments."""
from pathlib import Path
import os,sys,json,math,subprocess,tempfile

def render_source(path,seconds,root,tone='distorted',custom=None,notes_override=None,analysis=None):
 if not math.isfinite(seconds) or not 1<=seconds<=(360 if analysis is not None else 60):raise ValueError('Choose a guitar section from 1 to 60 seconds.')
 import numpy as np,soundfile as sf
 from scipy.signal import resample_poly,stft
 from scipy.ndimage import uniform_filter1d
 from guitar_transcription import transcribe
 from arrangement_replacement import render_separate,validate_custom,customize_notes,playback_notes,SR
 from piano_transcription import midi_for
 root=Path(root);custom=validate_custom(custom)
 sys.path.append(str(root/'data/transcription-packages'))
 if tone not in ('clean','distorted','crunch'):raise ValueError('Choose clean, crunch or distorted guitar.')
 if notes_override is None:notes=transcribe(path,seconds,root)
 else:
  from builder_notes import validate_notes
  notes=validate_notes(notes_override,seconds)
  notes=[n for n in notes if n[3]>0]
  if not notes:
   return np.zeros(round(seconds*SR)),midi_for([],27 if tone=='clean' else 30),[]
 source,rate=sf.read(path,always_2d=True,dtype='float32');source=source[:round(seconds*rate)].mean(1)
 d=math.gcd(rate,SR);source=resample_poly(source,SR//d,rate//d)
 source=np.pad(source[:round(seconds*SR)],(0,max(0,round(seconds*SR)-len(source))))
 rms=lambda x:float(np.sqrt(np.mean(x*x)))
 if rms(source)<1e-5:raise ValueError('No audible guitar in this section.')
 f,t,z=stft(source,fs=SR,nperseg=4096,noverlap=3856);power=np.abs(z)**2;strengths=[]
 for begin,end,pitch,_ in notes:
  hz=440*2**((pitch-69)/12);frames=(t>=begin)&(t<=min(end,begin+.1))
  if not frames.any():frames[np.argmin(abs(t-begin))]=True
  energy=np.zeros(int(frames.sum()))
  for h in range(1,5):
   bins=np.abs(f-h*hz)<max(9,h*hz*.015)
   if bins.any():energy+=power[np.ix_(bins,frames)].sum(0)/h
  strengths.append(float(np.sqrt(np.percentile(energy,75))))
 ref=max(float(np.percentile(strengths,85)),1e-8)
 velocities=[1 if v<ref*.02 else int(np.clip(100+25*np.log2(max(v,1e-9)/ref),20,115)) for v in strengths]
 if notes_override is not None:velocities=[max(1,round(n[3]*127)) for n in notes]
 if analysis is not None:analysis['source_notes']=[[n[0],n[1],n[2],v/127] for n,v in zip(notes,velocities)]
 performed=customize_notes(notes,seconds,custom.get('extension',0))
 shift=custom.get('pitch',0)
 if any(not 0<=n[2]+shift<=127 for n in performed):raise ValueError('Shifted guitar note is outside MIDI range.')
 clean=render_separate(performed,seconds,root,'electric-guitar',shift,'clean',midi_velocities=velocities,guitar_release=.25)
 clean*=min(.065/max(rms(clean),1e-8),.9/max(float(np.abs(clean).max()),1e-8))
 audio=clean
 if tone in ('distorted','crunch'):
  binary=root/'data/nam/build/tools/Release/render.exe';model=root/'data/nam/models/jcm800-cab.nam'
  if not binary.is_file() or not model.is_file():raise ValueError('Restore the installed NAM guitar amp and JCM800 capture.')
  with tempfile.TemporaryDirectory(prefix='guitar-amp-',dir=root/'data/music-cache') as folder:
   folder=Path(folder)
   amp_input=clean*.45 if tone=='crunch' else clean
   padded=np.pad(resample_poly(amp_input,2,1),(24000,24000))
   sf.write(folder/'in.wav',padded,48000,subtype='FLOAT')
   subprocess.run([str(binary),str(model),str(folder/'in.wav'),str(folder/'out.wav')],check=True,timeout=300,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
   audio,sr=sf.read(folder/'out.wav',dtype='float32')
   if sr!=48000 or audio.shape!=padded.shape or not np.isfinite(audio).all():raise ValueError('Guitar amp returned invalid audio.')
   audio=resample_poly(audio[24000:24000+len(clean)*2],1,2)
  if tone=='crunch':
   audio=.72*audio*(rms(clean)/max(rms(audio),1e-8))+.28*clean
 audio*=rms(source)/max(rms(audio),1e-8)
 envelope=lambda x:np.sqrt(np.maximum(uniform_filter1d(x*x,size=round(SR*.1)),0))
 source_env=envelope(source);out_env=envelope(audio)
 floor=max(float(np.percentile(source_env,95))*.005,1e-6)
 gain=np.clip(source_env/np.maximum(out_env,floor),0,1.8);gain[source_env<floor]=0
 if notes_override is None:audio*=uniform_filter1d(gain,size=round(SR*.025))
 # Same gentle dip treatment accepted in the two source-song auditions.
 env=np.sqrt(np.maximum(uniform_filter1d(source*source,size=round(SR*.12)),0))
 reference=max(float(np.percentile(env,75)),1e-8)
 desired=np.clip((reference/np.maximum(env,1e-8))**.4,1,10**(3/20))
 activity=np.clip((env/reference-.06)/.14,0,1)
 if notes_override is None:audio*=uniform_filter1d(1+(desired-1)*activity,size=round(SR*.18))
 if not np.isfinite(audio).all() or rms(audio)<1e-6:raise ValueError('No usable electric guitar returned.')
 audio*=min(1.,.95/max(float(np.abs(audio).max()),1e-8))
 played=playback_notes(performed)
 played=[[n[0],n[1],n[2]+shift,velocities[i]/127] for i,n in enumerate(played)]
 return audio,midi_for(played,27 if tone=='clean' else 30),played

def extract(backing,rate,root,out,max_seconds=60):
 import soundfile as sf
 root=Path(root);out=Path(out);out.mkdir(parents=True,exist_ok=True)
 seconds=backing.shape[-1]/rate
 if not 1<=seconds<=max_seconds:raise ValueError(f'Choose a guitar section of 1–{max_seconds} seconds.')
 source=out/'original-backing.wav';sf.write(source,backing.T,rate,subtype='FLOAT')
 env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
 subprocess.run([sys.executable,str(Path(__file__).resolve()),str(root),str(source),str(out)],env=env,check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 guitar,gr=sf.read(out/'guitar-extracted.wav',always_2d=True,dtype='float32')
 return guitar,gr,json.loads((out/'extraction.json').read_text(encoding='utf-8'))

def arrange(backing,rate,root,out):
 import numpy as np,soundfile as sf
 from scipy.signal import resample_poly
 root=Path(root);out=Path(out)
 guitar,gr,extraction=extract(backing,rate,root,out)
 seconds=backing.shape[-1]/rate
 audio,midi,notes=render_source(out/'guitar-extracted.wav',seconds,root)
 d=math.gcd(24000,rate);audio=resample_poly(audio,rate//d,24000//d)
 audio=np.pad(audio[:backing.shape[-1]],(0,max(0,backing.shape[-1]-len(audio))))
 if gr!=rate:raise ValueError('Guitar separator returned the wrong sample rate.')
 if guitar.shape[1]!=backing.shape[0]:guitar=np.repeat(guitar.mean(1)[:,None],backing.shape[0],axis=1)
 result=backing-guitar.T+np.tile(audio,(backing.shape[0],1))
 if not np.isfinite(result).all():raise ValueError('Invalid guitar backing.')
 result*=min(1.,.98/max(float(np.abs(result).max()),1e-8))
 sf.write(out/'electric-guitar.wav',audio,rate,subtype='FLOAT');midi.write(str(out/'guitar-notes.mid'))
 metadata=dict(engine='tsumugi-guitar-source-notes',seconds=seconds,notes=notes,timingVerified=False,source=extraction)
 import shutil
 for credit,name in [(root/'data/instrument-samples/SeparateLibraries/ATTRIBUTION.txt','INSTRUMENT_ATTRIBUTION.txt'),(root/'data/nam/models/ATTRIBUTION.txt','NAM_ATTRIBUTION.txt')]:
  if credit.is_file():shutil.copyfile(credit,out/name)
 (out/'guitar-analysis.json').write_text(json.dumps(metadata),encoding='utf-8')
 return result,metadata

if __name__=='__main__':
 import numpy as np,soundfile as sf,torch,gc,hashlib
 from scipy.signal import resample_poly
 root,source,out=map(Path,sys.argv[1:]);os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
 os.environ['HF_HUB_OFFLINE']='1';torch.set_num_threads(4)
 sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
 import yaml
 from models.bs_roformer.bs_roformer import BSRoformer
 repo=root/'data/msst-mega';ckpt=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
 if hashlib.sha256(ckpt.read_bytes()).hexdigest()!='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f':raise ValueError('Guitar separator checksum mismatch.')
 cfg=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
 for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:cfg['model'][key]=tuple(cfg['model'][key])
 model=BSRoformer(**cfg['model']);state=torch.load(ckpt,map_location='cpu',weights_only=True);model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect()
 device='cuda' if torch.cuda.is_available() else 'cpu';model.eval().to(device)
 x,rate=sf.read(source,always_2d=True,dtype='float32');channels=x.shape[1]
 if channels==1:x=np.repeat(x,2,axis=1)
 d=math.gcd(rate,44100);x=resample_poly(x,44100//d,rate//d,axis=0)
 names=['acoustic-guitar','electric-guitar'];ids=[cfg['training']['instruments'].index(n) for n in names]
 total=np.zeros((2,2,len(x)),np.float32);weights=np.zeros(len(x),np.float32)
 print('Extracting acoustic and electric guitar candidates…',flush=True)
 with torch.inference_mode():
  for p in range(0,len(x),3*44100):
   a=torch.from_numpy(x[p:p+4*44100].T.copy());n=a.shape[-1]
   if n<2048:a=torch.nn.functional.pad(a,(0,2048-n))
   with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
    b=model(a[None].to(device),active_stem_ids=ids)[0,:,:,:n].float().cpu().numpy()
   w=np.maximum(np.hanning(n),.001).astype(np.float32);total[:,:,p:p+n]+=b*w;weights[p:p+n]+=w
 total/=weights;levels=np.sqrt(np.mean(total**2,axis=(1,2)));chosen=int(levels.argmax())
 if levels[chosen]<max(1e-5,float(np.sqrt(np.mean(x*x)))*.02):raise ValueError('No clear guitar part detected. Use original instruments.')
 guitar=total[chosen].T;d=math.gcd(rate,44100);guitar=resample_poly(guitar,rate//d,44100//d,axis=0)
 guitar=np.pad(guitar[:sf.info(source).frames],((0,max(0,sf.info(source).frames-len(guitar))),(0,0)))
 if channels==1:guitar=guitar.mean(1,keepdims=True)
 sf.write(out/'guitar-extracted.wav',guitar,rate,subtype='FLOAT')
 (out/'extraction.json').write_text(json.dumps(dict(selected=names[chosen],candidateRms={n:float(v) for n,v in zip(names,levels)})),encoding='utf-8')
