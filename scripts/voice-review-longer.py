from pathlib import Path
import os,json,sys
sys.stdout.reconfigure(encoding='utf-8');sys.stderr.reconfigure(encoding='utf-8')
root=Path.cwd();os.environ['HF_HOME']=str(root/'data/music-cache/huggingface');os.environ['TORCH_HOME']=str(root/'data/music-cache/torch')
import numpy as np,torch,librosa,soundfile as sf
from demucs.pretrained import get_model
from demucs.apply import apply_model
torch.set_num_threads(6);device='cuda' if torch.cuda.is_available() and torch.cuda.mem_get_info()[0]>2500000000 else 'cpu';print('Separation device:',device,flush=True)
source=Path(r'C:\Users\Admin\Downloads\Yuuki Voice');out=root/'exports/voice-review/longer';out.mkdir(parents=True,exist_ok=True);model=get_model('htdemucs').to(device).eval();regions=[('trailer',next(source.glob('*Fractured*')),0,30),('bike-middle',next(source.glob('*AudioTrimmer*')),150,45),('bike-later',next(source.glob('*AudioTrimmer*')),300,60)]
meta=[]
for name,path,start,seconds in regions:
 y,sr=librosa.load(path,sr=44100,mono=False,offset=start,duration=seconds);x=torch.from_numpy(y);ref=x.mean(0);mean=ref.mean();std=ref.std().clamp(min=1e-6)
 with torch.inference_mode():stems=apply_model(model,((x-mean)/std)[None],device=device,shifts=0,split=True,overlap=.25,progress=False)[0].cpu()*std+mean
 vocal=stems[model.sources.index('vocals')].numpy();sf.write(out/f'{name}-original.wav',y.T,sr,subtype='PCM_16');sf.write(out/f'{name}-vocals.wav',vocal.T,sr,subtype='PCM_16');meta.append({'id':name,'source':str(path),'sourceOffset':start,'duration':len(y[0])/sr,'sampleRate':sr,'cleanup':'Demucs htdemucs vocal separation; unverified artifacts/speaker identity'});(out/'regions.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8');print(name,'prepared',flush=True)
