import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from singing_job import conversion_profile
class VoiceProfileTests(unittest.TestCase):
 def test_reproducible_profile_identifies_file_contents(self):
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   ref=Path(folder)/'ref.wav';ref.write_bytes(b'voice-a');a=conversion_profile({'reference':str(ref)});b=conversion_profile({'reference':str(ref)});self.assertEqual(a,b);self.assertEqual(a['seed'],42);ref.write_bytes(b'voice-b');self.assertNotEqual(a['referenceSha256'],conversion_profile({'reference':str(ref)})['referenceSha256']);self.assertFalse(a['autoPitchAdjust'])
 def test_rejects_invalid_settings_before_conversion(self):
  for key,value in [('seed',True),('seed',-1),('diffusion_steps',9),('guidance',float('nan')),('guidance',2)]:
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):conversion_profile({'reference':'missing.wav',key:value})
if __name__=='__main__':unittest.main()
