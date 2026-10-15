"""Compare established engine candidates on identical lead-only source audio."""
from pathlib import Path
import importlib.util, json, time
import numpy as np
import soundfile as sf

root=Path(__file__).resolve().parents[1]
source_dir=root/'exports/singing/vocal-extraction-170s-2026-10-13'
out=root/'exports/singing/lead-engine-comparison-2026-10-13'
out.mkdir(parents=True,exist_ok=True)
guide=source_dir/'lead-vocal-raw.wav'
reference=root/'exports/singing/singing-reference-audition-2026-10-13/derived-mana-singing-reference.wav'
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
tick=time.perf_counter()
result=job.run(dict(repo=str(root/'data/seed-vc'),source=str(guide),reference=str(reference),
    start=0,seconds=30,separate=False,output=str(out/'seed-vc-conversion'),
    diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True,semi_tone_shift=0))
elapsed=time.perf_counter()-tick
report=dict(source=str(guide),songStart=170,sourceSeconds=30,
    accompaniment=False,productionChanged=False,listeningApproved=False,
    comparison='Engine candidates with their established conditioning; not an isolated pitch-tracker comparison',
    seedVC=dict(reference=str(reference),referenceIsPreviouslyConverted=True,steps=50,
        guidance=.7,seed=42,pitchSmoothing=True,pitch=0,workerSeconds=elapsed),
    rvc=dict(model='C:/AI/ManaAI/models/rvc/ManaVoicev1.pth',
        index='C:/AI/ManaAI/models/rvc/ManaVoicev1.index',method='fcpe',pitch=0,
        indexRate=.70,protect=.33,reused=True),levels=[])
for name,path in [('1-fcpe',source_dir/'mana-lead-vocal-raw.wav'),
                  ('2-seed-vc',Path(result['vocal']))]:
    samples,sr=sf.read(path,always_2d=True)
    assert np.isfinite(samples).all() and abs(len(samples)/sr-30)<.2
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    assert rms>.001
    gain=min(.1/rms,.95/max(peak,1e-8))
    target=out/(name+'.wav')
    sf.write(target,samples*gain,sr,subtype='PCM_16')
    checked,_=sf.read(target,always_2d=True)
    assert np.isfinite(checked).all() and np.max(np.abs(checked))<=.951
    report['levels'].append(dict(name=name,path=str(target),seconds=len(samples)/sr,
        rms=rms,peak=peak,gain=gain))
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
