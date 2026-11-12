from pathlib import Path
import json,numpy as np,soundfile as sf
root=Path.cwd();out=root/'exports/singing/country-roads-consistency-20261101';report=json.loads((out/'comparison.json').read_text(encoding='utf-8'));report['baseline']=str(out/'baseline-50-steps.wav');checks=[]
for file in ['baseline-50-steps.wav','candidate-70-steps.wav']:
 a,sr=sf.read(out/file,always_2d=True);assert np.isfinite(a).all();peak=float(np.max(np.abs(a)));rms=float(np.sqrt(np.mean(a*a)));assert .085<rms<.115 and peak<=.951;checks.append(dict(file=file,seconds=len(a)/sr,sampleRate=sr,rms=rms,peak=peak))
report['audioChecks']=checks;(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(checks))
