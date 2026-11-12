from pathlib import Path
import json,os,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from cover_genre import restyle_backing
a,sr=sf.read(root/'work/bass-groove-audition/Original backing.wav',always_2d=True,dtype='float32')
mix,result=restyle_backing(a.T,sr,'rock',root/'work/follow-bass-production',root,lead='crunch-guitar',follow_bass=True)
expected=json.loads((root/'exports/singing/follow-bass-groove-rock-audition/analysis.json').read_text())
assert result['followBass'] and result['score']['bass']==expected['bassNotes']
assert mix.shape==a.T.shape and np.isfinite(mix).all()
assert abs(mix).max()>.001
print(f'Production Rock reproduced all {len(expected["bassNotes"])} approved source bass notes.')
