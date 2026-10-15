"""Offline, optional instrument extraction from saved accompaniment."""
from pathlib import Path
import sys, gc, hashlib
import numpy as np
import soundfile as sf

def extract(source, root, kind):
    import torch
    from scipy.signal import resample_poly
    torch.set_num_threads(4)
    device='cuda' if torch.cuda.is_available() else 'cpu'
    audio=resample_poly(source,147,80).astype(np.float32) # 24k -> 44.1k
    tensor=torch.from_numpy(np.stack([audio,audio]))
    if kind in ['keyboard-extract','electric-piano-extract','trumpet-extract']:
        sys.path[:0]=[str(root/'data/mega-packages'),str(root/'data/msst-mega')]
        import yaml
        from models.bs_roformer.bs_roformer import BSRoformer
        repo=root/'data/msst-mega'
        checkpoint=repo/'mvsep_mega_model_bs_roformer_53_stems_v1.ckpt'
        if hashlib.sha256(checkpoint.read_bytes()).hexdigest()!='c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f':raise ValueError('Mega separator checkpoint checksum mismatch.')
        config=yaml.safe_load((repo/'mvsep_mega_model_bs_roformer_53_stems.yaml').read_text(encoding='utf-8').replace('!!python/tuple',''))
        for key in ['freqs_per_bands','multi_stft_resolutions_window_sizes']:config['model'][key]=tuple(config['model'][key])
        model=BSRoformer(**config['model'])
        state=torch.load(checkpoint,map_location='cpu',weights_only=True)
        if 'state_dict' in state:state=state['state_dict']
        model.load_state_dict(state,strict=True);del state;gc.collect()
        model.eval().to(device)
        target={'keyboard-extract':'keys','electric-piano-extract':'digital-piano','trumpet-extract':'trumpet'}[kind]
        stem_id=config['training']['instruments'].index(target)
        total=np.zeros((2,len(audio)),np.float32);weights=np.zeros(len(audio),np.float32)
        with torch.inference_mode():
            for start in range(0,len(audio),44100*3):
                chunk=tensor[:,start:start+44100*4];length=chunk.shape[-1]
                if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
                with torch.autocast(device_type=device,dtype=torch.float16,enabled=device=='cuda'):
                    output=model(chunk[None].to(device),active_stem_ids=[stem_id])[0,0,:,:length].float().cpu().numpy()
                weight=np.maximum(np.hanning(length),.001).astype(np.float32)
                total[:,start:start+length]+=output*weight;weights[start:start+length]+=weight
        result=torch.from_numpy(total/weights)
    elif kind=='sax-extract':
        from demucs.states import load_model
        from demucs.apply import apply_model
        checkpoint=root/'data/sax-demucs/filosax_demucs_v3_14.22_SDR.th'
        if hashlib.sha256(checkpoint.read_bytes()).hexdigest()!='4a801bc00f0e21d476edef1d9fa25dbcb088e3bae0a4092e590167ae26dbe360':raise ValueError('Sax checkpoint checksum mismatch.')
        model=load_model(checkpoint,strict=True).eval().to(device)
        mean=tensor.mean();std=tensor.mean(0).std().clamp_min(1e-6)
        with torch.inference_mode():
            result=apply_model(model,((tensor-mean)/std)[None],device=device,shifts=0,split=True,overlap=.25)[0,model.sources.index('Sax')].cpu()*std+mean
    elif kind=='piano-extract':
        sys.path[:0]=[str(root/'data/banquet-packages'),str(root/'data/audiosep-packages'),str(root/'data/query-bandit')]
        import yaml
        import hear21passt.base as passt_base
        from core.models.e2e.bandit.bandit import PasstFiLMConditionedBandit
        from core.types import SimpleishNamespace,OperationMode
        checkpoint=root/'data/query-bandit/checkpoints/ev-pre-aug.ckpt'
        if hashlib.md5(checkpoint.read_bytes()).hexdigest()!='4dfb91d6d27c2dfd4992a15070915541':raise ValueError('Banquet checkpoint checksum mismatch.')
        original=passt_base.get_model_passt
        def no_download(*args,**kwargs):
            kwargs['pretrained']=False
            return original(*args,**kwargs)
        passt_base.get_model_passt=no_download
        try:model=PasstFiLMConditionedBandit(**yaml.safe_load((root/'data/query-bandit/config/models/bandit-query.yml').read_text(encoding='utf-8'))['kwargs'])
        finally:passt_base.get_model_passt=original
        state=torch.load(checkpoint,map_location='cpu',weights_only=False)['state_dict']
        model.load_state_dict({k.removeprefix('model.'):v for k,v in state.items() if k.startswith('model.')},strict=True)
        del state
        model=model.eval().to(device)
        query,rate=sf.read(root/'data/separator-references/piano.wav',dtype='float32',always_2d=True)
        if rate!=44100 or len(query)!=441000:raise ValueError('Restore the 10-second 44.1k piano query.')
        query=torch.from_numpy(query.T.copy())[None].to(device)
        # Bound GPU memory; overlap-add short windows, retaining tails.
        total=np.zeros((2,len(audio)),np.float32);weights=np.zeros(len(audio),np.float32)
        window=44100*8;hop=44100*6
        with torch.inference_mode():
            for start in range(0,len(audio),hop):
                chunk=tensor[:,start:start+window];length=chunk.shape[-1]
                if length<2048:chunk=torch.nn.functional.pad(chunk,(0,2048-length))
                batch=SimpleishNamespace(mixture={'audio':chunk[None].to(device)},query={'audio':query},estimates={})
                output=model(batch,mode=OperationMode.PREDICT).estimates.target.audio[0,:,:length].cpu().numpy()
                weight=np.maximum(np.hanning(length),.001).astype(np.float32)
                total[:,start:start+length]+=output*weight;weights[start:start+length]+=weight
        result=torch.from_numpy(total/weights)
    else:raise ValueError('Choose sax or Banquet piano extraction.')
    samples=resample_poly(result.numpy().mean(0),80,147).astype(np.float32)
    samples=np.pad(samples[:len(source)],(0,max(0,len(source)-len(samples))))
    if not np.isfinite(samples).all():raise ValueError('Extractor returned invalid audio.')
    del model,result;gc.collect()
    if device=='cuda':torch.cuda.empty_cache()
    return samples

def separate_parts(source,root,out,kind):
    samples=extract(source,root,kind)
    label={'sax-extract':'sax-extracted','piano-extract':'piano-banquet','keyboard-extract':'keyboard-extracted','electric-piano-extract':'electric-piano-extracted','trumpet-extract':'trumpet-extracted'}[kind]
    parts=[]
    for name,data in [(label,samples),('other',source-samples)]:
        path=out/(name+'.wav');sf.write(path,data,24000,subtype='FLOAT')
        parts.append(dict(name=name,path=str(path),gain=1,muted=False))
    return parts
