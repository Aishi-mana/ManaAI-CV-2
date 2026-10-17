"""Conservative string ensemble cleanup, preserving source-supported pitches."""
import numpy as np
from scipy.signal import stft

def prepare_strings(notes,source,seconds,sr=24000):
    if not notes:return [],[]
    freq,times,z=stft(source,fs=sr,nperseg=4096,noverlap=4096-240)
    power=np.abs(z)
    pitches=np.arange(40,89)
    bands=np.array([power[np.abs(freq-440*2**((p-69)/12))<max(7,440*2**((p-69)/12)*.025)].max(axis=0) for p in pitches])
    relative=bands/np.maximum(bands.max(axis=0),1e-9)
    kept=[];velocities=[]
    for i,n in enumerate(notes):
        a,b,p,c=n
        frames=(times>=a)&(times<min(b,seconds))
        support=float(np.median(relative[p-40,frames])) if 40<=p<=88 and frames.any() else 1.
        detour=0<i<len(notes)-1 and notes[i-1][2]==notes[i+1][2] and notes[i-1][2]!=p and notes[i+1][0]-a<.14
        if detour and support<.4:continue
        kept.append(list(n))
        level=int(48+55*np.clip(c,0,1))
        velocities.append(max(1,round(level*(.65 if support<.5 else 1))))
    for i,n in enumerate(kept[:-1]):
        following=kept[i+1]
        if n[2]!=following[2] and 0<=following[0]-n[1]<=.1:
            n[1]=min(seconds,following[0]+.075)
    return kept,velocities
