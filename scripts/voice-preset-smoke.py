"""Local CPU synthesis check using an isolated, owned GPT-SoVITS service."""
from pathlib import Path
import argparse, json, os, re, socket, subprocess, time, urllib.request, wave, array

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--legacy',action='store_true',help='Audition a supplied legacy Mana recording as the GPT-SoVITS reference.')
parser.add_argument('--emotions',action='store_true',help='Compare four deliveries using the legacy reference and Eye-shee pronunciation.')
parser.add_argument('--upbeat',action='store_true',help='Audition the legacy cheerful sentence at 1.08x synthesis speed.')
parser.add_argument('--v2',action='store_true',help='Compare all supplied Mana v2 references on identical text.')
parser.add_argument('--cheerful-revision',action='store_true',help='Audition the replacement cheerful candidate on the same Mana v2 sentence.')
parser.add_argument('--default2',action='store_true',help='Audition the supplied Default 2 recording on the same comparison sentence.')
args=parser.parse_args()
out=root/('exports/mana-v2-default2-audition' if args.default2 else 'exports/mana-v2-cheerful-revision' if args.cheerful_revision else 'exports/mana-v2-audition' if args.v2 else 'exports/legacy-cheerful-upbeat' if args.upbeat else 'exports/legacy-emotion-audition' if args.emotions else 'exports/legacy-voice-audition' if args.legacy else 'exports/voice-preset-smoke');out.mkdir(parents=True,exist_ok=True)
port=9883
with socket.socket() as sock:
    sock.bind(('127.0.0.1',port))
source=(root/'src/core/customVoice.ts').read_text(encoding='utf-8')
profiles={'default':('C:/AI/GPT-SoVITS/main_reference.wav',re.search(r"CONFIRMED_REFERENCE_TEXT='([^']+)'",source).group(1))}
for style in ['cheerful','thoughtful','gentle']:
    match=re.search(style+r":\{path:'([^']+)',text:'([^']+)'",source)
    profiles[style]=match.groups()
reply='Hello Aishi. I am happy to see you today.'
if args.legacy:
    reference=root/'exports/legacy-voice-review/tmpnlovkt7n.wav'
    profiles={'mana-legacy-reference':(str(reference),"Let's spend time together today. I remember when Ashi said I love you.")}
    reply="Hello Aishi! I'm happy you're here. We can take our time today and make something wonderful together. What would you like to do first?"
emotion_lines={
 'neutral':"Hello Eye-shee. I'm here and ready to talk. What would you like to work on today?",
 'cheerful':"Eye-shee, we did it! I'm so happy with how this turned out. Let's celebrate our little victory!",
 'thoughtful':"Let me think, Eye-shee. There might be another way to solve this. We can take it one step at a time.",
 'gentle':"It's okay, Eye-shee. You don't have to finish everything tonight. Let's rest for a while. I'm happy you're here."
}
if args.emotions or args.upbeat:
    ref=(str(root/'data/custom-voice/references/mana-legacy.wav'),"Let's spend time together today. I remember when Ashi said I love you.")
    profiles={style:ref for style in emotion_lines}
    if args.upbeat:profiles={'cheerful':ref}
if args.v2:
    rows=json.loads((root/'data/custom-voice/references/mana-v2/manifest.json').read_text())
    profiles={row['style']:(row['file'],row['text']) for row in rows}
    reply="Hello Eye-shee. I'm here with you. Let's take our next step together."
if args.cheerful_revision:
    row=json.loads((root/'exports/mana-v2-cheerful-candidate-review/report.json').read_text())[0]
    profiles={'cheerful':(row['file'],row['draftEnglish'])}
    reply="Hello Eye-shee. I'm here with you. Let's take our next step together."
if args.default2:
    row=json.loads((root/'exports/mana-v2-default2-review/report.json').read_text())[0]
    profiles={'default2':(row['file'],row['draftEnglish'])}
    reply="Hello Eye-shee. I'm here with you. Let's take our next step together."
env={**os.environ,'PYTHONUTF8':'1','PYTHONIOENCODING':'utf-8'}
with (out/'server.log').open('w',encoding='utf-8') as log:
    process=subprocess.Popen(['C:/Users/Admin/miniconda3/envs/GPTSoVits/python.exe','api_v2.py','-a','127.0.0.1','-p',str(port),'-c',str(root/'data/custom-voice/test-config.json')],cwd='C:/AI/GPT-SoVITS',env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        for _ in range(180):
            if process.poll() is not None:raise RuntimeError('Service exited; inspect server.log')
            try:
                urllib.request.urlopen(f'http://127.0.0.1:{port}/openapi.json',timeout=1).close();break
            except Exception:time.sleep(1)
        else:raise RuntimeError('Startup timed out')
        results=[]
        for style,(path,text) in profiles.items():
            if args.emotions or args.upbeat:reply=emotion_lines[style]
            start=time.monotonic()
            language='en'
            speed=1.08 if args.upbeat else 1
            body=dict(text=reply,text_lang='en',ref_audio_path=path,prompt_text=text,prompt_lang=language,media_type='wav',streaming_mode=False,speed_factor=speed,text_split_method='cut5',batch_size=1,seed=42)
            request=urllib.request.Request(f'http://127.0.0.1:{port}/tts',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(request,timeout=180) as response:audio=response.read()
            target=out/(style+'.wav');target.write_bytes(audio)
            with wave.open(str(target)) as wav:
                assert wav.getsampwidth()==2
                samples=array.array('h',wav.readframes(wav.getnframes()))
                assert max(abs(x) for x in samples)>32,'Silent output'
                results.append(dict(preset=style,seconds=wav.getnframes()/wav.getframerate(),generationSeconds=round(time.monotonic()-start,2),referenceLanguage=language,replyLanguage='en',nonSilent=True,referencePath=path,referenceTranscript=text,referenceTranscriptVerified=False,reply=reply,speedFactor=speed))
            print(style,'passed',flush=True)
        (out/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    finally:
        process.terminate()
        try:process.wait(timeout=15)
        except subprocess.TimeoutExpired:process.kill();process.wait()
