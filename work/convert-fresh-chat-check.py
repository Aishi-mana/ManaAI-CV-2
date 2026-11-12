from pathlib import Path
import json,sys,time
import soundfile as sf
import numpy as np
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'scripts'))
from trained_voice import TrainedVoice
out=root/'exports/singing/mana-trained-chat-check'
rows=json.loads((out/'fresh-replies.json').read_text(encoding='utf-8'))
start=time.monotonic()
converter=TrainedVoice(root)
initialization=time.monotonic()-start
def save(name,a,sr):
    a=np.asarray(a,dtype=np.float32)
    assert np.isfinite(a).all()
    rms=float(np.sqrt(np.mean(a*a)))
    assert rms>.001
    a*=min(.1/rms,.95/max(float(np.max(np.abs(a))),1e-6))
    path=out/name
    sf.write(path,a,sr,subtype='PCM_16')
    return str(path)
for row in rows:
    audio,sr=sf.read(row['path'])
    start=time.monotonic()
    converted,rate=converter.convert(audio,sr)
    elapsed=time.monotonic()-start
    row.update(currentChat=save(row['style']+' - current chat.wav',audio,sr),
               trainedChat=save(row['style']+' - trained chat.wav',converted,rate),conversionSeconds=elapsed)
    print(row['style'],elapsed,flush=True)
report=dict(replies=rows,converterInitializationSeconds=initialization,
            activeVoiceChanged=False,voiceProfile=converter.profile,
            source='Fresh GPT-SoVITS replies through the same pipeline and parameters as chat; direct local call avoids sandbox loopback restrictions.')
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
