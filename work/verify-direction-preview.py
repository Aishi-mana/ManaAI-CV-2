import json
from pathlib import Path
import soundfile as sf
import numpy as np
p=Path('exports/singing/original-direction-preview-2026-10-18');r=json.loads((p/'result.json').read_text(encoding='utf-8'));print(json.dumps(r,ensure_ascii=True));
if r.get('error'):raise SystemExit(1)
x,sr=sf.read(r['mix'],always_2d=True)
assert np.isfinite(x).all() and len(x)>sr and np.max(np.abs(x))>0
print(json.dumps({'seconds':len(x)/sr,'sample_rate':sr,'channels':x.shape[1],'peak':float(np.max(np.abs(x))),'rms':float(np.sqrt(np.mean(x*x)))}))
