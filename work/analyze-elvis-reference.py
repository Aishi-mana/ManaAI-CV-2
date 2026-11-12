from pathlib import Path
import os,sys,json,gc
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work');os.environ['HF_HUB_OFFLINE']='1'
import numpy as np,soundfile as sf,torch,yaml
from scipy.signal import welch
torch.set_num_threads(4)
path=Path('C:/Users/Admin/Downloads/Elvis Special Theme (Final Ver.) Bravely Default II OST.mp3')
x,sr=sf.read(path,always_2d=True,dtype='float32');assert sr==44100
out=root/'exports/singing/elvis-jazz-reference-20261108';out.mkdir(exist_ok=True)
sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
from models.bs_roformer.bs_roformer import BSRoformer
repo=root/'data/msst-mega'
cfg=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:cfg['model'][key]=tuple(cfg['model'][key])
model=BSRoformer(**cfg['model']);state=torch.load(repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt',map_location='cpu',weights_only=True)
model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect();model.eval().cuda()
names=['saxophone','clarinet','trumpet','brass'];names[0]='sax' if 'sax' in cfg['training']['instruments'] else 'saxophone'
ids=[cfg['training']['instruments'].index(n) for n in names]
segment=x[:sr*16];total=np.zeros((len(names),2,len(segment)),np.float32);weights=np.zeros(len(segment),np.float32)
with torch.inference_mode():
 for p in range(0,len(segment),sr*3):
  a=torch.from_numpy(segment[p:p+sr*4].T.copy());n=a.shape[-1]
  print('Analyzing reference at',p/sr,flush=True)
  with torch.autocast('cuda',dtype=torch.float16):b=model(a[None].cuda(),active_stem_ids=ids)[0,:,:,:n].float().cpu().numpy()
  w=np.maximum(np.hanning(n),.001).astype(np.float32);total[:,:,p:p+n]+=b*w;weights[p:p+n]+=w
total/=weights
levels={name:float(np.sqrt(np.mean(a*a))) for name,a in zip(names,total)}
for name,a in zip(names,total):sf.write(out/(name+' estimate.wav'),a.T,sr,subtype='FLOAT')
del model,total;gc.collect();torch.cuda.empty_cache()
sys.path.insert(0,str(root/'work/beat-this'))
from beat_this.inference import File2Beats
beats,bars=File2Beats(checkpoint_path=str(root/'data/arrangement-models/beat-this/final0.ckpt'),device='cpu',dbn=False)(str(path))
report={'reference':str(path),'seconds':len(x)/sr,'instrument_estimate_rms_first16s':levels,
 'estimated_median_bpm':float(60/np.median(np.diff(beats))),
 'limitations':'Separator energy and beat estimates are not ear-based instrument identification, style classification or a proof of the score.'}
(out/'analysis.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
