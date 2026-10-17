"""Use the cached diagnostic pitch trace; no fresh pitch tracking."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from vocal_melody import stable_vocal_line,clean_held_notes
from electric_piano_replacement import merge_vocal_holds,render_electric_piano

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/whereabout-36s-vocal-diagnosis'
cache=np.load(base/'pitch.npz');source=cache['source'];seconds=len(source)/24000
valid=cache['voiced'] & np.isfinite(cache['pitch']) & (cache['prob']>=.45)
line=stable_vocal_line(cache['pitch'],valid)
raw=[];first=0
for i in range(1,len(line)+1):
 if i<len(line) and line[i]==line[first]:continue
 a,b=first*.005,min(seconds,i*.005)
 if line[first]>0 and b-a>=.08:raw.append([a,b,int(line[first]),float(np.mean(cache['prob'][first:i]))])
 first=i
notes=merge_vocal_holds(clean_held_notes(raw,source),source)
audio,midi,played=render_electric_piano(notes,source,seconds,root,{})
previous,sr=sf.read(root/'exports/singing/arrangement-1792194515269275400/electric-piano.wav',start=32*24000,frames=len(source))
assert sr==24000 and len(audio)==len(previous) and np.isfinite(audio).all()
audio*=np.sqrt(np.mean(previous**2))/max(1e-9,np.sqrt(np.mean(audio**2)))
gain=min(1.,.95/max(np.max(np.abs(audio)),np.max(np.abs(previous)),1e-9))
sf.write(base/'previous.wav',previous*gain,24000)
sf.write(base/'stable-held-notes.wav',audio*gain,24000)
(base/'notes.json').write_text(json.dumps(played,indent=2))
print('Focused comparison saved; source32–41s, '+str(len(played))+' notes.')
