import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from clothing_fit import fit_closed_shoes,fit_sleeve_widths
class ShoeFitTests(unittest.TestCase):
 def test_shoe_compositing_preserves_real_color_upper_pixels_exactly(self):
  outfit=np.zeros((200,200,4),np.uint8);body=np.zeros_like(outfit)
  outfit[40:100,50:150,:3]=np.random.default_rng(7).integers(0,256,(60,100,3),dtype=np.uint8)
  outfit[40:100,50:150,3]=255
  for x in (45,140):
   outfit[170:194,x:x+16]=[20,30,80,255];body[184:199,x:x+16]=[245,210,180,255]
  fitted,_=fit_closed_shoes(outfit,body)
  self.assertTrue(np.array_equal(outfit[:156],fitted[:156]))
 def test_covers_toes_without_changing_body_or_upper_clothing(self):
  outfit=np.zeros((200,200,4),np.uint8);body=np.zeros_like(outfit)
  outfit[40:100,50:150]=[50,120,220,255]
  for x in (45,140):
   outfit[170:194,x:x+16]=[20,30,80,255];body[184:199,x:x+16]=[245,210,180,255]
  original=body.copy();fitted,report=fit_closed_shoes(outfit,body)
  self.assertTrue(np.array_equal(body,original));self.assertTrue(np.array_equal(outfit[:156],fitted[:156]))
  self.assertTrue(all(f['fitted'] for f in report['feet']));self.assertGreater(sum(f['foot_pixels_exposed_before'] for f in report['feet']),0)
  self.assertFalse(report['automatic_save_allowed']);self.assertTrue((fitted[fitted[:,:,3]==0]==0).all())
 def test_body_guided_fit_checks_sock_sides_not_only_toes(self):
  outfit=np.zeros((200,200,4),np.uint8);body=np.zeros_like(outfit)
  for x in (45,140):
   outfit[165:190,x:x+14]=[240,240,240,255]
   outfit[187:199,x-3:x+17]=[20,30,80,255]
   body[172:190,x-1:x+15]=[245,210,180,255]
   body[190:199,x-2:x+16]=[245,210,180,255]
  fitted,r=fit_closed_shoes(outfit,body,allow_reposition=True)
  self.assertTrue(all(f['coverage_includes_sock_shaft'] for f in r['feet']))
  self.assertTrue(all(f['foot_pixels_exposed_after']==0 for f in r['feet']))
 def test_long_hem_does_not_hide_separate_high_socks(self):
  outfit=np.zeros((200,200,4),np.uint8);body=np.zeros_like(outfit)
  outfit[50:160,75:125]=[80,40,130,255]
  for x in (40,140):
   outfit[148:194,x:x+16]=[220,225,240,255]
   body[156:199,x:x+16]=[245,210,180,255]
  original=outfit.copy();fitted,r=fit_closed_shoes(outfit,body,allow_reposition=True)
  self.assertTrue(all(f['fitted'] for f in r['feet']))
  self.assertTrue(np.array_equal(fitted[50:160,75:125],original[50:160,75:125]))
  self.assertTrue(np.array_equal(outfit,original))
 def test_sleeve_resize_improves_arms_without_touching_shoulders_or_hands(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  b[140:230,80:120]=[245,210,180,255];a[140:230,75:125]=[30,90,150,255]
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255]
   b[225:230,x+2:x+18]=[245,210,180,255]
   a[160:235,x+3:x+19]=[30,90,150,255]
  original=a.copy();fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  target=b[:,:,3]>0
  self.assertLess(int((target&(fit[:,:,3]<220)).sum()),int((target&(a[:,:,3]<220)).sum()))
  self.assertGreater(r['rows_resized'],0)
  self.assertTrue(all(c['scale']==1.0 for c in r['cuff_transforms']))
  for x in (40,140):self.assertTrue((fit[160,x+2:x+18,3]>=220).all())
  self.assertTrue(np.array_equal(fit[:160],a[:160]))
  self.assertTrue(np.array_equal(fit[235:],a[235:]))
  self.assertTrue(np.array_equal(a,original))
  short,_=fit_sleeve_widths(a,b,'short-sleeved dress');self.assertTrue(np.array_equal(short,a))
 def test_cuff_motion_does_not_cut_or_patch_the_nearby_skirt(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  a[140:290,66:134]=[120,85,160,255];b[140:230,80:120]=[245,210,180,255]
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255];b[225:230,x+2:x+18]=[245,210,180,255]
   a[160:235,x+3:x+19]=[160,140,190,255]
  fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  self.assertTrue(np.array_equal(fit[160:290,66:134],a[160:290,66:134]))
 def test_already_fitted_sleeves_and_cuffs_remain_pixel_identical(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255]
   b[225:230,x+2:x+18]=[245,210,180,255]
   a[155:236,x-4:x+24]=[160,140,190,255]
   a[215:236,x-4:x+24,:3]=np.random.default_rng(x).integers(50,220,(21,28,3),dtype=np.uint8)
  b[140:230,80:120]=[245,210,180,255];a[140:270,70:130]=[120,85,160,255]
  fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  self.assertTrue(np.array_equal(a,fit));self.assertEqual(r['naturally_fitted_sleeves'],2)
 def test_missing_shoes_report_failure(self):
  a=np.zeros((200,200,4),np.uint8);_,r=fit_closed_shoes(a,a)
  self.assertTrue(all(not f['fitted'] for f in r['feet']))
 def test_long_garment_not_treated_as_shoes(self):
  a=np.zeros((200,200,4),np.uint8);a[100:199,30:170]=255
  b,r=fit_closed_shoes(a,a);self.assertTrue(np.array_equal(a,b));self.assertTrue(all(not f['fitted'] for f in r['feet']))
if __name__=='__main__':unittest.main()

