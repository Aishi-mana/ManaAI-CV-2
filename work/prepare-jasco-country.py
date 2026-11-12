from pathlib import Path
import os, sys, json, math, gc
root=Path.cwd()
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
import numpy as np, soundfile as sf, torch
from scipy.signal import resample_poly
torch.set_num_threads(4)
out=root/'exports/singing/jasco-country-rock-20261108';out.mkdir(exist_ok=True)
src=root/'exports/singing/1794090410615'
start=18;duration=10
def read(name,rate):
    a,sr=sf.read(src/name,always_2d=True)
    a=a[start*sr:(start+duration)*sr].mean(1)
    g=math.gcd(sr,rate)
    return resample_poly(a,rate//g,sr//g).astype(np.float32)
back=read('backing-extracted.wav',44100)
lead=read('lead-extracted.wav',16000)
sf.write(out/'Original backing.wav',back,44100,subtype='FLOAT')
sf.write(out/'Original vocal.wav',lead,16000,subtype='FLOAT')
sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
import yaml
from models.bs_roformer.bs_roformer import BSRoformer
repo=root/'data/msst-mega'
cfg=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
for k in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:cfg['model'][k]=tuple(cfg['model'][k])
model=BSRoformer(**cfg['model'])
state=torch.load(repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt',map_location='cpu',weights_only=True)
model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect()
model.eval().to('cuda')
print('Extracting real drums',flush=True)
stem=cfg['training']['instruments'].index('drums')
total=np.zeros((2,len(back)),np.float32);weights=np.zeros(len(back),np.float32)
with torch.inference_mode():
    for p in range(0,len(back),3*44100):
        a=torch.from_numpy(np.stack([back[p:p+4*44100]]*2));n=a.shape[-1]
        with torch.autocast('cuda',dtype=torch.float16):
            b=model(a[None].cuda(),active_stem_ids=[stem])[0,0,:,:n].float().cpu().numpy()
        w=np.maximum(np.hanning(n),.001).astype(np.float32)
        total[:,p:p+n]+=b*w;weights[p:p+n]+=w
drums=(total/weights).mean(0)
sf.write(out/'Source drums.wav',resample_poly(drums,320,441),32000,subtype='FLOAT')
del model;gc.collect();torch.cuda.empty_cache()
sys.path.insert(0,str(root/'data/seed-vc'))
from modules.rmvpe import RMVPE
pitch=RMVPE(str(root/'data/seed-vc/checkpoints/models--lj1995--VoiceConversionWebUI/blobs/6d62215f4306e3ca278246188607209f09af3dc77ed4232efdd069798c4ec193'),is_half=False,device='cpu')
print('Extracting vocal pitch',flush=True)
f0=pitch.infer_from_audio(lead,thred=.03)
# Official lonzi preprocessing centers semitone bins from G2 (MIDI 43), 53 bins.
f=np.interp(np.arange(500)/50,np.arange(len(f0))*.01,f0)
notes=np.rint(69+12*np.log2(np.maximum(f,1)/440)).astype(int)
valid=(f>0)&(notes>=43)&(notes<=95)
melody=np.zeros((53,500),np.float32);melody[notes[valid]-43,np.flatnonzero(valid)]=1
np.save(out/'melody.npy',melody)
# Chords are conservative major/minor template ESTIMATES, not a validated score.
import librosa
print('Estimating timed source chords',flush=True)
y=resample_poly(back,1,2);sr=22050
chroma=librosa.feature.chroma_stft(y=y,sr=sr,n_fft=4096,hop_length=441)
labels=[];templates=[]
names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
for r,name in enumerate(names):
    for suffix,third in [('',4),('m',3)]:
        t=np.zeros(12);t[[r,(r+third)%12,(r+7)%12]]=1
        labels.append(name+suffix);templates.append(t/np.linalg.norm(t))
templates=np.array(templates)
chords=[];scores=[]
for t in np.arange(0,10,.5):
    c=chroma[:,int(t*50):int((t+.5)*50)].mean(1);c/=max(np.linalg.norm(c),1e-8)
    s=templates@c;i=int(s.argmax());label=labels[i]
    if not chords or chords[-1][0]!=label:chords.append([label,float(t)])
    scores.append(float(s[i]))
report={'source':str(src),'start_seconds':start,'duration':duration,'chords':chords,
    'chord_method':'unverified major/minor chroma-template estimate, half-second windows',
    'chord_similarity_mean':float(np.mean(scores)),'melody_bin_0_midi':43,
    'melody_voiced_fraction':float(valid.mean()),'drums_rms':float(np.sqrt(np.mean(drums**2))),
    'melody_mapping_source':'lonzi/ismir2017-deepsalience commit 0a9f23963b3c32758a97d39ba95161e8c0260317 predict/postprocess_saliency.py'}
(out/'guidance.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
