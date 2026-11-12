import sys,unittest
from pathlib import Path
from PIL import Image
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from image_job import clothing_position_guide
class ClothingGuideTests(unittest.TestCase):
 def test_body_pixels_never_reach_generation_reference(self):
  body=Image.new('RGBA',(100,200),(240,160,120,255));other=Image.new('RGBA',(100,200),(0,0,0,255))
  clothes=Image.new('RGBA',(100,200));clothes.paste((80,140,210,255),(30,65,70,130))
  before=body.tobytes();guide=np.array(clothing_position_guide(body,clothes))
  self.assertTrue(np.array_equal(guide,np.array(clothing_position_guide(other,clothes))))
  self.assertTrue((guide[:65]==255).all());self.assertTrue((guide[65:130,30:70]==[80,140,210]).all())
  self.assertEqual(before,body.tobytes())
 def test_installed_template_is_composited_without_hidden_transparent_rgb(self):
  guide=np.array(clothing_position_guide(Image.new('RGBA',(843,1264))))
  self.assertTrue((guide[380,422]==255).all());self.assertTrue((guide[870,422]==255).all())
if __name__=='__main__':unittest.main()
