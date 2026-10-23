from pathlib import Path
import numpy as np,soundfile as sf,json
from scipy.signal import butter,sosfilt
root=Path.cwd()/'exports/singing/humming-connected-audition'
x,sr=sf.read(root/'soft-hum-connected.wav',always_2d=True)
# Gentle top-end reduction; retain the original pitch and timing.
filtered=sosfilt(butter(2,2800,fs=sr,output='sos'),x,axis=0)
y=.35*x+.65*filtered
rms=lambda a:float(np.sqrt(np.mean(a*a)))
y*=min(rms(x)/max(rms(y),1e-9),.95/max(float(np.max(np.abs(y))),1e-9))
assert np.isfinite(y).all() and rms(y)>.001
path=root/'soft-hum-warm.wav';sf.write(path,y,sr,subtype='PCM_16')
(root/'warm-polish.json').write_text(json.dumps({'source':'soft-hum-connected.wav','output':str(path),'seconds':len(y)/sr,'rms':rms(y),'peak':float(np.max(np.abs(y))),'processing':'35% dry + 65% two-pole 2800Hz lowpass, RMS matched','newVoiceGeneration':False,'listeningApproved':False},indent=2))
print(str(path))
