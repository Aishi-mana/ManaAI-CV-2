import soundfile as sf,numpy as np,json
from pathlib import Path
p=Path('work/note-editor-smoke/replacement-piano.wav');x,sr=sf.read(p);print(json.dumps({'frames':len(x),'rate':sr,'peak':float(abs(x).max()),'finite':bool(np.isfinite(x).all())}));print(Path('work/note-editor-smoke/notes.json').read_text())
