"""Original lyric audition: rhythm/pitch-shaped speech guide, then Seed-VC.

This is a singing prototype, not a trained lyric-to-song model. Keep it outside
the initiative library until the user approves pronunciation and musical delivery.
"""
from pathlib import Path
import json, urllib.request, importlib.util, os
import numpy as np
import soundfile as sf
import librosa

root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/little-light-audition';out.mkdir(parents=True,exist_ok=True)
sr=24000
lines=[('Little light.',60,64),('Shining bright.',67,64),('Stay with me.',64,62),('Through the night.',62,60)]
reference=root/'data/custom-voice/references/mana-v2/default-r2.wav'
transcript="Hey Aishi, sit down and let me grab that heavy bag for you. You've been on your feet all day. Of course! Now just relax, I'm gonna heat up some of that soup you love, okay?"
guide=[]
for i,(words,first,last) in enumerate(lines):
    source=out/f'speech-{i}.wav'
    if not source.exists():
        body=dict(text=words,text_lang='en',ref_audio_path=str(reference),prompt_text=transcript,prompt_lang='en',media_type='wav',streaming_mode=False,speed_factor=1,text_split_method='cut5',batch_size=1,seed=42)
        request=urllib.request.Request('http://127.0.0.1:9882/tts',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=180) as response:source.write_bytes(response.read())
    audio,rate=sf.read(source)
    if audio.ndim>1:audio=audio.mean(axis=1)
    if rate!=sr:audio=librosa.resample(audio,orig_sr=rate,target_sr=sr)
    audio,_=librosa.effects.trim(audio,top_db=30)
    audio=librosa.effects.time_stretch(audio,rate=len(audio)/(sr*2.15))
    f0,voiced,_=librosa.pyin(audio,fmin=90,fmax=650,sr=sr,frame_length=1024,hop_length=256)
    detected=f0[np.isfinite(f0)]
    if not len(detected):raise RuntimeError('No voiced guide: '+words)
    median=float(np.median(detected));halves=np.array_split(audio,2);pitched=[]
    for part,note in zip(halves,[first,last]):
        hz=440*2**((note-69)/12)
        part=librosa.effects.pitch_shift(part,sr=sr,n_steps=12*np.log2(hz/median))
        fade=min(240,len(part)//2);part[:fade]*=np.linspace(0,1,fade);part[-fade:]*=np.linspace(1,0,fade)
        pitched.append(part)
    guide.extend([np.concatenate(pitched),np.zeros(int(.22*sr))])
    print('Prepared guide: '+words,flush=True)
dry_guide=np.concatenate([np.zeros(int(.25*sr)),*guide])
guide_path=out/'lyric-guide.wav';sf.write(guide_path,dry_guide,sr,subtype='PCM_16')
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py');job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
conversion=out/'conversion'
existing=list(conversion.glob('vc_*.wav'))
result={'vocal':str(existing[0])} if len(existing)==1 else job.run(dict(repo=str(root/'data/seed-vc'),source=str(guide_path),reference=str(reference),start=0,seconds=len(dry_guide)/sr,separate=False,output=str(conversion)))
vocal,rate=sf.read(result['vocal'])
if rate!=sr:vocal=librosa.resample(vocal,orig_sr=rate,target_sr=sr)
vocal*=min(1,.9/max(float(np.max(np.abs(vocal))),.001))
backing=np.zeros(len(vocal))
# Piano enters after the vocal and stays substantially below it.
for i,chord in enumerate([[48,52,55],[48,52,55],[45,48,52],[43,47,50]]):
    start=int((.6+i*2.37)*sr);size=min(int(2.2*sr),len(backing)-start)
    if size<=0:continue
    t=np.arange(size)/sr
    for note in chord:
        f=440*2**((note-69)/12)
        backing[start:start+size]+=sum(np.sin(2*np.pi*f*h*t)/h**2 for h in range(1,6))*np.exp(-t*2.4)*np.minimum(1,t/.01)
vocal_rms=np.sqrt(np.mean(vocal**2));backing_rms=np.sqrt(np.mean(backing**2))
backing*=vocal_rms*.15/max(backing_rms,.001)
mix=vocal+backing;mix*=min(1,.95/max(float(np.max(np.abs(mix))),.001))
sf.write(out/'little-light-vocal.wav',vocal,sr,subtype='PCM_16')
sf.write(out/'little-light-piano.wav',mix,sr,subtype='PCM_16')
report=dict(title='Little Light',lyrics='Little light, shining bright.\nStay with me, through the night.',seconds=len(vocal)/sr,originalLyrics=True,originalMelody=True,method='GPT-SoVITS speech shaped into a melodic guide, then Seed-VC; provisional singing prototype',listeningApproved=False,initiativeEnabled=False,backingRmsRelativeToVocal=.15)
(out/'manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
