"""Manual local vision smoke test; no downloads, no changes to app settings/chat."""
import base64, json, pathlib, struct, subprocess, time, urllib.request, zlib

root = pathlib.Path(__file__).resolve().parents[1]
models = pathlib.Path.home() / 'Downloads' / 'AI models'
port = 18081
try:
    urllib.request.urlopen(f'http://127.0.0.1:{port}/health', timeout=2)
except OSError:
    pass
else:
    raise RuntimeError('Smoke port already in use; leaving that server untouched.')
def chunk(kind, data):
    return struct.pack('!I', len(data))+kind+data+struct.pack('!I', zlib.crc32(kind+data)&0xffffffff)
rows = []
for y in range(256):
    row=bytearray()
    for x in range(256):
        color=(255,255,255)
        if 30<=y<210 and 20<=x<110: color=(255,0,0)
        if 30<=y<210 and 146<=x<236: color=(0,0,255)
        row.extend(color)
    rows.append(b'\0'+bytes(row))
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',256,256,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
log = root / 'vision-smoke.log'
with log.open('wb') as output:
    process=subprocess.Popen(['C:/AI/llama-cpp/llama-server.exe','-m',str(models/'Qwen3-VL-8B-Instruct-Q4_K_M.gguf'),'--mmproj',str(models/'mmproj-Qwen3-VL-8B-Instruct-F16.gguf'),'--host','127.0.0.1','--port',str(port),'-c','8192','-ngl','0','--no-mmproj-offload','--jinja'],cwd='C:/AI/llama-cpp',stdout=output,stderr=output,creationflags=subprocess.CREATE_NO_WINDOW)
    print('Starting owned CPU vision smoke server', process.pid, flush=True)
    try:
        ready=False
        for _ in range(180):
            if process.poll() is not None: raise RuntimeError('Vision server exited; inspect vision-smoke.log')
            try:
                props=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/props',timeout=2))
                ready=props.get('modalities',{}).get('vision') is True
                if ready: break
            except OSError: pass
            time.sleep(1)
        if not ready: raise RuntimeError('Vision startup timed out')
        print('Vision capability verified; analyzing synthetic color image',flush=True)
        payload={'max_tokens':96,'temperature':0,'messages':[{'role':'user','content':[{'type':'text','text':'Describe the colors and positions of the two rectangles. Be concise.'},{'type':'image_url','image_url':{'url':'data:image/png;base64,'+base64.b64encode(png).decode()}}]}]}
        request=urllib.request.Request(f'http://127.0.0.1:{port}/v1/chat/completions',json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
        reply=json.load(urllib.request.urlopen(request,timeout=180))['choices'][0]['message']['content']
        print(reply,flush=True)
        assert 'red' in reply.lower() and 'blue' in reply.lower(), 'Did not identify both test colors'
        print('PASS: local image inference; chat model untouched',flush=True)
    finally:
        process.terminate()
        try: process.wait(timeout=10)
        except subprocess.TimeoutExpired: process.kill();process.wait()
        print('Owned smoke server stopped',flush=True)
