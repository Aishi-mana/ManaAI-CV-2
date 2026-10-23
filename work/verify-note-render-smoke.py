import soundfile as sf,numpy as np,json
from pathlib import Path
p=Path('work/note-editor-smoke');x,sr=sf.read(p/'replacement-piano.wav');assert abs(len(x)-sr)<=1 and np.isfinite(x).all() and abs(x).max()>0
assert json.loads((p/'notes.json').read_text())==[[0.,.25,60,.4],[.35,.8,64,.8]]
print('One-second real sample render passed; edited notes preserved, no transcription.')
