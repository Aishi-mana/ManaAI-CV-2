import sys,unittest
from pathlib import Path
import numpy as np,cv2
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from clothing_footwear import extract_closed_footwear
class CompleteFootwearTests(unittest.TestCase):
 def test_semantic_leg_exclusion_removes_pale_skin_that_hsv_misses(self):
  rgb=np.full((100,100,3),255,np.uint8);rgb[10:30,35:65]=[253,235,221];rgb[30:90,30:70]=[25,35,75];rgb[32:65,32:68]=[245,245,245]
  excluded=np.zeros((100,100),bool);excluded[10:30,35:65]=True
  result=extract_closed_footwear(rgb,excluded)
  self.assertEqual(result[20,50,3],0);self.assertEqual(result[45,50,3],255);self.assertEqual(result[80,50,3],255)
 def test_removes_outside_white_keeps_white_interior_and_thin_buckle(self):
  a=np.full((100,100,3),255,np.uint8)
  cv2.rectangle(a,(25,25),(75,85),(25,35,75),-1)
  cv2.rectangle(a,(38,38),(62,53),(250,250,250),-1)
  a[30:45,23:25]=[185,150,80]
  result=extract_closed_footwear(a)
  self.assertEqual(result[0,0,3],0);self.assertEqual(result[43,43,3],255)
  self.assertTrue(np.array_equal(result[35,23],[185,150,80,255]))
  self.assertTrue((result[result[:,:,3]==0]==0).all())
 def test_empty_white_crop_rejected(self):
  with self.assertRaises(ValueError):extract_closed_footwear(np.full((40,40,3),255,np.uint8))
if __name__=='__main__':unittest.main()
