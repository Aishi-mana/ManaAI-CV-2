"""Short diatonic-third harmony draft using saved Mana vocal, no voice rerun."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.ndimage import gaussian_filter1d

root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/vocal-harmony-third-2026-10-17'
out.mkdir(exist_ok=True)
notes=json.loads((root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16/notes.json').read_text())
hist=np.zeros(12)
for folder in sorted((root/'exports/singing').glob('arrangement-1792194*')):
    request=folder/'request.json';saved=folder/'notes.json'
    if not request.is_file() or not saved.is_file():continue
    meta=json.loads(request.read_text())
    if meta.get('source_name')!='vocal' or meta.get('style')!='replace-guitar-electric-piano':continue
    for a,b,p,c in json.loads(saved.read_text()):hist[p%12]+=(b-a)*c
profiles={'major':np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]),'minor':np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])}
scores=sorted([(float(np.corrcoef(hist,np.roll(profile,tonic))[0,1]),tonic,mode) for mode,profile in profiles.items() for tonic in range(12)],reverse=True)
score,tonic,mode=scores[0]
scale=[0,2,4,5,7,9,11] if mode=='major' else [0,2,3,5,7,8,10]
allowed={(tonic+p)%12 for p in scale}
sr=24000;seconds=8
voice_path=root/'exports/singing/lead-engine-comparison-2026-10-13/2-seed-vc.wav'
lead,_=librosa.load(voice_path,sr=sr,duration=seconds)
seconds=len(lead)/sr
shifts={delta:librosa.effects.pitch_shift(lead,sr=sr,n_steps=delta) for delta in [3,4]}
weights={delta:np.zeros(len(lead)) for delta in shifts};decisions=[]
for a,b,p,c in notes:
    if a>=seconds:break
    # Minor/major third chosen by estimated scale; chromatic cases favour the closer third.
    options=[d for d in [3,4] if (p+d)%12 in allowed]
    delta=options[0] if len(options)==1 else min([3,4],key=lambda d:min(min((p+d-q)%12,(q-p-d)%12) for q in allowed))
    weights[delta][round(a*sr):round(min(b,seconds)*sr)]=1
    decisions.append(dict(start=a,end=min(b,seconds),lead=p,interval=delta))
harmony=np.zeros(len(lead))
for delta,weight in weights.items():harmony+=shifts[delta]*gaussian_filter1d(weight,sigma=.015*sr)
assert np.isfinite(harmony).all() and harmony.shape==lead.shape
# Match isolated voice energy, then place the harmony quietly under the original lead.
harmony*=np.sqrt(np.mean(lead**2))/max(1e-9,np.sqrt(np.mean(harmony**2)))
mix=lead+harmony*10**(-12/20)
gain=min(1.,.95/max(np.max(np.abs(lead)),np.max(np.abs(mix)),np.max(np.abs(harmony)),1e-9))
sf.write(out/'lead-only.wav',lead*gain,sr)
sf.write(out/'lead-with-harmony.wav',mix*gain,sr)
sf.write(out/'harmony-solo-listen.wav',harmony*gain,sr)
names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
(out/'report.json').write_text(json.dumps(dict(source=str(voice_path),song_start=170,seconds=seconds,estimated_key=names[tonic]+' '+mode,key_score=score,next_key_score=scores[1][0],decisions=decisions,harmony_mix_db=-12,method='Saved Seed-VC Mana vocal; scale-aware third above using cached vocal melody, two whole-clip pitch shifts and15ms control fades. No voice conversion/model rerun. Harmony-solo listening copy is louder than its mix level. Key inferred from cached whole-song pitch-class durations, not verified sheet music.',limitations='Draft pitch-shift harmony, no formant preservation or independent sung performance. Chromatic notes/chords/key changes can require correction; pitch shifting can alter timbre. App unchanged.'),indent=2))
print(json.dumps(dict(output=str(out),estimated_key=names[tonic]+' '+mode,score=score)))
