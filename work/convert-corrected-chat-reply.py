from pathlib import Path
import sys,json,time
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
from trained_voice import TrainedVoice
out=root/'exports/singing/mana-chat-contraction-check'
source=json.loads((out/'generation.json').read_text(encoding='utf-8'))
audio,sr=sf.read(source['source'])
voice=TrainedVoice(root)
start=time.monotonic()
converted,rate=voice.convert(audio,sr)
elapsed=time.monotonic()-start
checks=[]
for name,samples,sample_rate in [('corrected - original chat.wav',audio,sr),('corrected - trained chat.wav',converted,rate)]:
    samples=np.asarray(samples,dtype=np.float32)
    assert np.isfinite(samples).all()
    rms=float(np.sqrt(np.mean(samples*samples)))
    assert rms>.001
    samples*=min(.1/rms,.95/max(float(np.max(np.abs(samples))),1e-6))
    target=out/name
    sf.write(target,samples,sample_rate,subtype='PCM_16')
    checks.append(dict(path=str(target),seconds=len(samples)/sample_rate,peak=float(np.max(np.abs(samples))),rms=float(np.sqrt(np.mean(samples*samples)))))
report=dict(outputs=checks,conversionSeconds=elapsed,voiceProfile=voice.profile,
            confirmedCause='Curly apostrophes were stripped before phonemization: Im=IH1 M; ASCII contraction yields AY1 M.',
            change='Normalize typographic apostrophes for English target and reference text before TTS; model/key/rate/seed unchanged.',
            singingChanged=False,chatModelChanged=False,listeningPending=True)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
