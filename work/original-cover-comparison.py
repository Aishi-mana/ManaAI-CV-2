from pathlib import Path
import os,sys,json
root=Path(__file__).resolve().parents[1]
engine=root/'data/applio-training/engine';sys.path.insert(0,str(engine));os.chdir(engine)
import numpy as np
import librosa,soundfile as sf,torch
torch.set_num_threads(4)
from rvc.lib.predictors.RMVPE import RMVPE0Predictor
pitch=RMVPE0Predictor(str(engine/'rvc/models/predictors/rmvpe.pt'),device='cpu')
folder=root/'exports/singing/1793880399944'
out=root/'exports/singing/original-cover-review-20261105';out.mkdir(parents=True,exist_ok=True)
rows=[]
for name in ['guide-vocals.wav','vc_mana-trained-v1.wav']:
 a,sr=librosa.load(folder/name,sr=16000,mono=True)
 f=pitch.infer_from_audio(a)
 voiced=f[f>0]
 rows.append(dict(file=name,voicedFraction=float(np.mean(f>0)),pitchPercentiles=np.percentile(voiced,[5,25,50,75,95]).tolist()))
 np.save(out/(name+'.f0.npy'),f)
voice,vsr=sf.read(folder/'vc_mana-trained-v1.wav',always_2d=True,dtype='float32')
back,sr=sf.read(folder/'instrumental.wav',always_2d=True,dtype='float32')
voice=librosa.resample(voice.T,orig_sr=vsr,target_sr=sr).T
voice=np.repeat(voice,2,axis=1)
guide,_=sf.read(folder/'guide-vocals.wav',always_2d=True,dtype='float32')
voice*=np.sqrt(np.mean(guide**2))/np.sqrt(np.mean(voice**2))
n=min(len(voice),len(back));mix=voice[:n]+back[:n]
mix*=min(1,.98/max(abs(mix).max(),1e-6))
sf.write(out/'Original backing restored - full comparison.wav',mix,sr,subtype='PCM_16')
sf.write(out/'Original backing restored - 24 second comparison.wav',mix[18*sr:42*sr],sr,subtype='PCM_16')
(out/'checks.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))
