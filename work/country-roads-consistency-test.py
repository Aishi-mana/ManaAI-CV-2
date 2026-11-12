from pathlib import Path
import json,sys
sys.path.insert(0,str(Path.cwd()/'scripts'))
from singing_job import run
import soundfile as sf
import numpy as np
root=Path.cwd();out=root/'exports/singing/country-roads-consistency-20261101';out.mkdir(parents=True,exist_ok=True)
source=root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav'
result=run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),source=str(source),reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),start=0,seconds=12,separate=False,output=str(out/'70-step-candidate'),diffusion_steps=70,guidance=.7,seed=42,pitch_smoothing=True))
audio,sr=sf.read(result['vocal'],always_2d=True);assert np.isfinite(audio).all();assert abs(len(audio)/sr-12)<.15
rms=float(np.sqrt(np.mean(audio**2)));peak=float(np.max(np.abs(audio)));gain=min(.1/max(rms,1e-8),.95/max(peak,1e-8));sf.write(out/'candidate-70-steps.wav',audio*gain,sr,subtype='PCM_16')
(out/'comparison.json').write_text(json.dumps(dict(baseline=str(root/'exports/singing/country-roads-reference-comparison-20261026/2-chat-reference.wav'),candidate=str(out/'candidate-70-steps.wav'),sourceSeconds=[36,48],reference='default-r2.wav',steps=[50,70],seed=42,guidance=.7,pitchShift=0,listeningApproved=False,productionQualityUnchanged=True),indent=2),encoding='utf-8')
print('DONE: '+str(out/'candidate-70-steps.wav'),flush=True)
