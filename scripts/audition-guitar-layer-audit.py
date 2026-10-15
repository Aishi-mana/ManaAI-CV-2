"""Diagnostic source bands and original bass support; not a new transcription."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfiltfilt
ROOT=Path('C:/AI/ManaAI-CV-2'); SR=24000

def load(path):
    x,sr=sf.read(path)
    if x.ndim==2:x=x.mean(axis=1)
    if sr!=SR:
        import math
        g=math.gcd(sr,SR);x=resample_poly(x,SR//g,sr//g)
    return x[9*SR:19*SR]

def main():
    source=ROOT/'exports/singing/arrangement-1791744247383209600'
    out=ROOT/'exports/singing/guitar-layer-audit-2026-10-15';out.mkdir(exist_ok=True)
    guitar=load(source/'guitar.wav');bass=load(source/'bass.wav')
    current,sr=sf.read(ROOT/'exports/singing/guitar-nam-effects-2026-10-15/small-room.wav')
    assert sr==SR and current.shape==(10*SR,2)
    # Preserve the measured source guitar:bass RMS ratio in the support comparison.
    grms=float(np.sqrt(np.mean(guitar**2)));brms=float(np.sqrt(np.mean(bass**2)))
    scale=float(np.sqrt(np.mean(current**2)))/max(grms,1e-9)
    upper=sosfiltfilt(butter(4,330,'highpass',fs=SR,output='sos'),guitar)
    lower=sosfiltfilt(butter(4,330,'lowpass',fs=SR,output='sos'),guitar)
    clips={'original-guitar':guitar,'original-upper-range':upper,'original-lower-range':lower,
           'original-bass':bass,'original-guitar-and-bass':guitar+bass,
           'current-small-room':current,
           'current-with-original-bass':current+bass[:,None]*scale}
    results=[]
    for name,x in clips.items():
        assert len(x)==10*SR and np.isfinite(x).all()
        rms=float(np.sqrt(np.mean(x**2)));peak=float(np.max(np.abs(x)))
        gain=min(.065/max(rms,1e-9),.9/max(peak,1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=peak*gain,rms=rms*gain))
    report=dict(start=9,end=19,source_bass_to_guitar_rms=brms/max(grms,1e-9),results=results,
                caveats='330Hz bands are listening aids, not separate performances: upper band contains harmonics. Current-with-original-bass intentionally uses the original separated bass, not a recreated bass. No notes transposed, no app defaults changed.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
