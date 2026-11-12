from pathlib import Path
import sys,json
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'work/melodyflow-native/tools'))
from audiocraft_ckpt import load
import torch
folder=root/'data/jasco-chords-drums-melody-400M'
pointer=torch.load(folder/'compression_state_dict.bin',map_location='cpu',weights_only=True)
print('Codec pointer:',pointer,flush=True)
state,cfg=load(folder/'state_dict.bin')
report=dict(codecPointer=pointer,parameters=sum(x.size for x in state.values()),config=cfg)
(root/'work/jasco-local-config.json').write_text(json.dumps(report,indent=2,default=str),encoding='utf-8')
print('Config saved; tensors:',len(state),flush=True)
print(json.dumps({k:cfg.get(k) for k in ['conditioners','compression_model','dataset','fuser']},default=str),flush=True)
