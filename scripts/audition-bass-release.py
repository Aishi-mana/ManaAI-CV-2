"""Keep first bass MIDI exactly; compare only SoundFont release envelopes."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont,SR
ROOT=Path('C:/AI/ManaAI-CV-2')

def main():
    base=ROOT/'exports/singing/bass-performance-2026-10-15'
    data=json.loads((base/'report.json').read_text(encoding='utf-8'))
    notes=data['notes'];velocities=data['velocities'];snapshot=json.dumps(notes)
    out=ROOT/'exports/singing/bass-release-only-2026-10-15';out.mkdir(exist_ok=True)
    results=[];raw={}
    for name,program,scale in [('finger-previous',33,1),('finger-release-2x',33,2),('finger-release-4x',33,4),('picked-release-2x',34,2)]:
        x=render_soundfont(notes,19,ROOT,program,0,midi_velocities=velocities,release_scale=scale)
        assert x.shape==(19*SR,) and np.isfinite(x).all() and snapshot==json.dumps(notes)
        raw[name]=x
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[9*SR:19*SR]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,program=program,release_scale=scale,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    assert np.sqrt(np.mean((raw['finger-previous']-raw['finger-release-4x'])**2))>1e-5
    original,sr=sf.read(base/'original-bass-9-19.wav');sf.write(out/'original-9-19.wav',original,sr)
    report=dict(notes=notes,velocities=velocities,results=results,method='Exactly first44-note pitches, starts, note-off times and velocities. SoundFont volume-envelope release channel offset1200*log2(scale)timecents;2x/4x nominal release multiplier, not extra hold or reverb. Different-pitch release tails may overlap. No source blended. Existing app defaults unchanged; audition tails trimmed at19s.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(results,indent=2))

if __name__=='__main__':main()
