import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import stft
p=Path('exports/singing/original-direction-preview-2026-10-18')
x,sr=sf.read(p/'original-song.wav',always_2d=True);x=x.mean(axis=1)
f,t,z=stft(x[24*sr:30*sr],sr,nperseg=4096,noverlap=3072);power=np.abs(z)**2
band=(f>=100)&(f<=10000)
rows=[]
for start in np.arange(24,30,.5):
 cols=(t>=start-24)&(t<start-24+.5);v=power[:,cols].mean(axis=1);total=v[band].sum();order=np.argsort(v[band])[-3:][::-1];freq=f[band][order]
 rows.append({'start':round(float(start),1),'dominant_hz':[round(float(q)) for q in freq],'above_3khz_fraction':round(float(v[(f>=3000)&(f<=10000)].sum()/max(total,1e-15)),3),'rms':round(float(np.sqrt(np.mean(x[int(start*sr):int((start+.5)*sr)]**2))),4)})
(p/'artifact-27s-analysis.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
