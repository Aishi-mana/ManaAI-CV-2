"""Exercise real persistent conversion and loopback transport using cached TTS WAVs."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler,HTTPServer
import threading,subprocess,os,json,time,base64,io,sys
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/trained-chat-worker-smoke'
out.mkdir(parents=True,exist_ok=True)
samples=[root/'exports/singing/mana-chat-contraction-check/normalized - raw chat.wav',
         root/'exports/singing/mana-trained-chat-check/cheerful - raw chat.wav']
requests=[]
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        requests.append(body)
        data=samples[len(requests)-1].read_bytes()
        self.send_response(200);self.send_header('Content-Type','audio/wav');self.end_headers();self.wfile.write(data)
    def log_message(self,*args): pass
server=HTTPServer(('127.0.0.1',0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
env=os.environ.copy()
env.update(PYTHONUNBUFFERED='1',PYTHONIOENCODING='utf-8',HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',
           TEMP=str(root/'work'),TMP=str(root/'work'))
log=(out/'worker.log').open('w',encoding='utf-8')
worker=subprocess.Popen([str(root/'data/music-tools/Scripts/python.exe'),str(root/'scripts/trained_chat_worker.py'),str(root),str(out)],
                        stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT,env=env,
                        creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
rows=[]
try:
    for i,text in enumerate(["Hey, Eye-shee. I'm glad you're here. Shall we take a little break together?",'We did it!']):
        result=out/f'trained-voice-smoke-{i}.json'
        result.unlink(missing_ok=True)
        payload=dict(port=server.server_port,text=text,reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),
                     prompt="I'm here.",replyLanguage='en',referenceLanguage='en',speed=1,result=str(result))
        start=time.monotonic()
        worker.stdin.write((json.dumps(payload)+'\n').encode());worker.stdin.flush()
        while not result.is_file():
            assert worker.poll() is None, 'Worker stopped'
            if time.monotonic()-start>90: raise TimeoutError('Worker exceeded 90 seconds')
            time.sleep(.1)
        response=json.loads(result.read_text(encoding='utf-8'))
        assert not response['error'],response['error']
        audio,sr=sf.read(io.BytesIO(base64.b64decode(response['audio'])))
        assert sr==40000 and np.isfinite(audio).all() and np.max(np.abs(audio))<=.981
        target=out/f'converted-{i}.wav';sf.write(target,audio,sr,subtype='PCM_16')
        rows.append(dict(request=i,pid=worker.pid,elapsed=time.monotonic()-start,seconds=len(audio)/sr,
                         conversionSeconds=response['conversionSeconds']))
    assert "I'm" in requests[0]['text'] and "I'm" in requests[0]['prompt_text']
    assert worker.poll() is None
finally:
    worker.terminate();worker.wait(timeout=15);log.close();server.shutdown();server.server_close()
assert (out/'worker.log').read_text(encoding='utf-8').count('Trained Mana converter loaded')==1
(out/'result.json').write_text(json.dumps(dict(replies=rows,modelLoads=1,workerStopped=True),indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))
