from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'src-tauri/target/debug/scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from cover_genre import restyle_backing
from source_band import plan,render
a,sr=sf.read(root/'exports/singing/genre-controlled-20261107/source.wav',always_2d=True,dtype='float32')
audio,info=restyle_backing(a.T,sr,'jazz',root/'work/follow-piano-cover-smoke',root,lead='sax',source='piano')
assert audio.shape==a.T.shape and np.isfinite(audio).all() and info['sourceInstrument']=='piano'
approved=json.loads((root/'exports/singing/follow-piano-jazz-audition/analysis.json').read_text())['score']
assert info['score']==approved,'The installed Jazz route changed the approved note plan.'
from guitar_arrangement import render_source
from piano_transcription import transcribe
piano=Path(info['instrumental']).parent/'piano-extracted.wav'
notes=transcribe(piano,12,root)
for genre in ('rock','pop','country'):
 score=plan(notes,approved['beat_map'],12,genre,source='piano')
 guitar=render_source(piano,12,root,'distorted',notes_override=score['melody'],analysis={})[0] if genre=='rock' else None
 mix,stems=render(score,root,guitar)
 assert len(mix)==12*24000 and np.isfinite(mix).all() and abs(mix).max()>.001,genre
print('Packaged Cover backing matches the approved Jazz score. Rock, Pop and Country also rendered from the same piano notes.')
