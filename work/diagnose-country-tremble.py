from pathlib import Path
import os,sys,json
root=Path.cwd();os.environ['CUDA_VISIBLE_DEVICES']='';os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['HF_HUB_OFFLINE']='1'
sys.path.insert(0,str(root/'data/seed-vc'))
import torch,numpy as np,soundfile as sf
from scipy.signal import resample_poly,medfilt
from math import gcd
from modules.rmvpe import RMVPE
torch.set_num_threads(4)
model=RMVPE(str(root/'data/seed-vc/checkpoints/models--lj1995--VoiceConversionWebUI/blobs/6d62215f4306e3ca278246188607209f09af3dc77ed4232efdd069798c4ec193'),is_half=False,device='cpu')
files={'guide':root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav','converted50':root/'exports/singing/country-roads-consistency-20261101/baseline-50-steps.wav','converted70':root/'exports/singing/country-roads-consistency-20261101/candidate-70-steps.wav'}
report={};traces={}
for name,path in files.items():
 audio,sr=sf.read(path,always_2d=True);audio=audio.mean(axis=1);g=gcd(sr,16000);audio=resample_poly(audio,16000//g,sr//g).astype(np.float32)
 f0=model.infer_from_audio(audio,thred=.03);traces[name]=f0;v=f0>1;cents=1200*np.log2(np.maximum(f0,1));adj=np.abs(np.diff(cents))[v[:-1]&v[1:]];res=[]
 edges=np.flatnonzero(np.diff(np.r_[False,v,False])).reshape(-1,2)
 for a,b in edges:
  if b-a>=21:
   c=cents[a:b];slow=medfilt(c,21);res.extend((c[10:-10]-slow[10:-10]).tolist())
 report[name]={'voicedFrames':int(v.sum()),'adjacentCents95':float(np.percentile(adj,95)),'medianHz':float(np.median(f0[v])),'fastMotionCentsRms':float(np.sqrt(np.mean(np.square(res)))) if res else 0}
 print(name,report[name],flush=True)
out=root/'exports/singing/country-roads-consistency-20261101';(out/'pitch-diagnosis.json').write_text(json.dumps(report,indent=2),encoding='utf-8');np.savez_compressed(out/'pitch-traces.npz',**traces)
