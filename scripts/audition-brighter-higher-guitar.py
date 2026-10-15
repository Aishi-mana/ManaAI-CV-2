"""Higher-register guitar auditions: same timing, no bass, real NAM and room."""
import json,runpy,subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly,butter,sosfiltfilt
from arrangement_replacement import render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');SR=24000

def main():
    data=json.loads((ROOT/'exports/singing/guitar-longer-sustain-9-19-audition/notes.json').read_text(encoding='utf-8'))
    room=runpy.run_path(str(ROOT/'scripts/audition-nam-effects.py'))['room']
    out=ROOT/'exports/singing/guitar-brighter-higher-2026-10-15';out.mkdir(exist_ok=True)
    results=[]
    for shift in [2,5,12]:
        clean=render_separate(data['after'],19,ROOT,'electric-guitar',shift,'clean',midi_velocities=data['velocities'],guitar_release=1.1)[9*SR:19*SR]
        clean*=.065/max(float(np.sqrt(np.mean(clean**2))),1e-9)
        padded=np.pad(resample_poly(clean,2,1),(24000,24000))
        input_path=out/f'plus-{shift}-input.wav';raw_path=out/f'plus-{shift}-nam.wav'
        sf.write(input_path,padded,48000,subtype='PCM_16')
        job=subprocess.run([str(ROOT/'data/nam/build/tools/Release/render.exe'),str(ROOT/'data/nam/models/jcm800-cab.nam'),str(input_path),str(raw_path)],capture_output=True,text=True,timeout=120)
        (out/f'plus-{shift}.log').write_text(job.stdout+job.stderr,encoding='utf-8')
        if job.returncode:raise RuntimeError(job.stderr)
        x,sr=sf.read(raw_path);assert sr==48000
        x=room(resample_poly(x[24000:504000],1,2))
        upper=sosfiltfilt(butter(4,330,'highpass',fs=SR,output='sos'),x,axis=0)
        x=x*.45+upper*.55
        gain=min(.065/max(float(np.sqrt(np.mean(x**2))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        x*=gain
        assert x.shape==(10*SR,2) and np.isfinite(x).all()
        sf.write(out/f'brighter-plus-{shift}.wav',x,SR,subtype='PCM_16')
        results.append(dict(semitones=shift,peak=float(np.max(np.abs(x))),gain=gain))
        print(f'Completed +{shift} semitones',flush=True)
    (out/'report.json').write_text(json.dumps(dict(results=results,start=9,end=19,method='Same48-note timing, velocities, extended holds; SFZ notes transposed +2/+5/+12 before NAM. Normal input, small room, brighter balance. No bass or original audio. Listening comparison, not corrected transcription; production unchanged.'),indent=2),encoding='utf-8')

if __name__=='__main__':main()
