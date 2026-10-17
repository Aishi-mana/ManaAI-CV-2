"""Approved softer flute phrasing and source-supported register continuity."""
import numpy as np
from scipy.signal import stft

def prepare_flute(notes,source,seconds,sr=24000):
    if not notes:return [],[],[]
    raw=[list(n) for n in notes]
    played=[list(n) for n in notes]
    freq,times,z=stft(source,fs=sr,nperseg=4096,noverlap=4096-240)
    spectrum=np.abs(z)
    for i,n in enumerate(played):
        neighbours=[x[2] for j,x in enumerate(raw) if j!=i and abs(x[0]-n[0])<1.1]
        if len(neighbours)<2:continue
        centre=float(np.median(neighbours));pitch=n[2]
        alternate=min([pitch-12,pitch+12],key=lambda p:abs(p-centre))
        if not 0<=alternate<=127 or abs(pitch-centre)<9 or abs(alternate-centre)>4:continue
        mask=(times>=n[0])&(times<min(n[1],seconds))
        if not mask.any():continue
        def support(p):
            hz=440*2**((p-69)/12)
            bins=np.abs(freq-hz)<max(7,hz*.025)
            return float(np.median(spectrum[bins][:,mask].max(axis=0))) if bins.any() else 0.
        current,other=support(pitch),support(alternate)
        if other>current*.5 and other>1e-7:n[2]=alternate
    velocities=[];entrances=[]
    for i,n in enumerate(played):
        entrance=i==0 or n[0]-raw[i-1][1]>.12
        if entrance:entrances.append(n[0])
        velocities.append(max(1,round(int(48+55*np.clip(n[3],0,1))*(.85 if entrance else .94))))
        n[1]=min(n[1],seconds)
        if i+1<len(played):
            following=played[i+1]
            if n[2]!=following[2] and 0<=following[0]-n[1]<=.06:
                n[1]=min(seconds,following[0]+.035)
    return played,velocities,entrances

def soften_entrances(audio,entrances,sr=24000):
    result=audio.copy()
    for onset in entrances:
        first=max(0,round(onset*sr));count=min(round(.018*sr),len(result)-first)
        if count>0:result[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
    return result
