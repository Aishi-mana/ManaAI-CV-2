"""Harmony validation, scale intervals and regeneration orchestration without models."""
import tempfile
from pathlib import Path
from unittest.mock import patch
import numpy as np
import soundfile as sf
from vocal_harmony import choose_key,third_steps,run_harmony,load_section,track_song,harmony_guide

assert choose_key([], '1:major')==(1,'major')
for key in ['12:major','bad','0:dorian']:
 try:choose_key([],key)
 except ValueError:pass
 else:raise AssertionError('Invalid harmony key accepted')
assert third_steps(60,0,'major')==4 and third_steps(64,0,'major')==3
assert third_steps(60,0,'minor')==3
assert third_steps(60,0,'major','below')==-3
assert third_steps(64,0,'major','below')==-4
try:third_steps(60,0,'major','both')
except ValueError:pass
else:raise AssertionError('Invalid harmony direction accepted')
with tempfile.TemporaryDirectory(prefix='mana-harmony-test-') as folder:
 root=Path(folder);source=root/'lead.wav'
 x=np.sin(2*np.pi*220*np.arange(48000)/24000)*.1
 sf.write(source,x,24000);original=source.read_bytes()
 # A valid fractional section at the singing engine's 44.1kHz rate can
 # resample to one extra frame; it must not be reported as out of range.
 high_rate=root/'lead-44100.wav'
 sf.write(high_rate,np.sin(2*np.pi*220*np.arange(3*44100)/44100)*.1,44100)
 section,sr=load_section(high_rate,.25,1.15)
 assert sr==24000 and len(section)==27600 and np.isfinite(section).all()
 with patch('librosa.load',return_value=(np.ones(27601)*.1,24000)):
  section,sr=load_section(high_rate,.25,1.15)
  assert len(section)==27600
 try:load_section(high_rate,2.5,1)
 except ValueError as error:assert 'beyond' in str(error)
 else:raise AssertionError('Actually out-of-range harmony section accepted')
 request=dict(source=str(source),start=0,seconds=2,harmony_key='0:major',output=str(root/'job'),reference='unused',repo='unused',separate=False,whole_song=False)
 def conversion(p):
  assert 'harmony_key' not in p and p['start']==0 and p['separate'] is False
  out=Path(p['output']);out.mkdir(parents=True,exist_ok=True)
  path=out/'voice.wav';sf.write(path,x,24000)
  return {'vocal':str(path)}
 with patch('vocal_melody.track_vocal_notes',return_value=[[0,1,60,.9],[1,2,64,.9]]),patch('librosa.effects.pitch_shift',side_effect=lambda audio,**kw:audio.copy()),patch('singing_job.run',side_effect=conversion) as worker:
  result=run_harmony(request)
  assert worker.call_count==1 and result['harmony'] and result['seconds']==2 and result['harmonyKey']=='0:major'
  audio,sr=sf.read(result['vocal']);assert sr==24000 and len(audio)==48000 and np.isfinite(audio).all()
  assert source.read_bytes()==original
  assert result['harmonyDirection']=='above'
  worker.reset_mock()
  result=run_harmony({**request,'harmony_direction':'below'})
  assert worker.call_count==1 and result['harmonyDirection']=='below'
  import json
  metadata=json.loads((root/'job/harmony.json').read_text())
  assert metadata['direction']=='below' and all(row[3] in [-3,-4] for row in metadata['decisions'])
  worker.reset_mock()
  result=run_harmony({**request,'whole_song':True,'start':1})
  assert result['wholeSong'] is True and result['seconds']==2
  assert worker.call_args.args[0]['whole_song'] is True
 for bad in [dict(seconds=31),dict(start=-1),dict(separate=True),dict(harmony_direction='both')]:
  try:run_harmony({**request,**bad})
  except ValueError:pass
  else:raise AssertionError('Bad harmony range accepted')
# Bound analysis windows and preserve a sustained note across block boundaries.
samples=np.ones(65*24000)*.1
windows=[]
def tracker(audio,seconds,instrument):
 windows.append(seconds)
 return [[0,seconds,60,.9]]
notes=track_song(samples,24000,tracker)
assert max(windows)<=30.5 and len(windows)==3
assert notes==[[0.,65.,60,.9]]
with patch('librosa.effects.pitch_shift',side_effect=lambda audio,**kw:audio.copy()) as shifter:
 guide=harmony_guide(samples,24000,[[0,65,60,-3]],'below')
 assert len(guide)==len(samples) and np.isfinite(guide).all()
 assert max(len(c.args[0]) for c in shifter.call_args_list)<=round(30.2*24000)
print('Harmony keys, thirds, range checks, recursion guard, timing and source preservation passed.')
