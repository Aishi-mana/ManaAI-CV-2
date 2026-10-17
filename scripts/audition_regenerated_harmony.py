"""Resynthesize only the short backing harmony through existing Seed-VC."""
import json,time
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from singing_job import run

root=Path(__file__).resolve().parents[1]
previous=root/'exports/singing/vocal-harmony-third-2026-10-17'
out=root/'exports/singing/vocal-harmony-regenerated-2026-10-17'
out.mkdir(exist_ok=True)
tick=time.perf_counter()
result=run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),
 source=str(previous/'harmony-solo-listen.wav'),reference=str(root/'data/custom-voice/references/mana-v2/singing.wav'),
 start=0,seconds=8,separate=False,output=str(out/'conversion'),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True,semi_tone_shift=0))
sr=24000
lead,_=librosa.load(previous/'lead-only.wav',sr=sr)
harmony,_=librosa.load(result['vocal'],sr=sr)
raw_seconds=len(harmony)/sr
if abs(len(harmony)-len(lead))/sr>.2:raise ValueError('Harmony length differs unexpectedly from lead.')
harmony=librosa.util.fix_length(harmony,size=len(lead))
assert np.isfinite(harmony).all() and np.sqrt(np.mean(harmony**2))>1e-5
harmony*=np.sqrt(np.mean(lead**2))/np.sqrt(np.mean(harmony**2))
mix=lead+harmony*10**(-12/20)
gain=min(1.,.95/max(np.max(np.abs(lead)),np.max(np.abs(mix)),np.max(np.abs(harmony)),1e-9))
sf.write(out/'lead-with-regenerated-harmony.wav',mix*gain,sr)
sf.write(out/'regenerated-harmony-solo-listen.wav',harmony*gain,sr)
old,_=librosa.load(previous/'harmony-solo-listen.wav',sr=sr)
old*=np.sqrt(np.mean(lead**2))/max(1e-9,np.sqrt(np.mean(old**2)))
old*=min(gain,.95/max(np.max(np.abs(old)),1e-9))
sf.write(out/'previous-harmony-solo.wav',old,sr)
(out/'report.json').write_text(json.dumps(dict(source=str(previous/'harmony-solo-listen.wav'),reference=str(root/'data/custom-voice/references/mana-v2/singing.wav'),settings=dict(engine='Seed-VC singing',steps=50,guidance=.7,seed=42,pitch_smoothing=True,pitch=0),raw_seconds=raw_seconds,lead_seconds=len(lead)/sr,worker_seconds=time.perf_counter()-tick,harmony_mix_db=-12,method='Only8s pitch-shifted harmony guide resynthesized to approved Mana singing reference; saved lead unchanged. Isolated harmony normalized for listening, mix quiet. No separation/lead/full-song regeneration. Existing guide artifacts may remain; no guarantee re-synthesis removes robotic timbre. App unchanged.'),indent=2))
print('Regenerated harmony audition ready: '+str(out),flush=True)
