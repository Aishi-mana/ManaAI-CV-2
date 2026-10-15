"""Alternate lead/back/combined vocal extraction; source and app left unchanged."""
from pathlib import Path
import os, sys, json, gc, hashlib, subprocess
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/vocal-extraction-170s-2026-10-13'
out.mkdir(parents=True,exist_ok=True)
sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
os.environ['HF_HUB_OFFLINE']='1'
import numpy as np
import torch, yaml, soundfile as sf
from models.bs_roformer.bs_roformer import BSRoformer
torch.set_num_threads(4)
source=Path('C:/Users/Admin/Downloads/Trails in the Sky - The Whereabouts of Light (星の在り処) ENGLISH COVER VERSION ft. @Lowlander_.mp3')
mix=out/'original-mix.wav'
subprocess.run(['C:/AI/Applio/ffmpeg.exe','-hide_banner','-loglevel','error','-y',
    '-ss','170','-i',str(source),'-t','30','-ar','44100','-ac','2',str(mix)],check=True)
audio,sr=sf.read(mix,always_2d=True,dtype='float32')
assert sr==44100 and len(audio)==30*sr and np.isfinite(audio).all()
repo=root/'data/msst-mega'
checkpoint=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
with checkpoint.open('rb') as f:
    digest=hashlib.sha256()
    for block in iter(lambda:f.read(1024*1024),b''):digest.update(block)
    assert digest.hexdigest()=='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f'
config=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:
    config['model'][key]=tuple(config['model'][key])
model=BSRoformer(**config['model'])
state=torch.load(checkpoint,map_location='cpu',weights_only=True)
if 'state_dict' in state:state=state['state_dict']
model.load_state_dict(state,strict=True);del state;gc.collect()
device='cuda' if torch.cuda.is_available() else 'cpu'
model.eval().to(device)
names=['lead-vocal','back-vocal','vocal']
ids=[config['training']['instruments'].index(name) for name in names]
tensor=torch.from_numpy(audio.T.copy())
total=np.zeros((3,2,len(audio)),np.float32);weights=np.zeros(len(audio),np.float32)
with torch.inference_mode():
    for start in range(0,len(audio),sr*3):
        chunk=tensor[:,start:start+sr*4];length=chunk.shape[-1]
        if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
        with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
            output=model(chunk[None].to(device),active_stem_ids=ids)[0,:,:,:length].float().cpu().numpy()
        weight=np.maximum(np.hanning(length),.001).astype(np.float32)
        total[:,:,start:start+length]+=output*weight;weights[start:start+length]+=weight
        print(f'Extracted through {min(start+length,len(audio))/sr:.1f}s',flush=True)
assert np.all(weights>0)
parts=total/weights
levels=[]
for name,samples in zip(names,parts):
    samples=samples.T
    assert np.isfinite(samples).all()
    sf.write(out/(name+'-raw.wav'),samples,sr,subtype='FLOAT')
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    gain=min(.1/max(rms,1e-8),.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),samples*gain,sr,subtype='PCM_16')
    levels.append(dict(name=name,rms=rms,peak=peak,gain=gain))
report=dict(source=str(source),start=170,seconds=30,separator='Mega 53-stem BS-Roformer',
    device=device,chunkSeconds=4,hopSeconds=3,targets=names,levels=levels,
    productionChanged=False,listeningApproved=False)
(out/'extraction.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
