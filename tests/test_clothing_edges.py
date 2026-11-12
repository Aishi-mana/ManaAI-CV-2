import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from clothing_edges import polish_edges
class EdgeTests(unittest.TestCase):
 def test_fills_small_gap_using_clothing_color(self):
  a=np.zeros((60,60,4),np.uint8);a[10:50,10:50]=[40,120,200,255];a[25:27,25:27]=0
  b,r=polish_edges(a)
  self.assertEqual(b[25,25,3],255);self.assertTrue(np.array_equal(b[25,25,:3],[40,120,200]));self.assertGreater(r['added_pixels'],0)
  self.assertTrue((b[b[:,:,3]==0]==0).all());self.assertTrue(np.array_equal(b[30,30],a[30,30]))
 def test_does_not_fill_large_neck_opening(self):
  a=np.zeros((80,80,4),np.uint8);a[10:70,10:70]=[40,120,200,255];a[10:40,30:50]=0
  b,_=polish_edges(a);self.assertEqual(b[25,40,3],0)
 def test_empty_alpha_clears_hidden_rgb(self):
  a=np.full((20,20,4),200,np.uint8);a[:,:,3]=0
  b,_=polish_edges(a);self.assertFalse(b.any())
if __name__=='__main__':unittest.main()
