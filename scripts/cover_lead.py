"""Owned extraction subprocess; releases GPU models before CPU voice conversion."""
import gc, hashlib, json, sys
from pathlib import Path
import numpy as np
import soundfile as sf

def extract(root, source, output):
    sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
    import torch, yaml
    from models.bs_roformer.bs_roformer import BSRoformer
    torch.set_num_threads(4)
    repo=root/'data/msst-mega'
    checkpoint=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
    digest=hashlib.sha256()
    with checkpoint.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):digest.update(block)
    if digest.hexdigest()!='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f':
        raise ValueError('Lead separator checkpoint checksum mismatch.')
    config=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
    for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:
        config['model'][key]=tuple(config['model'][key])
    model=BSRoformer(**config['model'])
    state=torch.load(checkpoint,map_location='cpu',weights_only=True)
    if 'state_dict' in state:state=state['state_dict']
    model.load_state_dict(state,strict=True);del state;gc.collect()
    device='cuda' if torch.cuda.is_available() else 'cpu'
    model.eval().to(device)
    audio,sr=sf.read(source,always_2d=True,dtype='float32')
    if sr!=44100 or audio.shape[1]!=2:raise ValueError('Lead separator requires stereo 44.1 kHz audio.')
    ids=[config['training']['instruments'].index(name) for name in ['lead-vocal','vocal']]
    total=np.zeros((2,2,len(audio)),np.float32);weights=np.zeros(len(audio),np.float32)
    tensor=torch.from_numpy(audio.T.copy())
    print(f'Separating lead vocals on {device}; backing harmonies excluded from conversion…',flush=True)
    with torch.inference_mode():
        for start in range(0,len(audio),sr*3):
            chunk=tensor[:,start:start+sr*4];length=chunk.shape[-1]
            if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
            with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
                prediction=model(chunk[None].to(device),active_stem_ids=ids)[0,:,:,:length].float().cpu().numpy()
            weight=np.maximum(np.hanning(length),.001).astype(np.float32)
            total[:,:,start:start+length]+=prediction*weight;weights[start:start+length]+=weight
            print(f'Lead extraction: {min(start+length,len(audio))/sr:.1f}/{len(audio)/sr:.1f}s',flush=True)
    parts=total/weights
    if not np.isfinite(parts).all():raise ValueError('Lead extractor returned invalid audio.')
    output.mkdir(parents=True,exist_ok=True)
    sf.write(output/'lead-extracted.wav',parts[0].T,sr,subtype='FLOAT')
    # Subtract the combined vocal estimate, rather than retaining the original singer's backing voice.
    sf.write(output/'backing-extracted.wav',audio-parts[1].T,sr,subtype='FLOAT')

if __name__=='__main__':
    p=json.load(sys.stdin)
    extract(Path(p['root']),Path(p['source']),Path(p['output']))
