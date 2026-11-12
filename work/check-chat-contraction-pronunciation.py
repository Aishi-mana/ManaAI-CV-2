"""Trace the failing word through the installed phonemizer and test normalized input."""
from pathlib import Path
import sys,os,json,time
root=Path(__file__).resolve().parents[1]
repo=Path('C:/AI/GPT-SoVITS')
os.chdir(repo)
sys.path.insert(0,str(repo))
sys.path.insert(0,str(repo/'GPT_SoVITS'))
os.environ['version']='v2'
import torch
torch.set_num_threads(4)
from text.cleaner import clean_text
import soundfile as sf
out=root/'exports/singing/mana-chat-contraction-check'
out.mkdir(parents=True,exist_ok=True)
traces=[]
for phrase in ['I’m glad you’re here.', "I'm glad you're here.", 'I am glad you are here.']:
    phones,_,normalized=clean_text(phrase,'en','v2')
    traces.append(dict(input=phrase,normalized=normalized,phones=phones))
(out/'phoneme-trace.json').write_text(json.dumps(traces,indent=2),encoding='utf-8')
print(json.dumps(traces,ensure_ascii=False),flush=True)
assert traces[0]['normalized']!=traces[1]['normalized']
assert traces[0]['phones']!=traces[1]['phones']
from GPT_SoVITS.TTS_infer_pack.TTS import TTS,TTS_Config
tts=TTS(TTS_Config(str(root/'exports/singing/mana-trained-chat-check/tts-config.json')))
refs=json.loads((root/'data/custom-voice/references/mana-v2/manifest.json').read_text(encoding='utf-8'))
ref=next(r for r in refs if r['style']=='default')
text="Hey, Eye-shee. I'm glad you're here. Shall we take a little break together?"
payload=dict(text=text,text_lang='en',ref_audio_path=ref['file'],prompt_text=ref['text'],prompt_lang='en',
             media_type='wav',streaming_mode=False,speed_factor=1,text_split_method='cut5',batch_size=1,seed=42)
start=time.monotonic()
chunks=list(tts.run(payload))
assert len(chunks)==1
sr,audio=chunks[0]
target=out/'normalized - raw chat.wav'
sf.write(target,audio,sr,subtype='PCM_16')
(out/'generation.json').write_text(json.dumps(dict(text=text,source=str(target),seconds=len(audio)/sr,
    baseGenerationSeconds=time.monotonic()-start,seed=42,changedOnly='Curly apostrophes normalized to ASCII before TTS'),indent=2),encoding='utf-8')
print('NORMALIZED_REPLY_READY',flush=True)
