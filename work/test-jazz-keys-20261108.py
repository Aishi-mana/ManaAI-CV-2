from pathlib import Path
import os,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from arrangement_replacement import render_soundfont,SR
source=root/'exports/singing/piano-crnn-20261108/checks.json'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
prior=json.loads(source.read_text());notes=prior['notes']
# Change only keyboard timbre and soften the model's predicted touch.
# Preserve every pitch, onset, offset and relative strike strength.
velocities=[max(1,round(v*.90)) for v in prior['midiVelocities']]
audio=render_soundfont(notes,12,root,4,0,midi_velocities=velocities)
audio*=min(1.,.95/max(float(abs(audio).max()),1e-9))
assert np.isfinite(audio).all() and len(audio)==12*SR
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
out=root/'exports/singing/jazz-keys-touch-20261108';out.mkdir(parents=True,exist_ok=True)
sf.write(out/'Warm electric piano - 12s.wav',audio,SR,subtype='PCM_16')
(out/'checks.json').write_text(json.dumps(dict(notes=notes,midiVelocities=velocities,pitchesAndTimingUnchanged=True,addedNotes=0,program=4,peak=float(abs(audio).max()),rms=float(np.sqrt(np.mean(audio*audio))),normalization=False,productionChanged=False,listeningApproved=False,scope='Keyboard timbre and touch audition, not full jazz genre conversion'),indent=2),encoding='utf-8')
print('KEYS_READY',flush=True)
