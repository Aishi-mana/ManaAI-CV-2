import unittest,sys,tempfile,json,os
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
sys.path.append(str(ROOT/'data/transcription-packages'))
os.environ['NUMBA_CACHE_DIR']=str(ROOT/'data/music-cache/numba')
import numpy as np,soundfile as sf
import numpy.testing,platform
platform.uname()
import arrangement_replacement
from guitar_transcription import transcribe
from guitar_arrangement import arrange,render_source

class GuitarTests(unittest.TestCase):
 def test_invalid_or_missing_model_never_downloads(self):
  with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder,patch('subprocess.run',side_effect=AssertionError('must fail before worker')):
   for seconds in [0,61,float('nan')]:
    with self.assertRaises(ValueError):transcribe('unused',seconds,Path(folder))
   with self.assertRaisesRegex(ValueError,'Restore'):transcribe('unused',10,Path(folder))

 def test_explicit_note_edits_do_not_retranscribe_or_replace_velocities(self):
  with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder:
   folder=Path(folder);source=folder/'source.wav';x=np.sin(np.arange(24000)*2*np.pi*220/24000)*.08;sf.write(source,x,24000)
   notes=[[.1,.4,60,.5],[.6,.9,64,.8]]
   with patch('guitar_transcription.transcribe',side_effect=AssertionError('edited notes must be used')),patch('arrangement_replacement.render_separate',return_value=x.copy()) as renderer:
    audio,midi,played=render_source(source,1,ROOT,'clean',{'pitch':2},notes_override=notes)
   self.assertEqual([n[:3] for n in played],[[.1,.4,62],[.6,.9,66]])
   self.assertEqual(renderer.call_args.kwargs['midi_velocities'],[64,102])
   self.assertEqual(len(audio),24000)
   self.assertTrue(np.isfinite(audio).all())

 def test_backing_replacement_keeps_stereo_residual_and_length(self):
  from piano_transcription import midi_for
  with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder:
   folder=Path(folder);n=24000;t=np.arange(n)/24000
   backing=np.array([.1*np.sin(2*np.pi*100*t),.15*np.sin(2*np.pi*200*t)],dtype=np.float32)
   guitar=np.array([.03*np.sin(2*np.pi*300*t),.04*np.sin(2*np.pi*300*t)],dtype=np.float32)
   replacement=.05*np.sin(2*np.pi*440*t)
   def extracted(*args,**kwargs):
    sf.write(folder/'guitar-extracted.wav',guitar.T,24000,subtype='FLOAT')
    (folder/'extraction.json').write_text(json.dumps({'selected':'electric-guitar'}),encoding='utf-8')
   with patch('subprocess.run',side_effect=extracted),patch('guitar_arrangement.render_source',return_value=(replacement,midi_for([],30),[])):
    result,meta=arrange(backing,24000,ROOT,folder)
   self.assertEqual(result.shape,backing.shape)
   self.assertTrue(np.allclose(result,backing-guitar+replacement,atol=1e-6))
   self.assertEqual(meta['source']['selected'],'electric-guitar')

 def test_create_cover_uses_guitar_route_without_ace_step(self):
  from cover_genre import restyle_backing
  with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder,patch('guitar_arrangement.arrange',return_value=(np.zeros((2,24000)),{'engine':'guitar-test'})) as renderer,patch('subprocess.run',side_effect=AssertionError('No ACE-Step')):
   audio,meta=restyle_backing(np.zeros((2,24000)),24000,'guitar-electric',folder,ROOT)
   self.assertEqual(audio.shape,(2,24000));self.assertEqual(meta['engine'],'guitar-test');renderer.assert_called_once()

if __name__=='__main__':unittest.main()
