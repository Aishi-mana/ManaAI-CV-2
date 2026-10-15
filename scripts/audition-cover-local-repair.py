"""Combined-vocal local alternative and non-destructive vocal repair candidate."""
from pathlib import Path
import importlib.util,json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791861784048'
out=root/'exports/singing/whereabout-72s-combined-candidate'
out.mkdir(parents=True,exist_ok=True)
start=62;seconds=20
def read_clip(path):
    with sf.SoundFile(path) as f:
        sr=f.samplerate;f.seek(start*sr);data=f.read(seconds*sr,always_2d=True)
    assert len(data)==seconds*sr and np.isfinite(data).all()
    return data,sr
mix,sr=read_clip(source/'source-segment.wav')
back,rate=read_clip(source/'backing-extracted.wav')
assert rate==sr
# Production writes backing-extracted before PCM scaling: mixture - combined vocal.
combined=mix-back
peak=float(np.max(np.abs(combined)))
if peak>.98:combined*=.98/peak
sf.write(out/'combined-guide-raw.wav',combined,sr,subtype='FLOAT')
def audition(name,data,rate):
    assert np.isfinite(data).all()
    rms=float(np.sqrt(np.mean(data**2)));peak=float(np.max(np.abs(data)))
    assert rms>.001
    gain=min(.1/rms,.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),data*gain,rate,subtype='PCM_16')
    return dict(name=name,rms=rms,peak=peak,gain=gain,seconds=len(data)/rate)
levels=[audition('combined-guide',combined,sr)]
lead,rate=read_clip(source/'guide-vocals.wav')
assert rate==sr
levels.append(audition('lead-guide',lead,sr))
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
request=json.loads((source/'request.json').read_text(encoding='utf-8'))
result=job.run(dict(repo=request['repo'],source=str(out/'combined-guide-raw.wav'),
    reference=request['reference'],start=0,seconds=seconds,separate=False,
    output=str(out/'conversion'),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
candidate,rate=sf.read(result['vocal'],always_2d=True)
assert rate==sr and abs(len(candidate)/rate-seconds)<.1
levels.append(audition('combined-mana',candidate,rate))
original_result=json.loads((source/'result.json').read_text(encoding='utf-8'))
full,rate=sf.read(original_result['vocal'],always_2d=True)
assert rate==sr
candidate=np.pad(candidate,((0,max(0,seconds*sr-len(candidate))),(0,0)))[:seconds*sr]
left=70*sr;right=77*sr
replacement=candidate[left-start*sr:right-start*sr]
baseline=full[left:right]
gain=float(np.sqrt(np.mean(baseline**2)))/max(float(np.sqrt(np.mean(replacement**2))),1e-8)
gain=min(gain,.98/max(float(np.max(np.abs(replacement))),1e-8))
replacement=replacement*gain
fade=round(.4*sr)
weight=np.ones((right-left,1));weight[:fade,0]=np.linspace(0,1,fade)
weight[-fade:,0]=np.linspace(1,0,fade)
patched=full.copy();patched[left:right]=baseline*(1-weight)+replacement*weight
assert np.array_equal(patched[:left],full[:left]) and np.array_equal(patched[right:],full[right:])
assert np.isfinite(patched).all() and np.max(np.abs(patched))<.999
sf.write(out/'full-vocal-repair-candidate.wav',patched,sr,subtype='PCM_16')
levels.append(audition('current-cover',full[start*sr:(start+seconds)*sr],sr))
levels.append(audition('repair-preview',patched[start*sr:(start+seconds)*sr],sr))
report=dict(source=str(source),combinedRecoveredFrom='source-segment minus backing-extracted (raw FLOAT)',
    auditionStart=start,auditionSeconds=seconds,patchStart=70,patchEnd=77,fadeSeconds=.4,
    patchGain=gain,outsidePatchUnchanged=True,productionChanged=False,listeningApproved=False,
    levels=levels,result=result)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
