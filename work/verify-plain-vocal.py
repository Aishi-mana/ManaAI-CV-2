import json
from pathlib import Path
import soundfile as sf
import numpy as np
p=Path('exports/singing/original-plain-vocal-preview-2026-10-18');r=json.loads((p/'result.json').read_text());print(json.dumps(r,ensure_ascii=True));assert not r.get('error')
x,sr=sf.read(r['mix'],always_2d=True);plan=json.loads((p/'ace-request0.json').read_text());assert len(x)/sr<=15 and np.isfinite(x).all() and np.max(np.abs(x))>0
print(json.dumps({'actual_seconds':len(x)/sr,'render_bpm':plan.get('bpm'),'audio_codes':len(plan['audio_codes'].split(',')),'channels':x.shape[1],'sample_rate':sr,'peak':float(np.max(np.abs(x)))}))
