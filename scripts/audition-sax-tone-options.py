"""Accepted sax melody, softer release plus overlap; existing bank comparison."""
import json,runpy,shutil
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from arrangement_replacement import SR,render_separate,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def main():
    previous=ROOT/'exports/singing/sax-endings-2026-10-16'
    data=json.loads((previous/'report.json').read_text(encoding='utf-8'))
    notes=data['notes'];shift=data['shift']
    source,_=librosa.load(ROOT/'exports/singing/sax-demucs-elvis-audition/song-Sax.wav',sr=SR,duration=15)
    connect=runpy.run_path(str(ROOT/'scripts/audition-sax-endings.py'))['connect']
    connected,edits=connect(notes,source,15)
    # More overlap only where the accepted source energy gate already permits a join.
    for e in edits:
        i=e['index']
        if connected[i][2]!=notes[i+1][2]:connected[i][1]=min(15,notes[i+1][0]+.06)
    assert all(a[0]==b[0] and a[2:]==b[2:] for a,b in zip(connected,notes))
    out=ROOT/'exports/singing/sax-tone-options-2026-10-16';out.mkdir(exist_ok=True)
    clips={'weresax-soft-overlap':render_separate(connected,15,ROOT,'sax',shift,None,sax_release_cc=32),
           'livehq-alto':render_soundfont(connected,15,ROOT,65,shift),
           'livehq-tenor':render_soundfont(connected,15,ROOT,66,shift)}
    results=[]
    for name,x in clips.items():
        assert x.shape==(360000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    shutil.copyfile(previous/'original-extracted-sax.wav',out/'original-extracted-sax.wav')
    shutil.copyfile(previous/'softer-release.wav',out/'previous-softer-release.wav')
    report=dict(notes=connected,old_notes=notes,shift=shift,connections=len(edits),results=results,method='Preferred previous56 pitches/attacks/velocities. Same energy-gated gap repair as earlier, different-key overlap increased20→60ms, Weresax releaseCC32. LiveHQ alto65/tenor66 share identical MIDI/velocity mapping, native patch envelopes (not identical release shapes). Level matched; no source blended. Tenor is a different sax voice, not guaranteed better quality. App defaults unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(connections=len(edits),results=results),indent=2))

if __name__=='__main__':main()
