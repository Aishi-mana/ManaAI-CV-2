from pathlib import Path
import sys,json,time
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
from singing_job import run
import numpy as np
import soundfile as sf
out=root/'exports/singing/trained-route-smoke'
out.mkdir(parents=True,exist_ok=True)
start=time.monotonic()
result=run(dict(trained_voice=True,data_root=str(root),
    source=str(root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav'),
    reference=str(root/'data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth'),
    output=str(out),start=0,seconds=1,whole_song=True,separate=False,backing_gain=0))
audio,sr=sf.read(result['vocal'])
assert sr==40000 and abs(len(audio)/sr-12)<.05
assert result['voiceProfile']['engine']=='mana-trained-rvc-v1'
assert result['diffusionSteps'] is None and result['pitchSmoothing'] is False
assert np.isfinite(audio).all() and np.max(np.abs(audio))<=.981
approved,approved_sr=sf.read(root/'exports/singing/mana-current-rvc-trial-v1/epoch-50/Country Roads - trained Mana.wav')
n=min(len(audio),len(approved))
correlation=float(np.corrcoef(audio[:n],approved[:n])[0,1])
assert correlation>.98,correlation
result.update(checkedSeconds=len(audio)/sr,approvedAuditionCorrelation=correlation,elapsedSeconds=time.monotonic()-start)
(out/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
