from pathlib import Path
import math,json
import soundfile as sf,numpy as np
from scipy.signal import resample_poly
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/genre-rock-trial-20261105'
back,sr=sf.read(out/'genre-remix/restyled-backing.wav',always_2d=True,dtype='float32')
old,_=sf.read(out/'genre-remix/original-backing.wav',always_2d=True,dtype='float32')
assert np.isfinite(back).all() and abs(back).max()<=.981
assert np.sqrt(np.mean((back-old)**2))>.001,'Genre render must differ from source'
voice,vr=sf.read(root/'exports/singing/1793880399944/vc_mana-trained-v1.wav',start=18*40000,frames=12*40000,always_2d=True,dtype='float32')
g=math.gcd(vr,sr);voice=resample_poly(voice,sr//g,vr//g,axis=0)
n=min(len(voice),len(back));mix=voice[:n]+back[:n];mix*=min(1,.98/max(abs(mix).max(),1e-6))
sf.write(out/'Mousey with rock backing - 12s.wav',mix,sr,subtype='PCM_16')
(out/'preview-checks.json').write_text(json.dumps(dict(seconds=n/sr,peak=float(abs(mix).max()),backingDifferenceRms=float(np.sqrt(np.mean((back-old)**2))),sourceUnchanged=True)),encoding='utf-8')
