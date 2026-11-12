from pathlib import Path
import sys,json,importlib.util
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
out=root/'exports/singing/country-roads-reference-comparison-20261026'
out.mkdir(parents=True,exist_ok=True)
source=root/'exports/singing/1792874633232/guide-vocals.wav'
audio,sr=sf.read(source,always_2d=True)
# Use one active twelve-second passage for BOTH conversions.
starts=range(30,79,3)
start=max(starts,key=lambda t:float(np.mean(audio[t*sr:(t+12)*sr]**2)))
guide=out/'guide.wav';sf.write(guide,audio[start*sr:(start+12)*sr],sr,subtype='PCM_16')
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py')
job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
report={'source':str(source),'startSeconds':start,'durationSeconds':12,'seed':42,'steps':50,'guidance':.7,'pitchShift':0,'productionChanged':False,'listeningApproved':False,'candidates':[]}
for label,reference in [('1-singing-reference','singing.wav'),('2-chat-reference','default-r2.wav')]:
 result=job.run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),source=str(guide),reference=str(root/'data/custom-voice/references/mana-v2'/reference),start=0,seconds=12,separate=False,output=str(out/label),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
 samples,rate=sf.read(result['vocal'],always_2d=True)
 assert np.isfinite(samples).all() and abs(len(samples)/rate-12)<.15
 rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
 gain=min(.10/max(rms,1e-8),.95/max(peak,1e-8))
 target=out/(label+'.wav');sf.write(target,samples*gain,rate,subtype='PCM_16')
 report['candidates'].append(dict(label=label,reference=reference,file=str(target),seconds=len(samples)/rate,rms=rms,peak=peak,gain=gain))
 (out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
