import json
from pathlib import Path
import soundfile as sf
import numpy as np
p=Path('exports/singing/original-direction-preview-2026-10-18/issue-27s-stems');report={}
for name in ['lead-vocal','all-vocals','instruments']:
 x,sr=sf.read(p/(name+'.wav'),always_2d=True);assert len(x)==6*sr and np.isfinite(x).all()
 report[name]={'seconds':len(x)/sr,'rms':float(np.sqrt(np.mean(x*x)))}
print(json.dumps(report))
