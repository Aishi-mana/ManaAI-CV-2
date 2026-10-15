"""Controlled upper-register balance test, without inventing higher notes."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfiltfilt
import runpy
ROOT=Path('C:/AI/ManaAI-CV-2');SR=24000
load=runpy.run_path(str(ROOT/'scripts/audition-guitar-layer-audit.py'))['load']

def main():
    source=ROOT/'exports/singing/arrangement-1791744247383209600'
    current,sr=sf.read(ROOT/'exports/singing/guitar-nam-effects-2026-10-15/small-room.wav')
    assert sr==SR
    guitar=load(source/'guitar.wav');bass=load(source/'bass.wav')
    target=float(np.sqrt(np.mean(current**2)))
    bass*=target/max(float(np.sqrt(np.mean(guitar**2))),1e-9)
    # Same notes and room. Reduce low guitar energy rather than octave-shifting it.
    upper=sosfiltfilt(butter(4,330,'highpass',fs=SR,output='sos'),current,axis=0)
    out=ROOT/'exports/singing/guitar-upper-balance-2026-10-15';out.mkdir(exist_ok=True)
    results=[]
    for name,lead in [('current',current),('brighter',current*.45+upper*.55),('upper-focused',upper)]:
        lead*=target/max(float(np.sqrt(np.mean(lead**2))),1e-9)
        for suffix,x in [('guitar',lead),('with-original-bass',lead+bass[:,None])]:
            assert x.shape==(SR*10,2) and np.isfinite(x).all()
            gain=min(.065/max(float(np.sqrt(np.mean(x**2))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
            sf.write(out/(name+'-'+suffix+'.wav'),x*gain,SR,subtype='PCM_16')
            results.append(dict(name=name+'-'+suffix,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    report=dict(start=9,end=19,results=results,method='Same NAM+small room notes, 330Hz upper-range balance comparison. No pitch changes; higher harmonics emphasized, missing notes not recovered. Original bass is intentionally retained only in labelled support mixes. No app changes.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
