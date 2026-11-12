from pathlib import Path
import os,sys,json,hashlib,math,gc
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
import torch,numpy as np,soundfile as sf,yaml
from scipy.signal import resample_poly
from models.bs_roformer.bs_roformer import BSRoformer
torch.set_num_threads(4)
repo=root/'data/msst-mega';checkpoint=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
assert hashlib.sha256(checkpoint.read_bytes()).hexdigest()=='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f'
config=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text().replace('!!python/tuple',''))
for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:config['model'][key]=tuple(config['model'][key])
model=BSRoformer(**config['model'])
state=torch.load(checkpoint,map_location='cpu',weights_only=True)
model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect()
device='cuda' if torch.cuda.is_available() else 'cpu';model.eval().to(device)
source=Path(json.loads((root/'exports/singing/note-jazz-prototype-20261108/notes-and-chords.json').read_text())['source'])
if len(sys.argv)>1:source=Path(sys.argv[1])
digest=hashlib.sha256(source.read_bytes()).hexdigest()
a,sr=sf.read(source,dtype='float32',always_2d=True);g=math.gcd(sr,44100)
a=resample_poly(a.mean(1),44100//g,sr//g).astype(np.float32)
tensor=torch.from_numpy(np.stack([a,a]))
stem_id=config['training']['instruments'].index('piano')
total=np.zeros((2,len(a)),np.float32);weights=np.zeros(len(a),np.float32)
print('Extracting acoustic piano on '+device,flush=True)
with torch.inference_mode():
 for start in range(0,len(a),44100*3):
  chunk=tensor[:,start:start+44100*4];length=chunk.shape[-1]
  if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
  with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
   result=model(chunk[None].to(device),active_stem_ids=[stem_id])[0,0,:,:length].float().cpu().numpy()
  w=np.maximum(np.hanning(length),.001).astype(np.float32)
  total[:,start:start+length]+=result*w;weights[start:start+length]+=w
  print('Window '+str(start/44100)+' done',flush=True)
piano=(total/weights).mean(0)
assert np.isfinite(piano).all() and hashlib.sha256(source.read_bytes()).hexdigest()==digest
out=root/'exports/singing/mega-piano-extraction-20261108';out.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>2:out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
for label,data in [('Original excerpt',a),('Extracted piano',piano),('Remaining backing',a-piano)]:sf.write(out/(label+f' - {len(a)/44100:g}s.wav'),data,44100,subtype='FLOAT')
report=dict(duration=len(a)/44100,sourceUnchanged=True,noteSynthesis=False,normalization=False,peak=float(abs(piano).max()),rms=float(np.sqrt(np.mean(piano*piano))),sourceRms=float(np.sqrt(np.mean(a*a))),productionChanged=False,listeningApproved=False)
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
