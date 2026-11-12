from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from arrangement_replacement import render_piano_preserving,SR
source=root/'exports/singing/mega-piano-extraction-20261108/Extracted piano - 12s.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
out=root/'exports/singing/isolated-piano-notes-20261108';out.mkdir(parents=True,exist_ok=True)
audio,midi,notes=render_piano_preserving(str(source),12,root)
audio*=min(1.,.95/max(float(abs(audio).max()),1e-9))
assert np.isfinite(audio).all() and len(audio)==12*SR
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
sf.write(out/'Recreated isolated piano - 12s.wav',audio,SR,subtype='PCM_16')
midi.write(str(out/'notes.mid'))
(out/'checks.json').write_text(json.dumps(dict(notes=len(notes),peak=float(abs(audio).max()),rms=float(np.sqrt(np.mean(audio*audio))),sourceUnchanged=True,targetRmsBoost=False,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('ISOLATED_NOTES_READY',flush=True)
