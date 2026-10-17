"""Melody-focused original-audio guide for solo violin, without added layers."""
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import stft,istft
from scipy.ndimage import gaussian_filter
from flute_replacement import prepare_flute

def focus_melody(notes,source,seconds,sr=24000):
    corrected,_,_=prepare_flute(notes,source,seconds,sr)
    freq,times,z=stft(source,fs=sr,nperseg=4096,noverlap=4096-120)
    mask=np.zeros(z.shape)
    for i,(a,b,p,c) in enumerate(notes):
        p=corrected[i][2]
        b=min(b,notes[i+1][0] if i+1<len(notes) else seconds,seconds)
        frames=(times>=a)&(times<b)
        hz=440*2**((p-69)/12);profile=np.zeros(len(freq))
        for harmonic in range(1,17):
            centre=hz*harmonic
            if centre>min(7500,sr/2):break
            profile=np.maximum(profile,np.exp(-.5*((freq-centre)/max(10,centre*.014))**2))
        mask[:,frames]=np.maximum(mask[:,frames],profile[:,None])
    mask=np.clip(gaussian_filter(mask,sigma=(.4,1.5)),0,1)
    _,audio=istft(z*mask,fs=sr,nperseg=4096,noverlap=4096-120)
    audio=audio[:len(source)]
    if len(audio)!=len(source) or not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-6:
        raise ValueError('No clear violin melody guide found. Keep original or try another section.')
    audio*=np.sqrt(np.mean(source**2))/np.sqrt(np.mean(audio**2))
    audio*=min(1.,.95/max(float(np.max(np.abs(audio))),1e-9))
    return audio

def render_focused_violin(notes,source,seconds,root,custom):
    from arrangement_replacement import render,SR
    focused=focus_melody(notes,source,seconds)
    with tempfile.TemporaryDirectory(prefix='mana-violin-') as folder:
        path=Path(folder)/'focused.wav'
        sf.write(path,focused,SR)
        audio,midi,performed=render(path,seconds,root,'violin',bank='livehq',source_name='other',custom=custom,_violin_focused=True)
    for i,n in enumerate(performed):
        if i==0 or n[0]-performed[i-1][1]>.12:
            first=round(n[0]*SR);count=min(round(.028*SR),len(audio)-first)
            if count>0:audio[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
    return audio,midi,performed
