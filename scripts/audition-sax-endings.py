"""Preserve previous sax melody/tone; compare only releases and connections."""
import json,shutil
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from arrangement_replacement import SR,render,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2')

def connect(notes,source,seconds):
    rms=librosa.feature.rms(y=source,frame_length=512,hop_length=120)[0]
    result=[list(n) for n in notes];edits=[]
    for i,n in enumerate(result[:-1]):
        following=notes[i+1];gap=following[0]-n[1]
        if not 0<=gap<=.10:continue
        a=max(0,round(n[1]*SR/120));b=min(len(rms),max(a+1,round(following[0]*SR/120)))
        if b<=a or float(np.min(rms[a:b]))<max(float(rms.max())*.04,1e-6):continue
        end=min(seconds,following[0]+(.02 if n[2]!=following[2] else -.005))
        if end>n[1]:edits.append(dict(index=i,old_end=n[1],new_end=end));n[1]=end
    return result,edits

def main():
    source=ROOT/'exports/singing/sax-demucs-elvis-audition/song-Sax.wav'
    original,_=librosa.load(source,sr=SR,duration=15);original=librosa.util.fix_length(original,size=15*SR)
    baseline,midi,notes=render(source,15,ROOT,'sax',bank='separate',source_name='sax-extracted')
    shift=midi.instruments[0].notes[0].pitch-notes[0][2]
    snapshot=json.dumps(notes);connected,edits=connect(notes,original,15)
    assert snapshot==json.dumps(notes)
    assert all(a[0]==b[0] and a[2:]==b[2:] and a[1]>=b[1] for a,b in zip(connected,notes))
    out=ROOT/'exports/singing/sax-endings-2026-10-16';out.mkdir(exist_ok=True)
    clips={'previous-sax':baseline,
           'softer-release':render_separate(notes,15,ROOT,'sax',shift,None,sax_release_cc=32),
           'connected-notes':render_separate(connected,15,ROOT,'sax',shift,None)}
    results=[]
    for name,x in clips.items():
        assert x.shape==(360000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    shutil.copyfile(ROOT/'exports/singing/sax-phrasing-elvis-2026-10-16/original-extracted-sax.wav',out/'original-extracted-sax.wav')
    reference,_=sf.read(ROOT/'exports/singing/sax-phrasing-elvis-2026-10-16/previous-sax.wav')
    repeated,_=sf.read(out/'previous-sax.wav');assert np.array_equal(reference,repeated)
    report=dict(notes=notes,connected=connected,edits=edits,shift=shift,results=results,method='Previous56 pitches, attacks, default confidence-to-velocity and Weresax tone retained. Softer-release changes only patch releaseCC104from20to32 (roughly.316s to.505s plus base); MIDI holds untouched. Connected-notes keeps default patch, fills<=100ms source-energy-supported gaps and20ms different-key overlap, same-key no overlap. Candidates separate, not combined; breaths preserved by source gate. No original blended; audition only, app default unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(note_count=len(notes),connections=len(edits),results=results),indent=2))

if __name__=='__main__':main()
