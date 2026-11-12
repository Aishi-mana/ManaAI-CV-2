"""Source guitar effects audition. No note generation, library or app changes."""
from pathlib import Path
import os,sys,json,gc,hashlib
root=Path.cwd()
os.environ['HF_HUB_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
import numpy as np, soundfile as sf, torch
from scipy.signal import butter,sosfilt,resample_poly
torch.set_num_threads(4)
out=root/'exports/singing/country-guitar-drive-20261108';out.mkdir(exist_ok=True)
source=root/'exports/singing/1794090410615/backing-extracted.wav'
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
audio,sr=sf.read(source,always_2d=True,dtype='float32');assert sr==44100
# Include context around the audible 18–28 second comparison.
offset=16; duration=14
x=audio[offset*sr:(offset+duration)*sr].T.copy()
cache=out/'guitar-with-context.npy'
if cache.exists():
    guitar=np.load(cache)
else:
    sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
    import yaml
    from models.bs_roformer.bs_roformer import BSRoformer
    repo=root/'data/msst-mega'
    ckpt=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
    assert hashlib.sha256(ckpt.read_bytes()).hexdigest()=='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f'
    cfg=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
    for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:cfg['model'][key]=tuple(cfg['model'][key])
    model=BSRoformer(**cfg['model'])
    state=torch.load(ckpt,map_location='cpu',weights_only=True)
    model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect()
    model.eval().cuda()
    target=cfg['training']['instruments'].index('acoustic-guitar')
    guitar=np.zeros_like(x);weights=np.zeros(x.shape[-1],np.float32)
    with torch.inference_mode():
        for p in range(0,x.shape[-1],3*sr):
            a=torch.from_numpy(x[:,p:p+4*sr].copy());n=a.shape[-1]
            print('Separating acoustic guitar at',offset+p/sr,flush=True)
            with torch.autocast('cuda',dtype=torch.float16):
                b=model(a[None].cuda(),active_stem_ids=[target])[0,0,:,:n].float().cpu().numpy()
            w=np.maximum(np.hanning(n),.001).astype(np.float32)
            guitar[:,p:p+n]+=b*w;weights[p:p+n]+=w
    guitar/=weights
    np.save(cache,guitar)
    del model;gc.collect();torch.cuda.empty_cache()

def rms(a):return float(np.sqrt(np.mean(np.square(a,dtype=np.float64))))
assert guitar.shape==x.shape and rms(guitar)>.003, 'No usable guitar stem; do not amplify noise.'
def filt(a,hz,kind,rate):
    return sosfilt(butter(2,hz,btype=kind,fs=rate,output='sos'),a,axis=-1)
def drive(a):
    # Oversampling keeps nonlinear harmonics from aliasing into the audible band.
    z=resample_poly(a,4,1,axis=-1)
    z=filt(z,100,'highpass',sr*4)
    z=filt(z,6500,'lowpass',sr*4)
    gain=3/max(rms(z),.02)
    z=np.tanh(z*gain)
    # Broad amp/cabinet-style filtering, not a learned electric-guitar conversion.
    z=filt(z,105,'highpass',sr*4)
    z=filt(z,4200,'lowpass',sr*4)
    z=resample_poly(z,1,4,axis=-1)[...,:a.shape[-1]]
    return z*(rms(a)/max(rms(z),1e-8))
processed=drive(guitar)
residual=x-guitar
mixed=residual+processed
sl=slice(2*sr,12*sr)
original=x[:,sl];candidate=mixed[:,sl]
def audition(name,a):
    scale=min(.95/max(float(np.abs(a).max()),1e-8),.07/max(rms(a),1e-8))
    b=a*scale
    assert np.isfinite(b).all() and b.shape[-1]==10*sr
    sf.write(out/name,b.T,sr,subtype='PCM_24')
    return {'peak':float(np.abs(b).max()),'rms':rms(b),'scale':scale}
checks={}
checks['original']=audition('Original backing.wav',original)
checks['driven']=audition('Driven guitar backing.wav',candidate)
checks['guitar_original']=audition('Isolated original guitar.wav',guitar[:,sl])
checks['guitar_driven']=audition('Isolated driven guitar.wav',processed[:,sl])
sf.write(out/'Driven backing raw.wav',mixed[:,sl].T,sr,subtype='FLOAT')
checks.update(source=str(source),source_hash=source_hash,source_unchanged=source_hash==hashlib.sha256(source.read_bytes()).hexdigest(),
    source_start_seconds=18,duration_seconds=10,method='Mega acoustic-guitar separation; oversampled tanh drive; amp-style high/low-pass filters; replace guitar in original residual',
    generated_notes=False,generated_audio_model=False,source_guitar_rms=rms(guitar),source_backing_rms=rms(x),
    bypass_reconstruction_error=float(np.max(np.abs(residual+guitar-x))))
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps(checks),flush=True)
