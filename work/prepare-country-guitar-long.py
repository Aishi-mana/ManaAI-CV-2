"""Extract original guitar for a longer independent listening gate."""
from pathlib import Path
import sys,os,json,gc,hashlib,argparse
root=Path.cwd();os.environ['HF_HUB_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf,torch
torch.set_num_threads(4)
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,default=root/'exports/singing/1794090410615/backing-extracted.wav')
parser.add_argument('--output-dir',type=Path,default=root/'exports/singing/tsumugi-country-dynamics-20261108')
parser.add_argument('--start',type=float,default=0)
parser.add_argument('--stem',choices=['acoustic-guitar','electric-guitar'],default='acoustic-guitar')
args=parser.parse_args()
out=args.output_dir;out.mkdir(exist_ok=True)
source=args.source
x,sr=sf.read(source,always_2d=True,dtype='float32');assert sr==44100
x=x[round(args.start*sr):round((args.start+30)*sr)];assert len(x)==30*sr
sf.write(out/'Original backing.wav',x,sr,subtype='FLOAT')
cache=out/'source-guitar.npy'
if cache.exists():g=np.load(cache)
else:
    sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
    import yaml
    from models.bs_roformer.bs_roformer import BSRoformer
    repo=root/'data/msst-mega';ckpt=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
    assert hashlib.sha256(ckpt.read_bytes()).hexdigest()=='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f'
    cfg=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
    for k in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:cfg['model'][k]=tuple(cfg['model'][k])
    model=BSRoformer(**cfg['model']);state=torch.load(ckpt,map_location='cpu',weights_only=True)
    model.load_state_dict(state.get('state_dict',state),strict=True);del state;gc.collect();model.eval().cuda()
    stem=cfg['training']['instruments'].index(args.stem)
    g=np.zeros_like(x.T);weights=np.zeros(len(x),np.float32)
    with torch.inference_mode():
        for p in range(0,len(x),3*sr):
            a=torch.from_numpy(x[p:p+4*sr].T.copy());n=a.shape[-1]
            print('Separating source guitar',p/sr,flush=True)
            with torch.autocast('cuda',dtype=torch.float16):
                b=model(a[None].cuda(),active_stem_ids=[stem])[0,0,:,:n].float().cpu().numpy()
            w=np.maximum(np.hanning(n),.001).astype(np.float32)
            g[:,p:p+n]+=b*w;weights[p:p+n]+=w
    g/=weights;np.save(cache,g)
sf.write(out/'Original guitar.wav',g.T,sr,subtype='FLOAT')
(out/'source-check.json').write_text(json.dumps({'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'seconds':30,'start_seconds':args.start,'stem':args.stem,'sample_rate':sr,'finite':bool(np.isfinite(g).all())},indent=2),encoding='utf-8')
print('LONG_GUITAR_READY',flush=True)
