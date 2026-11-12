"""Separate trial auditions; never loads or changes Mana's approved profile."""
from pathlib import Path
from types import SimpleNamespace
import sys,os,json,hashlib,time
root=Path(__file__).resolve().parents[1]
engine=root/'data/applio-training/engine'
os.chdir(engine)
sys.path.insert(0,str(engine))
import torch
import librosa
import numpy as np
import soundfile as sf
from rvc.lib.utils import load_embedding
from rvc.lib.algorithm.synthesizers import Synthesizer
from rvc.infer.pipeline import Pipeline
epoch=int(sys.argv[sys.argv.index('--epoch')+1]) if '--epoch' in sys.argv else 50
experiment=engine/'logs/mousey-v2-trial-v1'
models=list(experiment.glob(f'mousey-v2-trial-v1_{epoch}e_*s.pth'))
assert len(models)==1,models
model=models[0]
torch.set_num_threads(4);torch.manual_seed(42)
checkpoint=torch.load(model,map_location='cpu',weights_only=True)
settings=SimpleNamespace(device='cpu',x_pad=1,x_query=6,x_center=38,x_max=41)
checkpoint['config'][-3]=checkpoint['weight']['emb_g.weight'].shape[0]
sr=checkpoint['config'][-1]
net=Synthesizer(*checkpoint['config'],use_f0=True,text_enc_hidden_dim=768,vocoder='HiFi-GAN')
del net.enc_q
loaded=net.load_state_dict(checkpoint['weight'],strict=False)
assert not loaded.missing_keys and not loaded.unexpected_keys,str(loaded)
net=net.float().eval()
hubert=load_embedding('contentvec').float().eval()
pipeline=Pipeline(sr,settings)
out=root/f'exports/singing/mousey-v2-trial-v1/epoch-{epoch}'
out.mkdir(parents=True,exist_ok=True)
rows=[]
out=out/'extra-check'
out.mkdir(parents=True,exist_ok=True)
for label,source,offset,duration in [('Longer chat reply',root/'exports/singing/mousey-v2-trial-v1/epoch-10/extra-check/chat-guide.wav',0,None),('Whereabouts of Light',root/'exports/singing/1791861784048/guide-vocals.wav',36,24)]:
    audio,rate=librosa.load(source,sr=16000,mono=True,offset=offset,duration=duration)
    with torch.inference_mode():
        converted=pipeline.pipeline(hubert,net,0,audio,0,'rmvpe','',0,True,1,'v2',.33,False,0,False,155)
    a=np.asarray(converted,dtype=np.float32)
    assert np.isfinite(a).all()
    assert abs(len(a)/sr-len(audio)/rate)<.1
    rms=float(np.sqrt(np.mean(a*a)))
    assert rms>.001
    a*=min(.1/rms,.95/max(float(np.max(np.abs(a))),1e-6))
    path=out/(label+' - Mousey v2.wav')
    sf.write(path,a,sr,subtype='PCM_16')
    rows.append(dict(path=str(path),seconds=len(a)/sr,peak=float(np.max(np.abs(a))),rms=float(np.sqrt(np.mean(a*a)))))
    print(label,'READY',flush=True)
(out/'checks.json').write_text(json.dumps(dict(epoch=epoch,model=str(model),modelSha256=hashlib.sha256(model.read_bytes()).hexdigest(),outputs=rows,activeVoiceChanged=False),indent=2),encoding='utf-8')
