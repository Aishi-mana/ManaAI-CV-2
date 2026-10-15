"""Vocal-only key comparison. No approved clips or production defaults are changed."""
from pathlib import Path
import importlib.util, json
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
previous = root/'exports/singing/singing-reference-audition-2026-10-13'
out = root/'exports/singing/cover-key-audition-2026-10-13'
out.mkdir(parents=True, exist_ok=True)
reference = previous/'derived-mana-singing-reference.wav'
guide = root/'exports/singing/cover-diagnosis-2026-10-13/guide.wav'
spec = importlib.util.spec_from_file_location('singing_job', root/'scripts/singing_job.py')
job = importlib.util.module_from_spec(spec); spec.loader.exec_module(job)
control = json.loads((previous/'comparison.json').read_text(encoding='utf-8'))
report = dict(guide=str(guide), reference=str(reference), referenceIsPreviouslyConverted=True,
    steps=50, guidance=.7, seed=42, pitchSmoothing=True, f0Condition=True,
    autoF0Adjust=False, accompaniment=False, productionChanged=False,
    listeningApproved=False, candidates=[])
for name, shift in [('1-original-key', 0), ('2-down-two', -2), ('3-down-four', -4)]:
    if shift == 0:
        result = control['result']
    else:
        result = job.run(dict(repo=str(root/'data/seed-vc'), source=str(guide),
            reference=str(reference), start=0, seconds=12, separate=False,
            output=str(out/name), diffusion_steps=50, guidance=.7, seed=42,
            pitch_smoothing=True, semi_tone_shift=shift))
    samples, rate = sf.read(result['vocal'], always_2d=True)
    assert np.isfinite(samples).all() and abs(len(samples)/rate-12) < .1
    rms = float(np.sqrt(np.mean(samples**2)))
    peak = float(np.max(np.abs(samples)))
    assert rms > .001
    gain = min(.1/rms, .95/max(peak,1e-8))
    target = out/(name+'.wav')
    sf.write(target, samples*gain, rate, subtype='PCM_16')
    check, _ = sf.read(target, always_2d=True)
    assert np.isfinite(check).all() and np.max(np.abs(check)) <= .951
    report['candidates'].append(dict(name=name, semitones=shift,
        vocal=result['vocal'], audition=str(target), seconds=len(samples)/rate,
        rawRms=rms, rawPeak=peak, gain=gain))
(out/'comparison.json').write_text(json.dumps(report,indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
