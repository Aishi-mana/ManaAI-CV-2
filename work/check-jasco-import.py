from pathlib import Path
import sys,os
root=Path(__file__).resolve().parents[1]
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TORCH_HOME']=str(root/'data/music-cache/torch')
sys.path[:0]=[str(root/'data/jasco-packages'),str(root/'work/jasco-audiocraft')]
import torch
print('Torch',torch.__version__,'CUDA',torch.version.cuda,flush=True)
from audiocraft.models.jasco import JASCO
print('JASCO import ready',flush=True)
