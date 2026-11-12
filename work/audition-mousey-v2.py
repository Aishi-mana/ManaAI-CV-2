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
sources=[('New chat reply',root/'exports/singing/mana-chat-contraction-check/normalized - raw chat.wav',None),
         ('Country Roads',root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav',None),
         ('Held-out singing',root/'data/custom-voice/mousey-v2-rvc-trial-v1/holdout/sing-01.wav',None),
         ('Held-out neutral speech',root/'data/custom-voice/mousey-v2-rvc-trial-v1/holdout/01.wav',8)]
def save(name,a,rate):
    a=np.asarray(a,dtype=np.float32)
    assert np.isfinite(a).all()
    rms=float(np.sqrt(np.mean(a*a)));assert rms>.001
    a*=min(.1/rms,.95/max(float(np.max(np.abs(a))),1e-6))
    path=out/name;sf.write(path,a,rate,subtype='PCM_16')
    rows.append(dict(path=str(path),seconds=len(a)/rate,sampleRate=rate,peak=float(np.max(np.abs(a))),rms=float(np.sqrt(np.mean(a*a)))))
for label,source,duration in sources:
    audio,rate=librosa.load(source,sr=16000,mono=True,duration=duration)
    with torch.inference_mode():
        converted=pipeline.pipeline(hubert,net,0,audio,0,'rmvpe','',0,True,1,'v2',.33,False,0,False,155)
    assert abs(len(converted)/sr-len(audio)/rate)<.1
    save(label+' - Mousey v2.wav',converted,sr)
    if label.startswith('Held-out'):
        save(label+' - original.wav',audio,rate)
    print(label+' READY',flush=True)
dataset=json.loads((root/'data/custom-voice/mousey-v2-rvc-trial-v1/manifest.json').read_text(encoding='utf-8'))
report=dict(model=str(model),modelSha256=hashlib.sha256(model.read_bytes()).hexdigest(),epoch=epoch,
            trainingSeconds=dataset['trainSeconds'],holdoutSeconds=dataset['holdoutSeconds'],outputs=rows,
            pitchShift=0,indexRate=0,autotune=False,effects=False,activeVoiceChanged=False,listeningApproved=False)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('AUDITION_READY',flush=True)
