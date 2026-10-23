from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import stft,find_peaks
p=Path('exports/singing/original-direction-preview-2026-10-18/issue-27s-stems')
x,sr=sf.read(p/'source-24-30s.wav',always_2d=True);b,_=sf.read(p/'backing-extracted.wav',always_2d=True);v=(x-b).mean(axis=1)
f,t,z=stft(v,sr,nperseg=4096,noverlap=3584);power=np.abs(z)**2
for start,end in [(2,2.5),(2.8,3.4),(3.5,4)]:
 a=power[:,(t>=start)&(t<end)].mean(axis=1);peaks,_=find_peaks(a);peaks=peaks[(f[peaks]>1500)&(f[peaks]<10000)];peaks=sorted(peaks,key=lambda i:a[i],reverse=True)[:8]
 print(start,end,[(round(float(f[i])),round(float(a[i]),6)) for i in peaks])
