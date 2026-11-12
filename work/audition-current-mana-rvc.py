"""No-index audition of the isolated model; no app integration or effects."""
from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
engine=root/'data/applio-training/engine'
os.chdir(engine)
sys.path.insert(0,str(engine))
import numpy as np
import soundfile as sf
import librosa
import torch
from rvc.lib.utils import load_embedding
from rvc.lib.algorithm.synthesizers import Synthesizer
from rvc.infer.pipeline import Pipeline
from rvc.configs.config import Config

torch.set_num_threads(4)
torch.manual_seed(42)
experiment=engine/'logs/mana-current-trial-v1'
models=list(experiment.glob('mana-current-trial-v1_*e_*s.pth'))
if '--epoch' in sys.argv:
    requested=int(sys.argv[sys.argv.index('--epoch')+1])
    models=[p for p in models if f'_{requested}e_' in p.name]
assert models,'No trained inference model'
path=max(models,key=lambda p:int(p.name.split('_')[-2].removesuffix('e')))
checkpoint=torch.load(path,map_location='cpu',weights_only=True)
config=Config()
if '--cpu' in sys.argv:
    config.device='cpu'
checkpoint['config'][-3]=checkpoint['weight']['emb_g.weight'].shape[0]
net=Synthesizer(*checkpoint['config'],use_f0=checkpoint.get('f0',1),
                text_enc_hidden_dim=768,vocoder=checkpoint.get('vocoder','HiFi-GAN'))
del net.enc_q
loaded=net.load_state_dict(checkpoint['weight'],strict=False)
assert not loaded.unexpected_keys, str(loaded)
net=net.to(config.device).float().eval()
hubert=load_embedding('contentvec').to(config.device).float().eval()
sr=checkpoint['config'][-1]
pipeline=Pipeline(sr,config)
out=root/'exports/singing/mana-current-rvc-trial-v1'
if '--epoch' in sys.argv:
    out=out/f'epoch-{requested}'
if '--extended' in sys.argv:
    out=out/'extended-check'
out.mkdir(exist_ok=True,parents=True)
rows=[]
def record(name,samples,rate):
    samples=np.asarray(samples,dtype=np.float32)
    assert np.isfinite(samples).all()
    rms=float(np.sqrt(np.mean(samples**2)))
    assert rms>.001, f'Silent {name}'
    gain=min(.1/rms,.95/max(float(np.max(np.abs(samples))),1e-6))
    samples*=gain
    path=out/name
    sf.write(path,samples,rate,subtype='PCM_16')
    rows.append(dict(file=str(path),seconds=len(samples)/rate,sampleRate=rate,
                     peak=float(np.max(np.abs(samples))),rms=float(np.sqrt(np.mean(samples**2)))))
    print(name,flush=True)

sources=[('Country Roads',root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav',0,None),
         ('Held-out speech',root/'data/custom-voice/mana-current-rvc-trial-v1/holdout/mana-033.wav',0,None)]
if '--extended' in sys.argv:
    sources=[('Country Roads - 60 seconds',root/'exports/singing/1792874633232/guide-vocals.wav',36,60),
             ('Whereabouts of Light - 30 seconds',root/'exports/singing/1791861784048/guide-vocals.wav',36,30),
             ('Held-out speech',root/'data/custom-voice/mana-current-rvc-trial-v1/holdout/mana-033.wav',0,None)]
for label,source,start,duration in sources:
    audio,_=librosa.load(source,sr=16000,mono=True,offset=start,duration=duration)
    with torch.inference_mode():
        converted=pipeline.pipeline(hubert,net,0,audio,0,'rmvpe','',0,
                                    True,1,'v2',.33,False,0,False,155)
    assert abs(len(converted)/sr-len(audio)/16000)<.1,'Conversion duration mismatch'
    record(label+' - trained Mana.wav',converted,sr)
    rows[-1].update(source=str(source),sourceStart=start,sourceDuration=duration)
    if '--extended' in sys.argv and label!='Held-out speech':
        record(label+' - source guide.wav',audio,16000)
    if label=='Held-out speech':
        original,rate=sf.read(source)
        record(label+' - original.wav',original,rate)
if '--extended' not in sys.argv:
    baseline,rate=sf.read(root/'exports/singing/country-roads-stability-20261101/A-current.wav')
    record('Country Roads - previous converter.wav',baseline,rate)
report=dict(model=str(path),modelSha256=hashlib.sha256(path.read_bytes()).hexdigest(),
            epoch=checkpoint.get('epoch'),trainingSeconds=500.96,holdoutSeconds=70.32,
            pitchShift=0,autotune=False,indexRate=0,volumeEnvelope=1,effects=False,
            activeVoiceChanged=False,outputs=rows,audiblyApproved=False)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('AUDITION_READY',flush=True)
