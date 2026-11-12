import sys,unittest,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from cover_genre import genre_request
from singing_job import run

class GenreTests(unittest.TestCase):
 def test_all_genres_are_instrumental_source_guided_not_new_songs(self):
  for genre in ('rock','jazz','pop'):
   request=genre_request(genre,20)
   self.assertEqual(request['task_type'],'cover-nofsq')
   self.assertEqual(request['lyrics'],'[Instrumental]')
   self.assertIn('phrase timing',request['caption'])
   self.assertEqual(request['duration'],20)
 def test_invalid_and_overlong_requests_fail_before_model_load(self):
  for genre,duration in [('unknown',20),('rock',181),('jazz',math.nan),('pop',0)]:
   with self.assertRaises(ValueError): genre_request(genre,duration)
  with self.assertRaisesRegex(ValueError,'separated'):
   run(dict(genre='rock',separate=False))

if __name__=='__main__':unittest.main()
