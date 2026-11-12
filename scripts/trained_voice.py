"""Pinned, approved Mana converter. CPU inference; no effects or model downloads."""
from pathlib import Path
import hashlib, json, os, sys

MODEL_RELATIVE = 'data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth'

PROFILES = {
    'mana-trained-v1': (MODEL_RELATIVE, 'mana-current-rvc-trial-v1', 'Mana', 'mana-trained-rvc-v1'),
    'mousey-trained-v2': ('data/applio-training/engine/logs/mousey-v2-trial-v1/mousey-v2-trial-v1_50e_8300s.pth', 'mousey-v2-rvc-trial-v1', 'Mousey', 'mousey-trained-rvc-v2'),
}

def trained_voice_profile(root, profile_id='mana-trained-v1'):
    root=Path(root).resolve()
    if profile_id not in PROFILES:
        raise ValueError('This trained voice profile is not installed.')
    relative,dataset,name,engine=PROFILES[profile_id]
    approved=json.loads((root/f'data/custom-voice/{dataset}/approved-candidate.json').read_text(encoding='utf-8'))
    model=root/relative
    digest=hashlib.sha256(model.read_bytes()).hexdigest()
    if approved.get('epoch')!=50 or approved.get('modelSha256')!=digest:
        raise ValueError(f'The approved {name} voice model changed. Restore the approved 50-pass model.')
    return dict(engine=engine,profileId=profile_id,model=str(model),modelSha256=digest,
                epoch=50,pitchShiftSemitones=0,autoPitchAdjust=False,pitchSmoothing=False,
                indexRate=0,device='cpu')

class TrainedVoice:
    def __init__(self, root, profile_id='mana-trained-v1'):
        self.root=Path(root).resolve()
        self.profile=trained_voice_profile(self.root,profile_id)
        engine=self.root/'data/applio-training/engine'
        overlay=self.root/'data/applio-training/offline-overlay'
        if not (engine/'rvc/infer/pipeline.py').is_file() or not overlay.is_dir():
            raise ValueError('Mana trained voice setup is missing. Restore the local training engine.')
        os.environ['HF_HUB_OFFLINE']='1'
        os.environ['TRANSFORMERS_OFFLINE']='1'
        os.environ['NUMBA_CACHE_DIR']=str(self.root/'data/applio-training/numba-cache')
        sys.path.insert(0,str(overlay))
        sys.path.insert(0,str(engine))
        # Applio resolves installed weights relative to its engine directory.
        os.chdir(engine)
        import torch
        from rvc.lib.utils import load_embedding
        from rvc.lib.algorithm.synthesizers import Synthesizer
        from rvc.infer.pipeline import Pipeline
        from types import SimpleNamespace
        torch.set_num_threads(4)
        torch.manual_seed(42)
        checkpoint=torch.load(self.profile['model'],map_location='cpu',weights_only=True)
        # Match Applio's CPU chunking defaults without probing the chat GPU.
        settings=SimpleNamespace(device='cpu',x_pad=1,x_query=6,x_center=38,x_max=41)
        checkpoint['config'][-3]=checkpoint['weight']['emb_g.weight'].shape[0]
        self.sample_rate=int(checkpoint['config'][-1])
        self.net=Synthesizer(*checkpoint['config'],use_f0=checkpoint.get('f0',1),
                             text_enc_hidden_dim=768,vocoder=checkpoint.get('vocoder','HiFi-GAN'))
        del self.net.enc_q
        loaded=self.net.load_state_dict(checkpoint['weight'],strict=False)
        if loaded.unexpected_keys or loaded.missing_keys:
            raise ValueError('The trained Mana model does not match the installed converter.')
        self.net=self.net.float().eval()
        self.hubert=load_embedding('contentvec').float().eval()
        self.pipeline=Pipeline(self.sample_rate,settings)

    def convert(self, samples, sample_rate):
        import numpy as np
        import librosa
        import torch
        audio=np.asarray(samples,dtype=np.float32)
        if audio.ndim==2:
            audio=audio.mean(axis=1)
        if audio.ndim!=1 or not len(audio) or not np.isfinite(audio).all():
            raise ValueError('Use finite mono or stereo audio for Mana voice conversion.')
        source_rms=float(np.sqrt(np.mean(audio**2)))
        if source_rms<1e-6:
            return np.zeros(round(len(audio)*self.sample_rate/sample_rate),dtype=np.float32),self.sample_rate
        guide=librosa.resample(audio,orig_sr=sample_rate,target_sr=16000)
        with torch.inference_mode():
            converted=self.pipeline.pipeline(self.hubert,self.net,0,guide,0,'rmvpe','',0,
                                              True,1,'v2',.33,False,0,False,155)
        converted=np.asarray(converted,dtype=np.float32)
        expected=round(len(audio)*self.sample_rate/sample_rate)
        if not np.isfinite(converted).all() or abs(len(converted)-expected)>self.sample_rate*.1:
            raise RuntimeError('Mana voice conversion returned invalid audio or timing.')
        converted=np.pad(converted,(0,max(0,expected-len(converted))))[:expected]
        output_rms=float(np.sqrt(np.mean(converted**2)))
        if output_rms<1e-6:
            raise RuntimeError('Mana voice conversion returned silent audio.')
        gain=min(source_rms/output_rms,.98/max(float(np.max(np.abs(converted))),1e-6))
        return converted*gain,self.sample_rate
