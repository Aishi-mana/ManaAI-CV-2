import json,sys
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
from arrangement_replacement import SR
from vocal_melody import render_vocal_notes
out=root/'exports/singing/unchecked-instruments-2026-10-17';out.mkdir(exist_ok=True)
seconds=6
cache=root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16/notes.json'
notes=[list(n) for n in json.loads(cache.read_text(encoding='utf-8')) if n[0]<seconds]
for n in notes:n[1]=min(n[1],seconds)
source,_=librosa.load(root/'exports/singing/vocal-extraction-170s-2026-10-13/lead-vocal-raw.wav',sr=SR,duration=seconds)
source=source[:seconds*SR]
strengths=[]
for a,b,_,_ in notes:
 x=source[round(a*SR):max(round(a*SR)+1,round(min(b,a+.15)*SR))]
 strengths.append(float(np.sqrt(np.mean(x*x))))
reference=max(float(np.percentile(strengths,85)),1e-9)
levels=[int(round(35+55*np.clip(v/reference,0,1))) for v in strengths]
rows=[]
for name,audio in [('source',source)]+[(name,render_vocal_notes(notes,levels,source,seconds,root,name,{})[0]) for name in ['organ','accordion']]:
 assert len(audio)==seconds*SR and np.isfinite(audio).all()
 rms=float(np.sqrt(np.mean(audio**2)));assert rms>1e-6
 gain=min(.065/rms,.9/max(float(abs(audio).max()),1e-9))
 sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
 rows.append(dict(instrument=name,peak=float(abs(audio*gain).max()),seconds=seconds))
(out/'organ-accordion-report.json').write_text(json.dumps(dict(song_start=170,song_end=176,cached_notes=str(cache),note_count=len(notes),clips=rows,scope='Current vocal-to-instrument renderer with cached accepted notes. Checks sound/phrasing and note preservation; does not validate mixed instrumental source detection. No new transcription, separation or builds.'),indent=2),encoding='utf-8')
print(json.dumps(rows))

