import unittest
from unittest.mock import patch
import builder_notes as notes
class EditedNotes(unittest.TestCase):
 def test_validation(self):
  self.assertEqual(notes.validate_notes([[0,1,60,.5]],2),[[0.,1.,60,.5]])
  for value in [[[0,3,60,.5]],[[0,1,128,.5]],[[True,1,60,.5]],[[0,1,60,float('nan')]],[[1,0,60,.5]]]:
   with self.assertRaises(ValueError):notes.validate_notes(value,2)
 def test_direct_render_never_transcribes_and_preserves_velocity(self):
  import numpy as np
  from pathlib import Path
  import arrangement_replacement as renderer
  played=[[0,.2,60,.25],[.3,.6,64,1]]
  with patch.object(renderer,'render_soundfont',return_value=np.zeros(24000)) as render:
   audio,midi,result=notes.render_edited_notes(played,1,Path.cwd(),'piano')
  self.assertEqual(result,played);self.assertEqual([n.velocity for n in midi.instruments[0].notes],[32,127]);self.assertEqual(render.call_args.kwargs['midi_velocities'],[32,127]);self.assertEqual(len(audio),24000)
 def test_empty_notes_produce_silence(self):
  from pathlib import Path
  audio,midi,result=notes.render_edited_notes([],1,Path.cwd(),'piano')
  self.assertEqual(float(abs(audio).max()),0);self.assertEqual(result,[])
if __name__=='__main__':unittest.main()
