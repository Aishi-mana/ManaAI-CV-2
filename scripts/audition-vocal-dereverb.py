"""Dedicated de-reverb audition on the existing 62–82s lead vocal."""
from pathlib import Path
import sys,json,gc,hashlib
root=Path(__file__).resolve().parents[1]
variant=sys.argv[1] if len(sys.argv)>1 else 'mono'
if variant not in ['mono','harmony']:raise ValueError('Choose mono or harmony cleanup.')
out=root/('exports/singing/whereabout-72s-harmony-audition' if variant=='harmony' else 'exports/singing/whereabout-72s-dereverb-audition')
out.mkdir(parents=True,exist_ok=True)
sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
import torch,yaml,numpy as np,soundfile as sf
from models.bs_roformer.mel_band_roformer import MelBandRoformer
torch.set_num_threads(4)
checkpoint=root/('data/vocal-dereverb/harmony-model.ckpt' if variant=='harmony' else 'data/vocal-dereverb/model.ckpt')
expected='9262877b87e9ebb0fb808a456b0a411fa677f5df31c8383c1254af531c078970' if variant=='harmony' else 'f099ee717eb57fb0ad5eb0e7c9ad6787c36168140b61ce2b158b90c2c4ecee79'
digest=hashlib.sha256()
with checkpoint.open('rb') as f:
    for block in iter(lambda:f.read(1024*1024),b''):digest.update(block)
assert digest.hexdigest()==expected
config=yaml.safe_load((root/'data/vocal-dereverb/config.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
config['model']['multi_stft_resolutions_window_sizes']=tuple(config['model']['multi_stft_resolutions_window_sizes'])
model=MelBandRoformer(**config['model'])
state=torch.load(checkpoint,map_location='cpu',weights_only=True)
if 'state_dict' in state:state=state['state_dict']
model.load_state_dict(state,strict=True);del state;gc.collect()
device='cuda' if torch.cuda.is_available() else 'cpu'
model.eval().to(device)
audio,sr=sf.read(root/'exports/singing/whereabout-72s-diagnosis/lead-raw.wav',always_2d=True,dtype='float32')
assert sr==44100 and len(audio)==20*sr
tensor=torch.from_numpy(audio.T.copy())
total=np.zeros((2,len(audio)),np.float32);weights=np.zeros(len(audio),np.float32)
with torch.inference_mode():
    for start in range(0,len(audio),6*sr):
        chunk=tensor[:,start:start+8*sr];length=chunk.shape[-1]
        if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
        with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
            output=model(chunk[None].to(device))[0,:,:length].float().cpu().numpy()
        weight=np.maximum(np.hanning(length),.001).astype(np.float32)
        total[:,start:start+length]+=output*weight;weights[start:start+length]+=weight
        print(f'Cleaned through {min(start+length,len(audio))/sr:.1f}s',flush=True)
assert np.all(weights>0)
clean=(total/weights).T
assert np.isfinite(clean).all()
sf.write(out/'clean-lead-raw.wav',clean,sr,subtype='FLOAT')
removed=audio-clean
levels=[]
for name,samples in [('before-lead',audio),('clean-lead',clean),('removed-material',removed)]:
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    gain=min(.1/max(rms,1e-8),.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),samples*gain,sr,subtype='PCM_16')
    levels.append(dict(name=name,rms=rms,peak=peak,gain=gain))
report=dict(model='anvuew original harmony-suppressing SDR19.1729' if variant=='harmony' else 'anvuew mono dereverb SDR20.4029',sha256=digest.hexdigest(),
    source='https://huggingface.co/anvuew/dereverb_mel_band_roformer',license='GPL-3.0',
    songStart=62,seconds=20,device=device,levels=levels,
    productionChanged=False,listeningApproved=False)
(out/'cleanup.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
