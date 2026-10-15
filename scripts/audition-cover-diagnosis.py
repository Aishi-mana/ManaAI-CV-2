"""Matched cover auditions; no production settings or approved clips are changed."""
from pathlib import Path
import importlib.util, json
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
source = root / 'exports/singing/1791666387755/guide-vocals.wav'
out = root / 'exports/singing/cover-diagnosis-2026-10-13'
out.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('singing_job', root/'scripts/singing_job.py')
job = importlib.util.module_from_spec(spec)
spec.loader.exec_module(job)
audio, sr = sf.read(source, always_2d=True)
# Keep the full existing passage so no phrase onset is lost.
guide = out/'guide.wav'
sf.write(guide, audio, sr, subtype='PCM_16')
report = {'source': str(source), 'seconds': len(audio)/sr, 'seed':42,
          'reference':str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),
          'productionChanged':False, 'listeningApproved':False, 'candidates':[]}
paths = [('1-guide', guide)]
for name, steps, smoothing in [('2-mana-30',30,False),('3-mana-50',50,False),('4-mana-50-pitch',50,True)]:
    folder = out/name
    result_file = folder/'audition-result.json'
    if result_file.exists():
        result = json.loads(result_file.read_text(encoding='utf-8'))
    else:
        result = job.run(dict(repo=str(root/'data/seed-vc'), source=str(guide),
            reference=report['reference'], start=0, seconds=len(audio)/sr, separate=False,
            output=str(folder), diffusion_steps=steps, guidance=.7, seed=42,
            pitch_smoothing=smoothing))
        result_file.write_text(json.dumps(result,indent=2),encoding='utf-8')
    paths.append((name,Path(result['vocal'])))
    report['candidates'].append(dict(name=name,steps=steps,pitchSmoothing=smoothing))
for name, path in paths:
    samples, rate = sf.read(path,always_2d=True)
    assert np.isfinite(samples).all()
    rms = float(np.sqrt(np.mean(samples**2)))
    peak = float(np.max(np.abs(samples)))
    gain = min(.1/max(rms,1e-8), .95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),samples*gain,rate,subtype='PCM_16')
    report.setdefault('levels',[]).append(dict(name=name,seconds=len(samples)/rate,
        rawRms=rms,rawPeak=peak,normalizedGain=gain))
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
