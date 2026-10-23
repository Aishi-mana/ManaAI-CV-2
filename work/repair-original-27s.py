from pathlib import Path
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfiltfilt,resample_poly
p=Path('exports/singing/original-direction-preview-2026-10-18');stems=p/'issue-27s-stems'
original,sr=sf.read(p/'original-song.wav',always_2d=True)
mix,ssr=sf.read(stems/'source-24-30s.wav',always_2d=True);backing,bsr=sf.read(stems/'backing-extracted.wav',always_2d=True)
assert ssr==bsr==44100 and sr==48000
vocal=mix-backing
# Local de-essing candidate: attenuate the upper vocal band, preserving the
# original mix by applying only a vocal difference, never a stem reconstruction.
soft=sosfiltfilt(butter(4,3500,fs=ssr,output='sos'),vocal,axis=0)
delta=resample_poly((soft-vocal)*.8,160,147,axis=0)
a=round(26.8*sr);b=round(27.5*sr);fade=round(.075*sr)
weight=np.ones(b-a);weight[:fade]=.5-.5*np.cos(np.linspace(0,np.pi,fade));weight[-fade:]=weight[:fade][::-1]
fixed=original.copy();local=a-24*sr
fixed[a:b]+=delta[local:local+b-a]*weight[:,None]
fixed[a:b]=np.clip(fixed[a:b],-1,1-1/32768)
path=p/'original-song-repair-27s-candidate.wav';sf.write(path,fixed,sr,subtype='PCM_16')
raw,_=sf.read(p/'original-song.wav',dtype='int16',always_2d=True);saved,_=sf.read(path,dtype='int16',always_2d=True)
assert np.array_equal(raw[:a],saved[:a]) and np.array_equal(raw[b:],saved[b:])
assert saved.shape==raw.shape and np.isfinite(fixed).all()
report=dict(candidate=str(path),method='local upper-band vocal attenuation; not pitch correction',affectedStart=26.8,affectedEnd=27.5,cutoffHz=3500,blend=.8,fadeSeconds=.075,sourcePreserved=True,outsideRegionBitIdentical=True,seconds=len(fixed)/sr,modelGeneration=False,audibleFixConfirmed=False,limitation='May soften consonants; separator leakage may affect estimated vocal delta. Cannot restore missing pronunciation or guarantee elimination of pitch artifact.')
(p/'repair-27s-candidate.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
