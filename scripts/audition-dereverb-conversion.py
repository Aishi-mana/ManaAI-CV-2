"""Same-context Seed-VC comparison after dedicated vocal de-reverb."""
from pathlib import Path
import importlib.util,json,shutil,sys
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
variant=sys.argv[1] if len(sys.argv)>1 else 'mono'
if variant not in ['mono','harmony']:raise ValueError('Choose mono or harmony cleanup.')
out=root/('exports/singing/whereabout-72s-harmony-audition' if variant=='harmony' else 'exports/singing/whereabout-72s-dereverb-audition')
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
result=job.run(dict(repo=str(root/'data/seed-vc'),
    source=str(out/'clean-lead-raw.wav'),reference=str(root/'data/custom-voice/references/mana-v2/singing.wav'),
    start=0,seconds=20,separate=False,output=str(out/'conversion'),
    diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
samples,sr=sf.read(result['vocal'],always_2d=True)
assert np.isfinite(samples).all() and abs(len(samples)/sr-20)<.1
rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
assert rms>.001
gain=min(.1/rms,.95/max(peak,1e-8))
sf.write(out/'clean-mana.wav',samples*gain,sr,subtype='PCM_16')
shutil.copyfile(root/'exports/singing/whereabout-72s-diagnosis/local-rerender.wav',out/'before-mana.wav')
report=dict(result=result,steps=50,guidance=.7,seed=42,pitchSmoothing=True,
    comparison='Same20s context and same voice reference; cleaned guide versus uncleaned local rerender',
    rawRms=rms,rawPeak=peak,gain=gain,productionChanged=False,listeningApproved=False)
(out/'conversion.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
