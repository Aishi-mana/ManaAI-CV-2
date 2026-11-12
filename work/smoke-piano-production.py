from pathlib import Path
import os,sys,json
root=Path(__file__).resolve().parents[1]
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from cover_genre import restyle_backing
from piano_transcription import transcribe
from unittest.mock import patch
from arrangement_replacement import render
source=root/'exports/singing/genre-controlled-20261107/source.wav'
a,sr=sf.read(source,always_2d=True,dtype='float32')
out=root/'exports/singing/piano-production-smoke-20261108';out.mkdir(parents=True,exist_ok=True)
back,profile=restyle_backing(a.T,sr,'jazz',out,root,percussion=False)
assert back.shape==(2,len(a)) and np.isfinite(back).all() and profile['percussion']==False
analysis=json.loads((out/'genre-remix/piano-analysis.json').read_text())
notes=analysis['notes']
expected=json.loads((root/'exports/singing/piano-crnn-20261108/checks.json').read_text())['notes']
# Same accepted fixture, after production extraction and inference.
assert len(notes)==len(expected),(len(notes),len(expected))
assert sorted((n[2],round(n[0],2),round(n[1],2)) for n in notes)==sorted((n[2],round(n[0],2),round(n[1],2)) for n in expected)
for bank,instrument in [('separate','piano'),('livehq','electric-piano'),('fluidr3','piano')]:
 with patch('piano_transcription.transcribe',return_value=notes):
  audio,midi,performed=render(out/'genre-remix/piano-extracted.wav',12,root,instrument,bank=bank,source_name='piano')
 assert len(performed)==44 and len(midi.instruments[0].notes)==44
 assert np.isfinite(audio).all() and len(audio)==288000
 sf.write(out/(bank+'-'+instrument+'.wav'),audio,24000,subtype='FLOAT')
print('PRODUCTION_PIANO_SMOKE_PASSED',flush=True)
