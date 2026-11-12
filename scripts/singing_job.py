"""Owned cover job: separate a supplied mix, then CPU pitch-conditioned Seed-VC conversion.
No input files are modified. Models are cached under the project data directory.
"""
import json, os, sys, traceback
from pathlib import Path
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


def conversion_profile(p):
    if p.get('trained_voice',False):
        from trained_voice import trained_voice_profile
        return trained_voice_profile(p.get('data_root',Path(__file__).resolve().parents[1]),p.get('voice_profile') or 'mana-trained-v1')
    import hashlib
    reference=Path(p['reference']).resolve()
    seed=p.get('seed',42)
    if isinstance(seed,bool) or not isinstance(seed,int) or not 0<=seed<=4294967295:
        raise ValueError('Conversion seed must be an integer from 0 to 4294967295.')
    steps=p.get('diffusion_steps',30)
    if isinstance(steps,bool) or not isinstance(steps,int) or not 10<=steps<=100:
        raise ValueError('Diffusion steps must be between 10 and 100.')
    guidance=p.get('guidance',.7)
    import math
    if isinstance(guidance,bool) or not isinstance(guidance,(int,float)) or not math.isfinite(guidance) or not 0<=guidance<=1:
        raise ValueError('Conversion guidance must be between 0 and 1.')
    digest=hashlib.sha256()
    with reference.open('rb') as file:
        for block in iter(lambda:file.read(1024*1024),b''):digest.update(block)
    return {'engine':'seed-vc-f0','reference':str(reference),'referenceSha256':digest.hexdigest(),
            'seed':seed,'diffusionSteps':steps,'guidance':float(guidance),
            'pitchSmoothing':bool(p.get('pitch_smoothing',False)),
            'pitchShiftSemitones':p.get('semi_tone_shift',0),'autoPitchAdjust':False}

def run(p):
    genre=p.get('genre','original')
    if genre not in ('original','rock','jazz','pop','country','piano-trio','guitar-electric'):
        raise ValueError('Choose a supported backing style.')
    if genre in ('rock','jazz','pop','country'):
        from source_band import checked_lead
        checked_lead(genre,p.get('genre_lead'))
    if genre!='original' and (not p.get('separate') or p.get('harmony_key') is not None):
        raise ValueError('Genre remix requires separated instruments and a lead vocal cover.')
    if p.get('harmony_key') is not None:
        from vocal_harmony import run_harmony
        return run_harmony(p)
    profile=conversion_profile(p)
    pitch_shift = p.get('semi_tone_shift', 0)
    if isinstance(pitch_shift, bool) or not isinstance(pitch_shift, int) or not -12 <= pitch_shift <= 12:
        raise ValueError('Pitch shift must be a whole number between -12 and 12 semitones.')
    root = Path(p.get('data_root', Path(__file__).resolve().parents[1])).resolve()
    out = Path(p['output']).resolve()
    out.mkdir(parents=True, exist_ok=True)
    os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')
    os.environ['CUDA_VISIBLE_DEVICES'] = ''
    os.environ['TORCH_HOME'] = str(root / 'data/music-cache/torch')
    os.environ['HF_HOME'] = str(root / 'data/music-cache/huggingface')
    os.environ['HF_HUB_CACHE'] = str(root / 'data/seed-vc/checkpoints/hf_cache')
    import numpy as np
    import torch
    import librosa
    import soundfile as sf
    torch.set_num_threads(max(1, min(8, os.cpu_count() or 4)))
    whole_song = bool(p.get('whole_song', False))
    print('Reading whole song…' if whole_song else 'Reading guide segment…', flush=True)
    audio, sr = librosa.load(p['source'], sr=44100, mono=False,
                             offset=0 if whole_song else float(p['start']),
                             duration=None if whole_song else float(p['seconds']))
    if audio.ndim == 1:
        audio = np.stack([audio, audio])
    if audio.shape[-1] < sr:
        raise ValueError('The selected guide segment is shorter than one second.')
    if genre in ('rock','jazz','pop','country') and not 8*sr<=audio.shape[-1]<=360*sr:
        raise ValueError('Band arrangements need an 8-second to 6-minute source.')
    if genre in ('piano-trio','guitar-electric') and audio.shape[-1]>60*sr:
        raise ValueError('Source-note piano and electric guitar support up to 60 seconds. Choose a shorter excerpt.')
    backing = None
    if p['separate'] and p.get('extractor')=='mega-lead':
        import subprocess
        separator_input=out/'source-segment.wav'
        sf.write(separator_input,audio.T,sr,subtype='FLOAT')
        env=os.environ.copy()
        env.pop('CUDA_VISIBLE_DEVICES',None)
        separator=Path(__file__).with_name('cover_lead.py')
        subprocess.run([sys.executable,str(separator)],input=json.dumps(dict(root=str(root),
            source=str(separator_input),output=str(out))),text=True,env=env,check=True,
            creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        vocal,_=sf.read(out/'lead-extracted.wav',always_2d=True,dtype='float32')
        backing,_=sf.read(out/'backing-extracted.wav',always_2d=True,dtype='float32')
        vocal=vocal.T;backing=backing.T
        # Keep PCM files unclipped while retaining the lead/backing balance.
        peak=max(float(np.max(np.abs(vocal))),float(np.max(np.abs(backing))))
        if peak>.98:
            vocal*=.98/peak;backing*=.98/peak
    elif p['separate']:
        print('Separating vocals on CPU (first run downloads Demucs weights)…', flush=True)
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        model = get_model('htdemucs').cpu().eval()
        source = torch.from_numpy(audio).float()
        # Same centering/scaling used by Demucs CLI.
        ref = source.mean(0)
        mean, std = ref.mean(), ref.std().clamp(min=1e-6)
        with torch.no_grad():
            stems = apply_model(model, ((source - mean) / std)[None], device='cpu',
                                shifts=0, split=True, overlap=0.25, progress=True)[0]
        stems = stems * std + mean
        index = model.sources.index('vocals')
        vocal = stems[index].numpy().copy()
        backing = sum(stems[i] for i in range(len(model.sources)) if i != index).numpy()
        del model, stems, source, ref
        import gc
        gc.collect()
    else:
        vocal = audio
    if float(np.sqrt(np.mean(vocal ** 2))) < 0.0015:
        raise ValueError('No audible guide vocal in this segment. Choose a section with singing or a dry vocal recording.')
    guide = out / 'guide-vocals.wav'
    sf.write(guide, vocal.T, sr, subtype='PCM_16')
    if backing is not None:
        sf.write(out / 'instrumental.wav', backing.T, sr, subtype='PCM_16')
    genre_profile=None
    if genre!='original':
        from cover_genre import restyle_backing
        backing,genre_profile=restyle_backing(backing,sr,genre,out,root,percussion=p.get('percussion',False),lead=p.get('genre_lead'),source=p.get('band_source') or 'guitar',vocal=vocal.mean(0),follow_bass=p.get('follow_bass',False))
        sf.write(out/'instrumental.wav',backing.T,sr,subtype='PCM_16')
    pitch_extractor = None
    traces = []
    steps = None
    if p.get('trained_voice',False):
        print('Converting guide vocal with the selected trained voice…',flush=True)
        from trained_voice import TrainedVoice
        converter=TrainedVoice(root,p.get('voice_profile') or 'mana-trained-v1')
        converted, converted_sr=converter.convert(vocal.T,sr)
        target=out/'vc_mana-trained-v1.wav'
        sf.write(target,converted,converted_sr,subtype='PCM_16')
        generated=[target]
    else:
        print('Converting guide vocal; pitch and timing conditioning enabled…', flush=True)
        repo = Path(p['repo']).resolve()
        os.chdir(repo)
        sys.path.insert(0, str(repo))
        import argparse
        import inference
        original_load_models = inference.load_models
        pitch_extractor = None
        traces = []
        if p.get('pitch_smoothing', False):
            from singing_pitch import smooth_pitch, pitch_stats
            def load_with_smoothing(args):
                nonlocal pitch_extractor
                loaded = list(original_load_models(args))
                pitch_extractor = loaded[2]
                def conditioned(audio, **kwargs):
                    raw = pitch_extractor(audio, **kwargs)
                    # Seed-VC requests reference F0 first, guide F0 second.
                    softened = raw if not traces else smooth_pitch(raw)
                    traces.append({'role':'reference' if not traces else 'guide',
                                   'raw':pitch_stats(raw),'conditioned':pitch_stats(softened)})
                    return softened
                loaded[2] = conditioned
                return tuple(loaded)
            inference.load_models = load_with_smoothing
        # Normalize before PCM encoding; the upstream save can clip loud vocoder output.
        import torchaudio
        original_save = torchaudio.save
        def save_converted(path, waveform, sample_rate, **kwargs):
            samples = waveform.detach().cpu().numpy().T
            peak = float(np.max(np.abs(samples)))
            if peak > 0.98:
                samples = samples * (0.98 / peak)
            sf.write(path, samples, sample_rate, subtype='PCM_16')
        torchaudio.save = save_converted
        try:
            steps = int(p.get('diffusion_steps', 30))
            if not 10 <= steps <= 100:
                raise ValueError('Diffusion steps must be between 10 and 100.')
            guidance = float(p.get('guidance', 0.7))
            if not np.isfinite(guidance) or not 0 <= guidance <= 1:
                raise ValueError('Conversion guidance must be between 0 and 1.')
            import random
            seed=profile['seed']
            random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
            inference.main(argparse.Namespace(source=str(guide), target=p['reference'], output=str(out),
                diffusion_steps=steps, length_adjust=1.0, inference_cfg_rate=guidance, f0_condition=True,
                auto_f0_adjust=False, semi_tone_shift=pitch_shift, checkpoint=None, config=None, fp16=False))
        finally:
            torchaudio.save = original_save
            inference.load_models = original_load_models
        generated = list(out.glob('vc_*.wav'))
        if len(generated) != 1:
            raise RuntimeError('Conversion did not return exactly one WAV.')
    if whole_song:
        complete, complete_sr = sf.read(generated[0], always_2d=True)
        expected = round(vocal.shape[-1] * complete_sr / sr)
        if abs(len(complete)-expected)>complete_sr:
            raise RuntimeError('Converted vocal length differs from the full guide by over one second.')
        complete = np.pad(complete,((0,max(0,expected-len(complete))),(0,0)))[:expected]
        sf.write(generated[0],complete,complete_sr,subtype='PCM_16')
    result = {'vocal': str(generated[0]), 'mix': '', 'seconds':vocal.shape[-1]/sr,'wholeSong':whole_song,
              'extractor':p.get('extractor','demucs') if p['separate'] else 'dry',
              'diffusionSteps':steps,'pitchSmoothing':profile['pitchSmoothing'],'voiceProfile':profile,'genreProfile':genre_profile}
    if pitch_extractor is not None:
        from singing_pitch import pitch_stats
        for label,path in [('baseline',p.get('baseline_vocal')),('candidate',str(generated[0]))]:
            if path:
                samples,_ = librosa.load(path,sr=16000,mono=True)
                traces.append({'role':label,'pitch':pitch_stats(pitch_extractor(torch.from_numpy(samples).to(inference.device),thred=0.03))})
        (out/'pitch-comparison.json').write_text(json.dumps(traces,indent=2),encoding='utf-8')
    if backing is not None:
        converted, converted_sr = sf.read(generated[0], always_2d=True)
        if converted_sr != sr:
            converted = librosa.resample(converted.T, orig_sr=converted_sr, target_sr=sr).T
        if converted.shape[1] == 1:
            converted = np.repeat(converted, 2, axis=1)
        length = min(len(converted), backing.shape[1])
        # Match the guide's vocal level before adding its original backing.
        vocal_rms = float(np.sqrt(np.mean(vocal[:, :length] ** 2)))
        converted_rms = float(np.sqrt(np.mean(converted[:length] ** 2)))
        if converted_rms > 1e-6:
            converted *= vocal_rms / converted_rms
        gain = float(p.get('backing_gain', 1.0))
        if not np.isfinite(gain) or not 0 <= gain <= 1:
            raise ValueError('Backing volume must be between 0 and 1.')
        if genre in ('rock','jazz','pop','country','piano-trio'):
            from piano_arrangement import balance
            mixed=balance(converted[:length,:2],backing[:,:length].T,gain)
        else:
            mixed = converted[:length, :2] + backing[:, :length].T * gain
        peak = np.max(np.abs(mixed))
        if peak > 0.98:
            mixed *= 0.98 / peak
        mix = out / 'Mana-guide-mix.wav'
        sf.write(mix, mixed, sr, subtype='PCM_16')
        result['mix'] = str(mix)
        if genre in ('rock','jazz','pop','country'):
            from band_mix import prepare
            result['bandMixParts']=prepare(converted[:length,:2],backing[:,:length].T,sr,out/'genre-remix',out,gain)
    return result


if __name__ == '__main__':
    p = json.load(sys.stdin)
    try:
        result = {'done': True, **run(p), 'error': ''}
    except Exception as e:
        traceback.print_exc()
        result = {'done': True, 'error': str(e)}
    Path(p['result']).write_text(json.dumps(result), encoding='utf-8')
