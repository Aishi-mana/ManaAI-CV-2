from pathlib import Path
import numpy as np,soundfile as sf,json
out=Path(__file__).resolve().parents[1]/'exports/singing/vocal-arrangement-20261108'
voice,sr=sf.read(out/'Mousey vocal - 12s.wav',dtype='float32')
backing,rate=sf.read(out/'Arranged backing - 12s.wav',dtype='float32')
assert sr==rate==24000 and len(voice)==len(backing)==12*sr
rms=lambda a:float(np.sqrt(np.mean(a*a)))
vg=min(1.,rms(backing)/max(rms(voice)*.65,1e-9))
mix=voice*vg+backing
gain=min(.07/max(rms(mix),1e-9),.95/max(float(abs(mix).max()),1e-9));mix*=gain
assert np.isfinite(mix).all()
sf.write(out/'Rearranged with Mousey - 12s.wav',mix,sr,subtype='PCM_16')
p=out/'checks.json';report=json.loads(p.read_text());report.update(vocalGain=vg,auditionGain=gain,vocalRms=rms(voice)*vg*gain,backingRms=rms(backing)*gain,peak=float(abs(mix).max()),rms=rms(mix))
p.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
