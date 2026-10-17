"""Independent source-supported violin tails using cached notes, not new polyphony."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont,prepare_source_holds,source_supported_overlap
from flute_replacement import prepare_flute

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/arrangement-1791794436553863700'
out=root/'exports/singing/violin-overlap-2026-10-16'
out.mkdir(exist_ok=True)
start,end=.8,8.5
all_notes=json.loads((base/'notes.json').read_text())
raw=[n for n in all_notes if n[0]<end]
source,rate=sf.read(base/'guitar-guide.wav')
assert rate==SR
if source.ndim>1:source=source.mean(axis=1)
source=source[:round(end*SR)]
corrected,_,_=prepare_flute(raw,source,end)
notes=[[a,b,corrected[i][2],c] for i,(a,b,p,c) in enumerate(raw)]
notes=source_supported_overlap(notes,source,end)
notes,_=prepare_source_holds(notes,source,end)
levels=[];entrances=[]
for i,n in enumerate(notes):
    entrance=i==0 or raw[i][0]-raw[i-1][1]>.12
    if entrance:entrances.append(n[0])
    levels.append(max(1,round(int(48+55*np.clip(n[3],0,1))*(.82 if entrance else .93))))
    # Never let the previous note-off cut a repeated key's new attack.
    repeat=next((x[0] for x in notes[i+1:] if x[2]==n[2]),end)
    n[1]=min(n[1],repeat,end)
shift=12 if np.median([n[2] for n in all_notes])<58 else 0
audio=render_soundfont(notes,end,root,40,shift,midi_velocities=levels,release_scale=1.4)
for onset in entrances:
    first=round(onset*SR);count=min(round(.028*SR),len(audio)-first)
    if count>0:audio[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
audio=audio[round(start*SR):round(end*SR)]
baseline,rate=sf.read(root/'exports/singing/violin-notes-2026-10-16/softer-bowing.wav')
assert rate==SR and len(audio)==len(baseline) and np.isfinite(audio).all()
assert len(notes)==len(raw) and all(a[0]==b[0] and a[2]==corrected[i][2] for i,(a,b) in enumerate(zip(notes,raw)))
audio*=np.sqrt(np.mean(baseline**2))/max(1e-9,np.sqrt(np.mean(audio**2)))
gain=min(1.,.95/max(np.max(np.abs(audio)),np.max(np.abs(baseline)),1e-9))
sf.write(out/'previous.wav',baseline*gain,SR)
sf.write(out/'independent-tails.wav',audio*gain,SR)
changes=[dict(start=a[0],pitch=a[2],previous_end=b[1],new_end=a[1]) for a,b in zip(notes,raw) if abs(a[1]-b[1])>.001]
(out/'report.json').write_text(json.dumps(dict(notes=len(notes),changed_holds=changes,new_transcription=False,method='Cached corrected melody notes; source-supported independent holds, next same-key cap; previous volume balance restored. No new simultaneous voices recovered. Same softened violin attacks and 1.4x release. RMS matched, original source mixed.'),indent=2))
print(json.dumps(dict(output=str(out),changed_holds=len(changes))))
