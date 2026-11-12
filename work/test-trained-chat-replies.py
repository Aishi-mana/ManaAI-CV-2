"""Generate actual GPT-SoVITS replies, then audition the approved CPU converter."""
from pathlib import Path
import sys,os,json,time,subprocess,urllib.request,io
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
from trained_voice import TrainedVoice
import soundfile as sf
import numpy as np

out=root/'exports/singing/mana-trained-chat-check'
out.mkdir(parents=True,exist_ok=True)
repo=Path('C:/AI/GPT-SoVITS')
weights=repo/'GPT_SoVITS/pretrained_models'
config=out/'tts-config.json'
config.write_text(json.dumps({'custom':dict(device='cpu',is_half=False,version='v2',
    bert_base_path=str(weights/'chinese-roberta-wwm-ext-large'),
    cnhuhbert_base_path=str(weights/'chinese-hubert-base'),
    t2s_weights_path=str(weights/'gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt'),
    vits_weights_path=str(weights/'gsv-v2final-pretrained/s2G2333k.pth'))}),encoding='utf-8')
env=os.environ.copy()
env.pop('PYTHONPATH',None)
env.update(PYTHONIOENCODING='utf-8',PYTHONUTF8='1',HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',
           OMP_NUM_THREADS='4',MKL_NUM_THREADS='4',TEMP=str(root/'work'),TMP=str(root/'work'))
log=(out/'tts-server.log').open('w',encoding='utf-8')
server=subprocess.Popen(['C:/Users/Admin/miniconda3/envs/GPTSoVits/python.exe',str(repo/'api_v2.py'),
                         '-a','127.0.0.1','-p','9884','-c',str(config)],cwd=repo,env=env,
                         stdout=log,stderr=subprocess.STDOUT,
                         creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
rows=[]
def save(name,a,sr):
    a=np.asarray(a,dtype=np.float32)
    assert np.isfinite(a).all()
    rms=float(np.sqrt(np.mean(a*a)))
    assert rms>.001
    a*=min(.1/rms,.95/max(float(np.max(np.abs(a))),1e-6))
    path=out/name
    sf.write(path,a,sr,subtype='PCM_16')
    return str(path)
try:
    started=time.monotonic()
    while True:
        if server.poll() is not None: raise RuntimeError('Chat voice service failed; see tts-server.log')
        try:
            with urllib.request.urlopen('http://127.0.0.1:9884/openapi.json',timeout=2) as response:
                assert '/tts' in json.load(response)['paths']
            break
        except (OSError,ValueError):
            if time.monotonic()-started>150: raise TimeoutError('Chat voice startup exceeded 150 seconds')
            time.sleep(1)
    print('CHAT_SERVICE_READY',flush=True)
    init=time.monotonic()
    converter=TrainedVoice(root)
    initialization=time.monotonic()-init
    references=json.loads((root/'data/custom-voice/references/mana-v2/manifest.json').read_text(encoding='utf-8'))
    for style,text in [('default',"Hey, Eye-shee. I’m glad you’re here. Shall we take a little break together?"),
                       ('cheerful',"We did it! That turned out beautifully. I can’t wait to show you what happens next.")]:
        ref=next(r for r in references if r['style']==style)
        payload=dict(text=text,text_lang='en',ref_audio_path=ref['file'],prompt_text=ref['text'],prompt_lang='en',
                     media_type='wav',streaming_mode=False,speed_factor=1,text_split_method='cut5',batch_size=1,seed=42)
        start=time.monotonic()
        request=urllib.request.Request('http://127.0.0.1:9884/tts',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=180) as response: data=response.read()
        generated=time.monotonic()-start
        audio,sr=sf.read(io.BytesIO(data))
        original=save(style+' - current chat.wav',audio,sr)
        start=time.monotonic()
        converted,rate=converter.convert(audio,sr)
        elapsed=time.monotonic()-start
        trained=save(style+' - trained chat.wav',converted,rate)
        rows.append(dict(style=style,text=text,seconds=len(audio)/sr,currentChat=original,trainedChat=trained,
                         baseGenerationSeconds=generated,conversionSeconds=elapsed))
        (out/'comparison.json').write_text(json.dumps(dict(replies=rows,converterInitializationSeconds=initialization,
                         activeVoiceChanged=False,voiceProfile=converter.profile),indent=2),encoding='utf-8')
        print(style,rows[-1]['baseGenerationSeconds'],elapsed,flush=True)
finally:
    server.terminate()
    try: server.wait(timeout=15)
    except subprocess.TimeoutExpired: server.kill();server.wait()
    log.close()
