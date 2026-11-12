"""Local BeatThis worker. No auto-downloads or dependency on an external service."""
from pathlib import Path
import sys,os,json,hashlib,subprocess,tempfile
MODEL_SHA='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'

def detect(path,root):
 root=Path(root);model=root/'data/arrangement-models/beat-this/final0.ckpt'
 if not model.is_file() or hashlib.sha256(model.read_bytes()).hexdigest()!=MODEL_SHA:
  raise ValueError('Restore final0.ckpt in data/arrangement-models/beat-this.')
 if not (root/'data/music-beat-engine/beat_this').is_dir():raise ValueError('Restore the installed beat tracker engine.')
 cache=root/'data/music-cache';cache.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='source-beats-',dir=cache) as folder:
  target=Path(folder)/'beats.json'
  subprocess.run([sys.executable,str(Path(__file__).resolve()),str(root),str(Path(path).resolve()),str(target)],check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  result=json.loads(target.read_text(encoding='utf-8'))
 beats=result['beats']
 if len(beats)<4 or any(b<=a for a,b in zip(beats,beats[1:])):raise ValueError('No steady beat found. Try a longer section or original instruments.')
 return result

if __name__=='__main__':
 root,source,target=map(Path,sys.argv[1:]);os.environ['HF_HUB_OFFLINE']='1'
 os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
 sys.path[:0]=[str(root/'data/music-beat-engine'),str(root/'data/mega-packages')]
 import torch
 torch.set_num_threads(4)
 def blocked(*args,**kwargs):raise RuntimeError('Automatic beat model downloads are disabled.')
 torch.hub.load_state_dict_from_url=blocked;torch.hub.download_url_to_file=blocked
 from beat_this.inference import File2Beats
 beats,bars=File2Beats(checkpoint_path=str(root/'data/arrangement-models/beat-this/final0.ckpt'),device='cpu',dbn=False)(str(source))
 target.write_text(json.dumps({'beats':beats.tolist(),'downbeats':bars.tolist()}),encoding='utf-8')
