"""Inspect a local failure without changing the user's full cover."""
from pathlib import Path
import importlib.util,json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791861784048'
out=root/'exports/singing/whereabout-72s-diagnosis'
out.mkdir(parents=True,exist_ok=True)
start=62;seconds=20
request=json.loads((source/'request.json').read_text(encoding='utf-8'))
full=json.loads((source/'result.json').read_text(encoding='utf-8'))
paths={'original':source/'source-segment.wav','lead':source/'guide-vocals.wav',
       'full-cover':Path(full['vocal'])}
levels=[]
for name,path in paths.items():
    with sf.SoundFile(path) as f:
        rate=f.samplerate;f.seek(start*rate);samples=f.read(seconds*rate,always_2d=True)
    assert len(samples)==seconds*rate and np.isfinite(samples).all()
    sf.write(out/(name+'-raw.wav'),samples,rate,subtype='FLOAT')
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    gain=min(.1/max(rms,1e-8),.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),samples*gain,rate,subtype='PCM_16')
    levels.append(dict(name=name,rms=rms,peak=peak,gain=gain))
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
import singing_pitch
original_smooth=singing_pitch.smooth_pitch
trace={}
def capture(values):
    result=original_smooth(values)
    trace['raw']=np.asarray(values).copy();trace['conditioned']=np.asarray(result).copy()
    return result
singing_pitch.smooth_pitch=capture
try:
    result=job.run(dict(repo=request['repo'],source=str(out/'lead-raw.wav'),
        reference=request['reference'],start=0,seconds=seconds,separate=False,
        output=str(out/'local-conversion'),diffusion_steps=50,guidance=.7,
        seed=42,pitch_smoothing=True))
finally:singing_pitch.smooth_pitch=original_smooth
samples,rate=sf.read(result['vocal'],always_2d=True)
assert np.isfinite(samples).all() and abs(len(samples)/rate-seconds)<.1
rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
gain=min(.1/max(rms,1e-8),.95/max(peak,1e-8))
sf.write(out/'local-rerender.wav',samples*gain,rate,subtype='PCM_16')
np.savez(out/'guide-pitch-trace.npz',**trace)
metrics=[]
# RMVPE frames are ten milliseconds apart. Inspect 70–75s specifically.
for name,values in trace.items():
    part=values[800:1300];voiced=part>1
    delta=1200*np.diff(np.log2(np.maximum(part,1)))
    consecutive=voiced[:-1]&voiced[1:]
    metrics.append(dict(name=name,region='70–75s',voicedFrames=int(voiced.sum()),
        voicingTransitions=int(np.count_nonzero(np.diff(voiced))),
        largeAdjacentJumps=int(np.count_nonzero(np.abs(delta[consecutive])>600)),
        pitchMin=float(part[voiced].min()) if voiced.any() else None,
        pitchMax=float(part[voiced].max()) if voiced.any() else None))
report=dict(source=str(source),start=start,seconds=seconds,levels=levels,
    pitchMetrics=metrics,localRerender=result,productionChanged=False,listeningApproved=False)
(out/'diagnosis.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
