"""Compare the same guide/baseline/mix and a controlled 60-step candidate.
Preserves all source files and does not change approved pool clips or UI defaults.
"""
from pathlib import Path
import json,importlib.util
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791666387755'
out=root/'exports/singing/cover-quality-audition';out.mkdir(parents=True,exist_ok=True)
result=json.loads((source/'result.json').read_text(encoding='utf-8'))
report={'source':str(source),'normalization':'Common RMS target 0.10, peak limited to 0.95; no compression or denoising','stages':[],'approvedPoolChanged':False}
def export(name,path):
 audio,sr=sf.read(path,always_2d=True)
 rms=float(np.sqrt(np.mean(audio**2)));peak=float(np.max(np.abs(audio)))
 gain=min(.10/max(rms,1e-8),.95/max(peak,1e-8))
 target=out/(name+'.wav');sf.write(target,audio*gain,sr,subtype='PCM_16')
 report['stages'].append(dict(stage=name,source=str(path),seconds=len(audio)/sr,channels=audio.shape[1],sourceRms=rms,sourcePeak=peak,sourceClippedSamples=int(np.count_nonzero(np.abs(audio)>=.999)),gain=gain))
 return audio,sr
guide,sr=export('1-isolated-guide',source/'guide-vocals.wav')
export('2-current-mana-vocal',Path(result['vocal']))
export('3-current-mix',Path(result['mix']))
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py');job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
folder=out/'60-step-conversion';existing=list(folder.glob('vc_*.wav'))
candidate={'vocal':str(existing[0])} if len(existing)==1 else job.run(dict(repo=str(root/'data/seed-vc'),source=str(source/'guide-vocals.wav'),reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),start=0,seconds=len(guide)/sr,separate=False,output=str(folder),diffusion_steps=60))
vocal,rate=export('4-mana-vocal-60-steps',Path(candidate['vocal']))
backing,back_sr=sf.read(source/'instrumental.wav',always_2d=True)
assert rate==back_sr
length=min(len(vocal),len(backing));vocal=vocal[:length];backing=backing[:length]
vocal*=np.sqrt(np.mean(guide[:length]**2))/max(np.sqrt(np.mean(vocal**2)),1e-8)
mix=vocal+backing*.30
mix*=min(1,.95/max(float(np.max(np.abs(mix))),1e-8))
raw=out/'60-step-mix-raw.wav';sf.write(raw,mix,rate,subtype='PCM_16')
export('5-mana-mix-60-steps',raw)
report['candidate']={'diffusionSteps':60,'baselineSteps':30,'guidance':.7,'pitchShift':0,'autoPitchAdjustment':False,'reference':'default-r2.wav','backingGain':.3,'listeningApproved':False}
for path in out.glob('[1-5]-*.wav'):
 audio,_=sf.read(path);assert np.isfinite(audio).all() and np.max(np.abs(audio))<=.951 and np.sqrt(np.mean(audio**2))>.001
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
