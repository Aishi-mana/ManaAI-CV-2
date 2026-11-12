from pathlib import Path
import json,os,sys

import numpy as np
import soundfile as sf

root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from bass_replacement import track_bass_notes
from guitar_arrangement import render_source
from music_beats import detect
from source_band import plan,render

# Use the same separator and its local bass target for the audition.
separator=root/'scripts/optional_separators.py'
code=separator.read_text(encoding='utf-8')
code=code.replace("if kind in ['keyboard-extract'","if kind in ['bass-extract','keyboard-extract'",1)
code=code.replace("target={'keyboard-extract'","target={'bass-extract':'bass','keyboard-extract'",1)
namespace={}
exec(compile(code,str(separator),'exec'),namespace)
extract=namespace['extract']
base=root/'work/full-band-audition/band'
scratch=root/'work/bass-groove-audition'
scratch.mkdir(exist_ok=True)
out=root/'exports/singing/follow-bass-groove-rock-audition'
out.mkdir(exist_ok=True)
start,seconds,rate=9,16,24000

def cut(path):
    with sf.SoundFile(path) as f:
        assert f.samplerate==rate
        f.seek(start*rate)
        return f.read(seconds*rate,dtype='float32',always_2d=True)

original=cut(base/'original-backing.wav')
source_bass=extract(original,root,'bass-extract',input_rate=rate,output_rate=rate)
assert np.sqrt(np.mean(source_bass**2))>.001
original_path=scratch/'Original backing.wav'
guitar_path=scratch/'Guitar extracted.wav'
sf.write(original_path,original,rate,subtype='FLOAT')
sf.write(guitar_path,cut(base/'guitar-extracted.wav'),rate,subtype='FLOAT')
info={}
guitar,_,_=render_source(guitar_path,seconds,root,'crunch',analysis=info)
score=plan(info['source_notes'],detect(original_path,root),seconds,'rock','crunch-guitar')
notes,velocities=track_bass_notes(source_bass,seconds)
assert len(notes)>8 and len({n[2] for n in notes})>2
bass=[[a,b,p,v/127] for (a,b,p,_),v in zip(notes,velocities)]
_,before=render(score,root,guitar)
_,after=render(dict(score,bass=bass),root,guitar)
assert all(np.array_equal(before[name],after[name]) for name in ('lead','drums'))
assert not np.allclose(before['bass'],after['bass'])
pairs=[sum(before.values()),sum(after.values())]
gain=min(.95/max(np.max(np.abs(x)) for x in pairs),.07/np.sqrt(np.mean(pairs[0]**2)))
for name,a in [('Rock - Current bass',pairs[0]*gain),('Rock - Follow bass groove',pairs[1]*gain),('Original isolated bass',source_bass*(.8/abs(source_bass).max()))]:
    assert len(a)==seconds*rate and np.isfinite(a).all()
    sf.write(out/(name+'.wav'),a,rate,subtype='PCM_16')
(out/'analysis.json').write_text(json.dumps({'song':'Reach Out to the Truth','start':start,'seconds':seconds,'bassNotes':bass,'score':score},indent=2))
print(f'Reach Out to the Truth: {len(bass)} bass notes, identical guitar and drums in both mixes.')
