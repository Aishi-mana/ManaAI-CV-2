"""Compare an approved, previously converted singing reference with speech reference.
The derived reference may contain conversion artifacts; it is not training truth.
"""
from pathlib import Path
import importlib.util, json
import numpy as np
import soundfile as sf

root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/singing-reference-audition-2026-10-13'
out.mkdir(parents=True,exist_ok=True)
reference_source=root/'exports/singing/1791658128634-current-voice/vc_guide-vocals_default-r2_1.0_30_0.7.wav'
audio,sr=sf.read(reference_source,always_2d=True)
reference=out/'derived-mana-singing-reference.wav'
# Preserve the approved isolated passage, capped at eight seconds for conditioning.
audio=audio[:round(8*sr)]
assert np.isfinite(audio).all() and len(audio)>=3*sr
sf.write(reference,audio,sr,subtype='PCM_16')
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
result=job.run(dict(repo=str(root/'data/seed-vc'),
    source=str(root/'exports/singing/cover-diagnosis-2026-10-13/guide.wav'),
    reference=str(reference),start=0,seconds=12,separate=False,
    output=str(out/'conversion'),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
levels=[]
paths=[('1-speech-reference-control',root/'exports/singing/cover-diagnosis-2026-10-13/4-mana-50-pitch.wav'),
       ('2-singing-reference-candidate',Path(result['vocal']))]
for name,path in paths:
    samples,rate=sf.read(path,always_2d=True)
    assert np.isfinite(samples).all()
    gain=min(.1/max(float(np.sqrt(np.mean(samples**2))),1e-8),.95/max(float(np.max(np.abs(samples))),1e-8))
    sf.write(out/(name+'.wav'),samples*gain,rate,subtype='PCM_16')
    levels.append(dict(name=name,seconds=len(samples)/rate,gain=gain))
report=dict(referenceSource=str(reference_source),referenceSeconds=len(audio)/sr,
    referenceIsPreviouslyConverted=True,steps=50,pitchSmoothing=True,guidance=.7,seed=42,
    productionChanged=False,listeningApproved=False,levels=levels,result=result)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
