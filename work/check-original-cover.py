from pathlib import Path
import json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
folder=root/'exports/singing/1793880399944'
rows=[]
for path in [root/'exports/singing/original-1793880291450825500/original-song.wav',folder/'guide-vocals.wav',folder/'instrumental.wav',folder/'vc_mana-trained-v1.wav',folder/'Mana-guide-mix.wav']:
 a,sr=sf.read(path,always_2d=True,dtype='float32')
 rms=lambda x:float(np.sqrt(np.mean(x*x)))
 rows.append(dict(file=path.name,seconds=len(a)/sr,sr=sr,channels=a.shape[1],peak=float(abs(a).max()),rms=rms(a),nearClipped=float(np.mean(abs(a)>.979)),segments=[dict(start=t,rms=rms(a[t*sr:(t+5)*sr]),peak=float(abs(a[t*sr:(t+5)*sr]).max())) for t in range(0,85,5)]))
(root/'work/original-cover-audio-checks.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps([{k:v for k,v in r.items() if k!='segments'} for r in rows],indent=2))
