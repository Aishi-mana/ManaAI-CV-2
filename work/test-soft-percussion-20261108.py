from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from arrangement_replacement import render_soundfont,SR
source=root/'exports/singing/sparse-bass-20261108/Piano and sparse bass - 12s.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
accepted,sr=sf.read(source,dtype='float32');assert sr==SR
anchors=json.loads((source.parent/'checks.json').read_text())['bassNotes']
# Sparse phrase punctuation only: use accepted bass onsets, not the rejected
# independent estimated beat loop. No synthesized brushed-noise bed.
notes=[[n[0],n[0]+.08,37,.2] for n in anchors]
drums=render_soundfont(notes,12,root,0,0,percussion=True,midi_velocities=[30]*len(notes))
rms=lambda a:float(np.sqrt(np.mean(a*a)))
gain=min(1.,rms(accepted)*.08/max(rms(drums),1e-9));drums*=gain
mix=accepted+drums;mix*=min(1.,.95/max(float(abs(mix).max()),1e-9))
assert np.isfinite(mix).all() and len(mix)==len(accepted)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
out=root/'exports/singing/soft-percussion-20261108';out.mkdir(parents=True,exist_ok=True)
sf.write(out/'Piano bass and soft taps - 12s.wav',mix,SR,subtype='PCM_16')
sf.write(out/'Percussion alone - 12s.wav',drums,SR,subtype='PCM_16')
(out/'checks.json').write_text(json.dumps(dict(percussionNotes=notes,gain=gain,peak=float(abs(mix).max()),acceptedSourceUnchanged=True,independentBeatLoop=False,scope='Sparse source-onset percussion punctuation, not full swing arrangement',productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('SOFT_PERCUSSION_READY',flush=True)
