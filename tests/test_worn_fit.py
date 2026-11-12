"""Anatomical fit regressions: negative space, excess ease and unsafe joins."""
import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from clothing_fit import clear_underarm_background,fit_cuff_proportions,fit_shoulder_drape
from outfit_quality import broader_fit_checks

class WornFitTests(unittest.TestCase):
 def sample(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  a[140:280,78:122]=[100,140,210,255];b[140:230,80:120]=[245,210,180,255]
  for x in (40,140):
   b[160:215,x:x+20]=[245,210,180,255];b[215:230,x+2:x+18]=[245,210,180,255]
   a[155:236,x-7:x+27]=[100,140,210,255]
   a[215:236,x-7:x+27]=[245,245,245,255]
  return a,b
 def test_oversized_cuffs_narrow_without_cutting_torso_or_shoulders(self):
  a,b=self.sample();original=a.copy();body=b.copy()
  out,r=fit_cuff_proportions(a,b,'long-sleeved blouse')
  self.assertEqual(r['method'],'monotonic-anatomical-mesh')
  self.assertTrue(all(c['scale']<1 for c in r['cuffs']))
  self.assertTrue(np.array_equal(out[:160],a[:160]))
  self.assertTrue(np.array_equal(out[:,78:122],a[:,78:122]))
  self.assertTrue(np.array_equal(a,original));self.assertTrue(np.array_equal(b,body))
  end=r['cuffs'][0]['target_end']
  for y in range(end-5,end-1):
   for sl in (slice(20,77),slice(123,180)):
    x=np.flatnonzero(out[y,sl,3]>128)
    self.assertGreater(len(x),20);self.assertLess(len(x),34)
    self.assertTrue((np.diff(x)==1).all())
 def test_joined_sleeve_and_skirt_is_reviewed_without_forced_warp(self):
  a,b=self.sample();a[185:210,65:140]=[100,140,210,255]
  out,r=fit_cuff_proportions(a,b,'long-sleeved blouse')
  self.assertTrue(r['review_required']);self.assertTrue(np.array_equal(out,a))
 def test_long_sleeve_moves_off_hand_without_sampling_or_cutting_skirt(self):
  a,b=self.sample()
  for x in (40,140):a[215:243,x-7:x+27]=[245,245,245,255]
  a[250:340,65:135]=[40,55,90,255]
  out,r=fit_cuff_proportions(a,b,'long-sleeved blouse')
  self.assertTrue(all(c['move_y']<0 for c in r['cuffs']))
  self.assertTrue(np.array_equal(out[250:],a[250:]))
  self.assertTrue(np.array_equal(out[:,78:122],a[:,78:122]))
  self.assertFalse(out[230:243,25:75,3].any())
  self.assertFalse(out[230:243,125:175,3].any())
 def test_short_sleeves_are_not_reinterpreted_as_long(self):
  a,b=self.sample();out,_=fit_cuff_proportions(a,b,'short-sleeved blouse with jacket')
  self.assertTrue(np.array_equal(out,a))
 def test_cuff_coverage_alone_does_not_pass_an_oversized_fit(self):
  a,b=self.sample();checks,warnings=broader_fit_checks(a,b,[90,110,110,140],'long sleeves')
  self.assertEqual(checks['left_sleeve']['exposed_pixels'],0)
  self.assertFalse(checks['left_sleeve']['passed'])
  self.assertTrue(any('oversized' in warning for warning in warnings))
 def test_enclosed_underarm_white_is_removed_but_white_cuffs_stay(self):
  a,b=self.sample();a[165:207,68:72]=[255,255,255,255]
  before=a.copy();out,r=clear_underarm_background(a,b)
  self.assertGreater(r['underarm_background_pixels_removed'],0)
  self.assertTrue((out[170:200,68:72,3]==0).all())
  self.assertTrue(np.array_equal(out[215:236],before[215:236]))
  self.assertTrue(np.array_equal(a,before))
 def test_dropped_shoulder_moves_to_body_without_cutting_hidden_fabric(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  b[128:200,65:135]=[245,210,180,255];a[140:200,65:135]=[80,150,210,255]
  a[120:200,90:111]=[240,240,245,255];a[220:340,60:140]=[40,50,80,255]
  before=a.copy();body=b.copy();out,r=fit_shoulder_drape(a,b,[90,110,110,135])
  self.assertGreater(r['maximum_raise'],5);self.assertGreater(out[132,75,3],220)
  self.assertTrue(np.array_equal(out[:,90:111],a[:,90:111]))
  self.assertTrue(np.array_equal(out[200:],a[200:]))
  self.assertTrue(np.array_equal(a,before));self.assertTrue(np.array_equal(b,body))

if __name__=='__main__':unittest.main()
