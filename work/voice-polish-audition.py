from pathlib import Path
import json
import os
import sys

root = Path(__file__).resolve().parents[1]
out = root / 'exports/voice-polish'
out.mkdir(parents=True, exist_ok=True)
line = "Hey, Eye-shee. I'm glad you're here. Take a breath. We'll pick up where we left off."
styles = ('default', 'cheerful', 'gentle')

import numpy as np
import soundfile as sf

def save(name, audio, rate):
    assert np.isfinite(audio).all() and np.max(np.abs(audio)) > .005 and len(audio) > rate
    sf.write(out / (name + '.wav'), audio, rate, subtype='PCM_16')
    print(name, round(len(audio) / rate, 2), 'seconds', flush=True)

if sys.argv[1] == 'guide':
    repo = Path('C:/AI/GPT-SoVITS')
    os.chdir(repo)
    sys.path[:0] = [str(repo), str(repo / 'GPT_SoVITS')]
    os.environ['version'] = 'v2'
    import torch
    torch.set_num_threads(4)
    from GPT_SoVITS.TTS_infer_pack.TTS import TTS, TTS_Config
    tts = TTS(TTS_Config(str(root / 'exports/singing/mana-trained-chat-check/tts-config.json')))
    refs = json.loads((root / 'data/custom-voice/references/mana-v2/manifest.json').read_text(encoding='utf-8'))
    for style in styles:
        ref = next(r for r in refs if r['style'] == style)
        (rate, audio), = tts.run(dict(text=line, text_lang='en', ref_audio_path=ref['file'],
            prompt_text=ref['text'], prompt_lang='en', media_type='wav', streaming_mode=False,
            speed_factor=1, text_split_method='cut5', batch_size=1, seed=42))
        save('Guide - ' + style, audio.astype(np.float32) / 32768 if audio.dtype == np.int16 else audio, rate)
else:
    sys.path.insert(0, str(root / 'scripts'))
    from trained_voice import TrainedVoice
    for profile, label in [('mana-trained-v1', 'Mana'), ('mousey-trained-v2', 'Mousey')]:
        converter = TrainedVoice(root, profile)
        for style in styles:
            audio, rate = sf.read(out / ('Guide - ' + style + '.wav'), dtype='float32')
            converted, sample_rate = converter.convert(audio, rate)
            assert abs(len(converted) / sample_rate - len(audio) / rate) < .001
            save(label + ' - ' + style, converted, sample_rate)
