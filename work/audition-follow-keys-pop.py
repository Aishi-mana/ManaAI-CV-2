from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
from piano_transcription import transcribe
from music_beats import detect
from source_band import plan,render
base=root/'exports/singing/mega-keyboard-trumpet-audition'
out=root/'exports/singing/follow-keys-pop-audition'
out.mkdir(exist_ok=True)
original=base/'whereabout-original.wav'
keys=base/'whereabout-keys.wav'
a,rate=sf.read(original,always_2d=True)
k,key_rate=sf.read(keys,always_2d=True)
seconds=len(a)/rate
assert abs(len(k)/key_rate-seconds)<.01
notes=transcribe(keys,seconds,root)
beats=detect(original,root)
score=plan(notes,beats,seconds,'pop','synth-lead')
audio,stems=render(score,root)
assert len(audio)==round(24000*seconds) and np.isfinite(audio).all() and abs(stems['lead']).max()>.001
assert all(any(n[2]==p and n[0]<b and n[1]>a for n in notes) for a,b,p,_ in score['melody'])
sf.write(out/'Extracted keyboard.wav',k*(.8/max(abs(k).max(),.001)),key_rate,subtype='PCM_16')
sf.write(out/'Pop band - Follow keys.wav',audio,24000,subtype='PCM_16')
(out/'analysis.json').write_text(json.dumps({'source':str(original),'keys':str(keys),'notes':notes,'score':score},indent=2))
print(f'{seconds:g} seconds, {len(notes)} keyboard notes, {len(score["melody"])} synth lead notes and {len(beats["beats"])} beats.')
