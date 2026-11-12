from pathlib import Path
import sys,json
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
import soundfile as sf,numpy as np,librosa
from trained_voice import TrainedVoice
folder=root/'exports/singing/1793880399944';out=root/'exports/singing/original-cover-review-20261105'
guide,sr=sf.read(folder/'guide-vocals.wav',always_2d=True,dtype='float32',start=18*44100,frames=24*44100)
back,_=sf.read(folder/'instrumental.wav',always_2d=True,dtype='float32',start=18*44100,frames=24*44100)
converter=TrainedVoice(root,'mousey-trained-v2')
voice,rate=converter.convert(guide,sr)
voice=librosa.resample(voice,orig_sr=rate,target_sr=sr)
n=min(len(voice),len(back));voice=np.repeat(voice[:n,None],2,axis=1)
mix=voice+back[:n];mix*=min(1,.98/max(abs(mix).max(),1e-6))
assert np.isfinite(mix).all()
sf.write(out/'Fresh short conversion - original backing.wav',mix,sr,subtype='PCM_16')
(out/'fresh-excerpt-checks.json').write_text(json.dumps(dict(profile=converter.profile,seconds=n/sr,peak=float(abs(mix).max()),sourceStart=18,backingGain=1,sourceUnchanged=True),indent=2),encoding='utf-8')
print('READY',flush=True)
