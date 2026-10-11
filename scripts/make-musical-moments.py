"""Compose original wordless guides and acoustic backing, then render Mana via Seed-VC."""
from pathlib import Path
import json,sys,importlib.util
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from math import gcd
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/musical-moments';out.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
sr=24000
pieces=[
 ('soft-hum','Soft little hum','hum','none',[60,64,67,64,62,60],.75),
 ('bright-hum','Sunny little hum','hum','none',[64,67,69,67,64,62,60],.60),
 ('little-song','A little wordless song','song','piano',[60,62,64,67,69,67,64,62,60],.72)
]
manifest_path=out/'manifest.json'
piece_ids={piece[0] for piece in pieces}
manifest=[entry for entry in json.loads(manifest_path.read_text(encoding='utf-8')) if entry['id'] not in piece_ids] if manifest_path.exists() else []
for key,title,kind,instrument,notes,beat in pieces:
    folder=out/key;folder.mkdir(exist_ok=True)
    length=int((len(notes)*beat+.6)*sr)
    vocal=np.zeros(length);backing=np.zeros(length)
    for i,note in enumerate(notes):
        start=int((.15+i*beat)*sr);count=int(beat*.90*sr);t=np.arange(count)/sr
        freq=440*2**((note-69)/12)
        env=np.minimum(1,t/.045)*np.minimum(1,(t[-1]-t)/.10)
        env=np.maximum(0,env)
        tone=np.zeros(count)
        # Original synthetic humming/open-vowel guide; reference conversion supplies timbre.
        for h in range(1,18):
            hz=freq*h
            formant=(np.exp(-((hz-(350 if kind=='hum' else 750))/220)**2)+.35*np.exp(-((hz-1200)/350)**2))
            tone+=(.15/h+formant/h)*np.sin(2*np.pi*hz*t+.02*h*np.sin(2*np.pi*4*t))
        tone=.24*tone/max(.001,np.max(np.abs(tone)))*env
        vocal[start:start+count]+=tone
        # Quiet additive piano/plucked string accompaniment in C major.
        for chord in (([48,52,55] if i%4<2 else [43,47,50]) if kind=='song' else []):
            f=440*2**((chord-69)/12);decay=np.exp(-t*(3.2 if instrument=='guitar' else 2.2))
            note_audio=sum(np.sin(2*np.pi*f*h*t)/h**2 for h in range(1,7))*decay*np.minimum(1,t/.008)*.025
            backing[start:start+count]+=note_audio
    guide=folder/'original-guide.wav';sf.write(guide,vocal,sr)
    reference=root/'data/custom-voice/references/mana-v2'/('cheerful-r2.wav' if key=='bright-hum' else 'default-r2.wav')
    print('Rendering '+title,flush=True)
    result=job.run(dict(repo=str(root/'data/seed-vc'),source=str(guide),reference=str(reference),start=0,seconds=len(vocal)/sr,separate=False,output=str(folder)))
    converted,rate=sf.read(result['vocal'])
    if rate!=sr:
        divisor=gcd(rate,sr)
        converted=resample_poly(converted,sr//divisor,rate//divisor)
    size=min(len(converted),len(backing)) if kind=='song' else len(converted)
    if kind=='song':
        dry=converted.copy();dry*=min(1,.95/max(np.max(np.abs(dry)),.001))
        sf.write(out/(key+'-vocal.wav'),dry,sr,subtype='PCM_16')
    mixed=converted[:size]+backing[:size] if kind=='song' else converted.copy()
    peak=np.max(np.abs(mixed));mixed*=min(1,.95/max(peak,.001))
    path=out/(key+'.wav');sf.write(path,mixed,sr,subtype='PCM_16')
    manifest.append(dict(id=key,title=title,kind=kind,instrument=instrument,file=str(path),seconds=size/sr,originalComposition=True,wordless=True,listeningApproved=False))
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print('Saved '+str(path),flush=True)
