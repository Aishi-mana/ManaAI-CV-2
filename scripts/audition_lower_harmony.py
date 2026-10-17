"""Short regenerated third-below harmony using saved lead and melody."""
import json,time
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.ndimage import gaussian_filter1d
from singing_job import run

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/vocal-harmony-third-2026-10-17'
out=root/'exports/singing/vocal-harmony-below-2026-10-17'
out.mkdir(exist_ok=True)
previous=json.loads((base/'report.json').read_text())
# Reuse the same estimated C# major key as the above-harmony comparison.
tonic,mode=1,'major'
allowed={(tonic+p)%12 for p in [0,2,4,5,7,9,11]}
notes=json.loads((root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16/notes.json').read_text())
sr=24000;lead,_=librosa.load(base/'lead-only.wav',sr=sr)
seconds=len(lead)/sr
weights={d:np.zeros(len(lead)) for d in [-3,-4]};decisions=[]
for a,b,p,c in notes:
 if a>=seconds:break
 options=[d for d in [-3,-4] if (p+d)%12 in allowed]
 delta=options[0] if len(options)==1 else min([-3,-4],key=lambda d:min(min((p+d-q)%12,(q-p-d)%12) for q in allowed))
 weights[delta][round(a*sr):round(min(b,seconds)*sr)]=1
 decisions.append([a,min(b,seconds),p,delta])
guide=np.zeros(len(lead))
for delta,weight in weights.items():guide+=librosa.effects.pitch_shift(lead,sr=sr,n_steps=delta)*gaussian_filter1d(weight,.015*sr)
guide*=min(1.,.95/max(np.max(np.abs(guide)),1e-9))
guide_path=out/'harmony-guide.wav';sf.write(guide_path,guide,sr)
tick=time.perf_counter()
result=run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),source=str(guide_path),reference=str(root/'data/custom-voice/references/mana-v2/singing.wav'),start=0,seconds=seconds,separate=False,output=str(out/'conversion'),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True,semi_tone_shift=0))
harmony,_=librosa.load(result['vocal'],sr=sr)
assert np.isfinite(harmony).all() and abs(len(harmony)-len(lead))/sr<.2
harmony=librosa.util.fix_length(harmony,size=len(lead))
harmony*=np.sqrt(np.mean(lead**2))/max(1e-9,np.sqrt(np.mean(harmony**2)))
mix=lead+harmony*10**(-12/20)
gain=min(1.,.95/max(np.max(np.abs(lead)),np.max(np.abs(harmony)),np.max(np.abs(mix)),1e-9))
sf.write(out/'lead-only.wav',lead*gain,sr)
sf.write(out/'lead-with-lower-harmony.wav',mix*gain,sr)
sf.write(out/'lower-harmony-solo-listen.wav',harmony*gain,sr)
(out/'report.json').write_text(json.dumps(dict(source=str(base/'lead-only.wav'),song_start=170,seconds=seconds,key='C# major (same estimate as upper audition)',decisions=decisions,steps=50,guidance=.7,seed=42,pitch_smoothing=True,worker_seconds=time.perf_counter()-tick,harmony_mix_db=-12,method='Third below guide from same saved lead/cached melody, regenerated through approved Mana Seed-VC singing reference. Lead unchanged, shared listening peak gain, solo harmony normalized louder than mix backing. No separator/lead/full-song regeneration. Key/chords and shifted-guide artifacts remain uncertain; app unchanged.'),indent=2))
print('Lower harmony ready: '+str(out),flush=True)
