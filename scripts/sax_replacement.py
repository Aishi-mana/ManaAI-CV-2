"""Conservative sax note-noise guard and source-backed connections."""
import numpy as np
import librosa
SR=24000

def noise_like(source,note):
    a,b,_,confidence=note
    # Protect soft melodic notes: weak confidence alone is never grounds to remove one.
    if confidence>=.45 or b-a>=.10:return False
    segment=source[max(0,round(a*SR)):min(len(source),round(b*SR))]
    if len(segment)<128:return False
    power=np.abs(np.fft.rfft(segment*np.hanning(len(segment))))**2
    power=power[1:]+1e-12
    flatness=float(np.exp(np.mean(np.log(power)))/np.mean(power))
    return flatness>.50

def prepare_sax(notes,source,seconds):
    result=[list(n) for n in notes if not noise_like(source,n)]
    if not result:raise ValueError('Only short noise-like sax notes were detected. Try a cleaner source.')
    rms=librosa.feature.rms(y=source,frame_length=512,hop_length=120)[0]
    for i,n in enumerate(result[:-1]):
        following=result[i+1];gap=following[0]-n[1]
        if not 0<=gap<=.10:continue
        a=max(0,round(n[1]*SR/120));b=min(len(rms),max(a+1,round(following[0]*SR/120)))
        if b<=a or float(np.min(rms[a:b]))<max(float(rms.max())*.04,1e-6):continue
        end=min(seconds,following[0]+(.06 if n[2]!=following[2] else -.005))
        n[1]=max(n[1],end)
    return result
