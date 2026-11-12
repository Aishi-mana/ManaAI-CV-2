from pathlib import Path
import os,sys,json
root=Path(__file__).resolve().parents[1]
repo=Path('C:/AI/GPT-SoVITS')
os.chdir(repo)
sys.path[:0]=[str(repo),str(repo/'GPT_SoVITS')]
os.environ['version']='v2'
import torch
torch.set_num_threads(4)
from GPT_SoVITS.TTS_infer_pack.TTS import TTS,TTS_Config
import soundfile as sf
out=root/'exports/singing/mousey-v2-trial-v1/epoch-10/extra-check'
out.mkdir(parents=True,exist_ok=True)
tts=TTS(TTS_Config(str(root/'exports/singing/mana-trained-chat-check/tts-config.json')))
refs=json.loads((root/'data/custom-voice/references/mana-v2/manifest.json').read_text(encoding='utf-8'))
ref=next(r for r in refs if r['style']=='default')
text="Hey, Eye-shee. I'm glad you're here. We could take a little break together, find somewhere quiet, and talk about the things that made you smile today. How does that sound?"
chunks=list(tts.run(dict(text=text,text_lang='en',ref_audio_path=ref['file'],prompt_text=ref['text'],prompt_lang='en',media_type='wav',streaming_mode=False,speed_factor=1,text_split_method='cut5',batch_size=1,seed=42)))
assert len(chunks)==1
sr,audio=chunks[0]
sf.write(out/'chat-guide.wav',audio,sr,subtype='PCM_16')
(out/'chat-text.json').write_text(json.dumps(dict(text=text,seconds=len(audio)/sr)),encoding='utf-8')
print('READY',len(audio)/sr,flush=True)
