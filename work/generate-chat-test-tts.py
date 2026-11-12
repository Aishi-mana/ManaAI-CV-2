"""Use the exact chat speech pipeline without a loopback HTTP connection."""
from pathlib import Path
import sys,os,json,time,faulthandler
faulthandler.dump_traceback_later(60,repeat=True)
root=Path(__file__).resolve().parents[1]
repo=Path('C:/AI/GPT-SoVITS')
os.chdir(repo)
sys.path.insert(0,str(repo))
sys.path.insert(0,str(repo/'GPT_SoVITS'))
import torch
torch.set_num_threads(4)
from GPT_SoVITS.TTS_infer_pack.TTS import TTS,TTS_Config
import soundfile as sf
out=root/'exports/singing/mana-trained-chat-check'
start=time.monotonic()
tts=TTS(TTS_Config(str(out/'tts-config.json')))
print('CHAT_PIPELINE_READY',flush=True)
refs=json.loads((root/'data/custom-voice/references/mana-v2/manifest.json').read_text(encoding='utf-8'))
rows=[]
for style,text in [('default',"Hey, Eye-shee. I’m glad you’re here. Shall we take a little break together?"),
                   ('cheerful',"We did it! That turned out beautifully. I can’t wait to show you what happens next.")]:
    ref=next(r for r in refs if r['style']==style)
    payload=dict(text=text,text_lang='en',ref_audio_path=ref['file'],prompt_text=ref['text'],prompt_lang='en',
                 media_type='wav',streaming_mode=False,speed_factor=1,text_split_method='cut5',batch_size=1,seed=42)
    began=time.monotonic()
    chunks=list(tts.run(payload))
    assert len(chunks)==1, len(chunks)
    sr,audio=chunks[0]
    assert len(audio)>sr
    target=out/(style+' - raw chat.wav')
    sf.write(target,audio,sr,subtype='PCM_16')
    rows.append(dict(style=style,text=text,seconds=len(audio)/sr,path=str(target),baseGenerationSeconds=time.monotonic()-began))
    (out/'fresh-replies.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
    print(style,'GENERATED',flush=True)
faulthandler.cancel_dump_traceback_later()
