from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from arrangement_replacement import render_soundfont,SR
source=root/'exports/singing/jazz-keys-touch-20261108/Warm electric piano - 12s.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
piano,sr=sf.read(source,dtype='float32');assert sr==SR
report=json.loads((root/'exports/singing/piano-crnn-20261108/checks.json').read_text())
candidates=sorted([n for n in report['notes'] if n[2]<=56 and n[1]-n[0]>=.6],key=lambda n:(n[0],n[2]))
bass=[];anchors=[]
for n in candidates:
 if bass and n[0]-bass[-1][0]<1.2:continue
 pitch=int(n[2])
 while pitch>47:pitch-=12
 while pitch<36:pitch+=12
 bass.append([n[0],min(n[1],n[0]+1.2),pitch,n[3]])
 anchors.append(n)
assert bass and all(any(abs(b[0]-n[0])<1e-8 and (b[2]-n[2])%12==0 for n in report['notes']) for b in bass)
signal=render_soundfont(bass,12,root,32,0,midi_velocities=[max(1,round(n[3]*127*.65)) for n in bass])
rms=lambda a:float(np.sqrt(np.mean(a*a)))
gain=min(1.,rms(piano)*.25/max(rms(signal),1e-9));signal*=gain
mix=piano+signal;mix*=min(1.,.95/max(float(abs(mix).max()),1e-9))
assert np.isfinite(mix).all() and len(mix)==len(piano)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
out=root/'exports/singing/sparse-bass-20261108';out.mkdir(parents=True,exist_ok=True)
sf.write(out/'Piano and sparse bass - 12s.wav',mix,SR,subtype='PCM_16')
sf.write(out/'Bass alone - 12s.wav',signal,SR,subtype='PCM_16')
(out/'checks.json').write_text(json.dumps(dict(bassNotes=bass,sourceAnchors=anchors,bassGain=gain,peak=float(abs(mix).max()),pianoSourceUnchanged=True,estimatedChordsUsed=False,drums=False,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('SPARSE_BASS_READY notes='+str(len(bass)),flush=True)
