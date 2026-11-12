from pathlib import Path
import json,numpy as np,soundfile as sf,hashlib
root=Path.cwd();out=root/'exports/singing/country-roads-stability-20261101';checks=[]
for name in ['A-current.wav','B-pitch-stability.wav','C-level-stability.wav']:
 x,sr=sf.read(out/name,always_2d=True);rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));assert np.isfinite(x).all() and .099<rms<.101 and peak<.951;assert sr==44100;checks.append({'file':name,'frames':len(x),'rms':rms,'peak':peak})
assert len({c['frames'] for c in checks})==1
r=json.loads((out/'comparison.json').read_text(encoding='utf-8'));r['validatedPreviews']=checks;r['referenceSha256']=hashlib.sha256((root/'data/custom-voice/references/mana-v2/singing-stable-v1.wav').read_bytes()).hexdigest();(out/'comparison.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(json.dumps(checks))
