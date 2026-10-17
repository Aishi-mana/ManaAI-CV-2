"""Short violin transcription from filtered original audio, not old mixed-stem notes."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render,SR

root=Path(__file__).resolve().parents[1]
guide=root/'exports/singing/source-melody-focus-2026-10-16/melody-focused.wav'
out=root/'exports/singing/violin-focused-guide-2026-10-16'
out.mkdir(exist_ok=True)
source,rate=sf.read(guide)
assert rate==SR
seconds=len(source)/SR
print('Transcribing only the filtered 7.7-second guide...',flush=True)
audio,midi,notes=render(guide,seconds,root,'violin',bank='livehq',source_name='other')
# Mild phrase-entry softening; no extra tail extension or overlapping voices added.
for i,n in enumerate(notes):
    if i==0 or n[0]-notes[i-1][1]>.12:
        first=round(n[0]*SR);count=min(round(.028*SR),len(audio)-first)
        if count>0:audio[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
assert len(audio)==len(source) and np.isfinite(audio).all()
audio*=np.sqrt(np.mean(source**2))/max(1e-9,np.sqrt(np.mean(audio**2)))
gain=min(1.,.95/max(np.max(np.abs(audio)),np.max(np.abs(source)),1e-9))
sf.write(out/'focused-original.wav',source*gain,SR)
sf.write(out/'violin.wav',audio*gain,SR)
midi.write(str(out/'violin.mid'))
(out/'notes.json').write_text(json.dumps(notes,indent=2))
(out/'report.json').write_text(json.dumps(dict(guide=str(guide),seconds=seconds,notes=len(notes),method='One fresh short transcription of the melody-focused original, then LiveHQ solo violin. No prior mixed-source note list, independent tail extension or added accompaniment. Original-note-guided filtering upstream can still bias this transcription; not ground truth. RMS matched. App unchanged.'),indent=2))
print(json.dumps(dict(output=str(out),notes=len(notes))),flush=True)
