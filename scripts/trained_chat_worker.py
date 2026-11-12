"""Owned stdin worker: reuse the approved CPU converter across chat replies."""
from pathlib import Path
import base64,io,json,os,sys,time,traceback,urllib.request

def process(request, converter):
    import soundfile as sf
    import numpy as np
    port=request['port']
    if isinstance(port,bool) or not isinstance(port,int) or not 1024<=port<=65535:
        raise ValueError('Invalid local voice port.')
    body=dict(text=request['text'],text_lang=request['replyLanguage'],ref_audio_path=request['reference'],
              prompt_text=request['prompt'],prompt_lang=request['referenceLanguage'],media_type='wav',
              streaming_mode=False,speed_factor=request['speed'],text_split_method='cut5',batch_size=1,seed=42)
    start=time.monotonic()
    http=urllib.request.Request(f'http://127.0.0.1:{port}/tts',data=json.dumps(body).encode('utf-8'),
                                headers={'Content-Type':'application/json; charset=utf-8'})
    # Keep this request on loopback even when Windows has a system proxy set.
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(http,timeout=180) as response:
        raw=response.read(12000001)
    if len(raw)>12000000:
        raise ValueError('Audio exceeds 12 MB.')
    audio,rate=sf.read(io.BytesIO(raw),always_2d=True,dtype='float32')
    generated=time.monotonic()-start
    start=time.monotonic()
    converted,rate=converter.convert(audio,rate)
    buffer=io.BytesIO()
    sf.write(buffer,converted,rate,format='WAV',subtype='PCM_16')
    data=buffer.getvalue()
    if len(data)>12000000:
        raise ValueError('Converted audio exceeds 12 MB.')
    return dict(audio=base64.b64encode(data).decode('ascii'),error='',
                voice=converter.profile['profileId'],generationSeconds=generated,conversionSeconds=time.monotonic()-start)

def main():
    root=Path(sys.argv[1]).resolve()
    output_dir=Path(sys.argv[2]).resolve()
    output_dir.mkdir(parents=True,exist_ok=True)
    os.environ['HF_HUB_OFFLINE']='1'
    os.environ['TRANSFORMERS_OFFLINE']='1'
    from trained_voice import TrainedVoice
    converter=None
    for line in sys.stdin:
        request=json.loads(line)
        result=Path(request['result']).resolve()
        if result.parent!=output_dir or not result.name.startswith('trained-voice-') or result.suffix!='.json':
            raise ValueError('Invalid owned voice result path.')
        try:
            profile_id=request.get('voiceProfile','mana-trained-v1')
            if converter is None or converter.profile['profileId']!=profile_id:
                converter=None
                start=time.monotonic()
                converter=TrainedVoice(root,profile_id)
                print(f'{profile_id} converter loaded in {time.monotonic()-start:.2f}s',flush=True)
            response=process(request,converter)
        except Exception:
            traceback.print_exc()
            response=dict(audio='',error='Trained voice could not finish. Retry, or turn off Use trained Mana voice in Voice setup.')
        temporary=result.with_suffix('.tmp')
        temporary.write_text(json.dumps(response),encoding='utf-8')
        os.replace(temporary,result)

if __name__=='__main__':
    if hasattr(sys.stdout,'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    main()
