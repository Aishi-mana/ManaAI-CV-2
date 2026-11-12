import unittest,sys,tempfile,os
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(ROOT/'data/music-cache/numba')
os.environ['TEMP']=str(ROOT/'work');os.environ['TMP']=str(ROOT/'work')
import numpy as np,soundfile as sf
from piano_arrangement import support_notes,balance
from piano_transcription import transcribe

class PianoSharedTests(unittest.TestCase):
 def test_bass_does_not_invent_chords_or_beat_times(self):
  notes=[[.3,1.8,49,.55],[.32,1.8,50,.5],[4.85,6.24,49,.5],[6.42,7.94,40,.4]]
  bass=support_notes(notes)
  self.assertEqual([n[0] for n in bass],[.3,4.85,6.42])
  for n in bass:self.assertTrue(any(n[0]==p[0] and (n[2]-p[2])%12==0 for p in notes))
 def test_missing_checkpoint_fails_without_download(self):
  with tempfile.TemporaryDirectory(dir=ROOT/'work',ignore_cleanup_errors=True) as folder,patch('os.system',side_effect=AssertionError('No downloads')):
   with self.assertRaisesRegex(ValueError,'Restore'):transcribe('unused',12,Path(folder))
 def test_mix_keeps_alignment_and_silent_backing_control(self):
  a=np.sin(np.arange(24000)*.1).astype('float32')*.1;b=np.cos(np.arange(24000)*.17).astype('float32')*.1
  c=balance(a,b,0)
  self.assertEqual(c.shape,a.shape);self.assertTrue(np.isfinite(c).all())
  self.assertGreater(np.corrcoef(c,a)[0,1],.99999)
 def test_piano_sources_keep_polyphony_dynamics_and_custom_shift(self):
  import arrangement_replacement as r
  notes=[[0,.8,48,.2],[0,.8,60,.8],[.9,1.5,64,.5]]
  sys.path.append(str(ROOT/'data/transcription-packages'))
  with tempfile.TemporaryDirectory(dir=ROOT/'work',ignore_cleanup_errors=True) as folder:
   path=Path(folder)/'piano.wav';sf.write(path,np.sin(np.arange(48000)*.1)*.05,24000)
   with patch('piano_transcription.transcribe',return_value=notes) as infer,patch.object(r,'render_soundfont',return_value=np.ones(48000)*.01) as synth:
    audio,midi,performed=r.render(path,2,ROOT,'electric-piano',source_name='piano',custom={'pitch':2})
    infer.assert_called_once();self.assertEqual(len(performed),3)
    self.assertEqual(synth.call_args.kwargs['midi_velocities'],[25,102,64])
    self.assertEqual(sorted(n.pitch for n in midi.instruments[0].notes),[50,62,66])
    self.assertEqual(len(audio),48000)
 def test_taps_toggle_changes_only_optional_percussion(self):
  from piano_arrangement import arrange
  sys.path.append(str(ROOT/'data/transcription-packages'))
  notes=[[.1,1.,48,.6],[1.4,1.9,60,.5]]
  source=np.sin(np.arange(48000)*.1).astype('float32')*.05
  with tempfile.TemporaryDirectory(dir=ROOT/'work',ignore_cleanup_errors=True) as folder:
   with patch('subprocess.run'),patch('piano_transcription.transcribe',return_value=notes):
    off,meta_off=arrange(source,24000,ROOT,Path(folder)/'off')
    on,meta_on=arrange(source,24000,ROOT,Path(folder)/'on',True)
   self.assertEqual(meta_off['notes'],meta_on['notes'])
   self.assertEqual(meta_off['bassNotes'],meta_on['bassNotes'])
   silent,_=sf.read(Path(folder)/'off/soft-taps.wav');taps,_=sf.read(Path(folder)/'on/soft-taps.wav')
   self.assertEqual(float(abs(silent).max()),0.)
   self.assertGreater(float(abs(taps).max()),0.)
   self.assertTrue(np.allclose(on-off,taps,atol=1e-6))

if __name__=='__main__':unittest.main()
