"""Reduce retriggers in held vowels using existing vocal notes, preserving breaths."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from arrangement_replacement import SR,render_soundfont

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/whereabout-vocal-harmonica-2026-10-16'
out=root/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16'
out.mkdir(exist_ok=True)
raw=json.loads((base/'notes.json').read_text())
source,_=librosa.load(root/'exports/singing/vocal-extraction-170s-2026-10-13/lead-vocal-raw.wav',sr=SR,duration=12)
seconds=len(source)/SR
def rms(a,b):
    x=source[max(0,round(a*SR)):min(len(source),round(b*SR))]
    return float(np.sqrt(np.mean(x*x))) if len(x) else 0.

notes=[];changes=[]
for row in raw:
    n=list(row)
    if notes:
        previous=notes[-1];gap=n[0]-previous[1]
        same=n[2]==previous[2] and 0<=gap<=.065
        # A brief neighbouring-semitone tail after a sustained vowel is likely drift.
        drift=abs(n[2]-previous[2])==1 and n[1]-n[0]<=.12 and previous[1]-previous[0]>=.45 and 0<=gap<=.02
        gap_level=rms(previous[1]-.005,n[0]+.005)
        shoulder=rms(previous[1]-.05,previous[1])
        attack=rms(n[0],n[0]+.035)
        connected=gap_level>=max(shoulder*.3,1e-6) and attack<=max(shoulder*1.8,1e-6)
        if (same or drift) and connected:
            changes.append(dict(start=n[0],pitch=n[2],action='merge held pitch fragments' if same else 'absorb brief semitone tail',held_pitch=previous[2]))
            previous[1]=n[1]
            previous[3]=max(previous[3],n[3])
            continue
    notes.append(n)
strengths=[rms(a,b) for a,b,p,c in notes]
reference=max(float(np.percentile(strengths,85)),1e-9)
levels=[int(round(35+55*np.clip(s/reference,0,1))) for s in strengths]
audio=render_soundfont(notes,seconds,root,22,0,midi_velocities=levels,release_scale=1.2)
previous,sr=sf.read(base/'harmonica.wav')
assert sr==SR and len(audio)==len(previous) and np.isfinite(audio).all()
audio*=np.sqrt(np.mean(previous**2))/max(1e-9,np.sqrt(np.mean(audio**2)))
gain=min(1.,.95/max(np.max(np.abs(previous)),np.max(np.abs(audio)),1e-9))
sf.write(out/'previous.wav',previous*gain,SR)
sf.write(out/'held-vowels.wav',audio*gain,SR)
(out/'notes.json').write_text(json.dumps(notes,indent=2))
(out/'report.json').write_text(json.dumps(dict(previous_notes=len(raw),notes=len(notes),changes=changes,method='Cached vocal notes only. Merge same-key fragments across <=65ms gaps when source energy continues without strong reattack. Absorb <=120ms semitone tail after >=450ms held vowel only with continuous source energy and <=20ms gap. Clearer attacks/rests retained. RMS matched, no fresh pitch tracking/model/voice rerun. Heuristic can still merge expressive vowel inflections; listening pending.'),indent=2))
print(json.dumps(dict(output=str(out),notes=len(notes),changes=changes)))
