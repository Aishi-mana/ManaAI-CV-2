"""Production lead-only extraction and Seed-VC conversion smoke check."""
from pathlib import Path
import importlib.util,json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/production-lead-cover-smoke-2026-10-13'
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
p=dict(repo=str(root/'data/seed-vc'),source=str(root/'exports/singing/vocal-extraction-170s-2026-10-13/original-mix.wav'),
    reference=str(root/'data/custom-voice/references/mana-v2/singing.wav'),start=0,seconds=30,
    separate=True,extractor='mega-lead',diffusion_steps=50,pitch_smoothing=True,seed=42,
    backing_gain=.3,output=str(out),whole_song=True)
out.mkdir(parents=True,exist_ok=True)
(out/'request.json').write_text(json.dumps(p),encoding='utf-8')
result=job.run(p)
for path in [result['vocal'],result['mix'],str(out/'guide-vocals.wav'),str(out/'instrumental.wav')]:
    samples,sr=sf.read(path,always_2d=True)
    assert np.isfinite(samples).all() and abs(len(samples)/sr-30)<.1
    assert np.max(np.abs(samples))<.999
assert result['extractor']=='mega-lead' and result['diffusionSteps']==50 and result['pitchSmoothing']
(out/'result.json').write_text(json.dumps(dict(done=True,error='',**result)),encoding='utf-8')
print(json.dumps(result),flush=True)
