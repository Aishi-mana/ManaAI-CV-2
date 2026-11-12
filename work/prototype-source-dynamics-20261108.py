from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from arrangement_replacement import render_piano_preserving,SR
prior=root/'exports/singing/note-jazz-prototype-20261108'
source=Path(json.loads((prior/'notes-and-chords.json').read_text())['source'])
digest=hashlib.sha256(source.read_bytes()).hexdigest()
out=root/'exports/singing/source-dynamics-20261108';out.mkdir(parents=True,exist_ok=True)
audio,midi,notes=render_piano_preserving(str(source),12,root)
# Keep the established source-dynamics rendering. Only attenuate clipping;
# do not raise a quiet transcription to a target RMS.
peak=float(np.max(np.abs(audio)));audio*=min(1.,.95/max(peak,1e-9))
assert np.isfinite(audio).all() and len(audio)==12*SR
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
sf.write(out/'Source dynamics piano - 12s.wav',audio,SR,subtype='PCM_16')
midi.write(str(out/'notes.mid'))
(out/'checks.json').write_text(json.dumps(dict(notes=len(notes),peak=float(abs(audio).max()),rms=float(np.sqrt(np.mean(audio**2))),sourceUnchanged=True,usesExistingSourceDynamicsPath=True,targetRmsBoost=False,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('SOURCE_DYNAMICS_READY',flush=True)
