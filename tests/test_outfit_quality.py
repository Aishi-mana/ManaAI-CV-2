import sys,unittest
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from outfit_quality import broader_fit_checks,clean_opening_edges,clean_collar_insert
class OutfitQualityTests(unittest.TestCase):
 def test_rear_collar_rim_is_hidden_only_where_real_neck_occludes_it(self):
  a=np.zeros((100,100,4),np.uint8);a[20:40,30:70]=[245,245,245,255]
  a[23:29,38:62]=[185,185,195,255];a[22,38:62]=[25,30,40,255]
  body=np.zeros_like(a);body[10:24,43:57]=[245,210,180,255];before=a.copy();original_body=body.copy()
  out,r=clean_collar_insert(a,[40,10,60,30],body=body)
  self.assertGreater(r['rear_collar_pixels_occluded_by_neck'],0)
  self.assertTrue((out[22,43:57,3]==0).all());self.assertTrue(np.array_equal(out[22,38:40],a[22,38:40]))
  self.assertTrue(np.array_equal(a,before));self.assertTrue(np.array_equal(body,original_body))
 def test_grey_hollow_collar_above_lower_edge_cleared_with_rim_preserved(self):
  a=np.zeros((100,100,4),np.uint8)
  a[20:40,30:70]=[245,245,245,255];a[23:29,38:62]=[185,185,195,255]
  a[22,38:62]=[25,30,40,255]
  before=a.copy();out,r=clean_collar_insert(a,[40,10,60,30])
  self.assertGreater(r.get('neutral_collar_hole_pixels_removed',0),0)
  self.assertEqual(out[25,50,3],0)
  self.assertTrue(np.array_equal(out[22],before[22]));self.assertTrue(np.array_equal(out[30:],before[30:]))
  a[29:40,38:62]=[185,185,195,255]
  out,r=clean_collar_insert(a,[40,10,60,30])
  self.assertEqual(r.get('neutral_collar_hole_pixels_removed',0),0)
 def setUp(self):self.body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'));self.h,self.w=self.body.shape[:2];self.neck=[390,350,452,415]
 def test_long_sleeve_and_cuff_gaps_detected_but_short_sleeves_allowed(self):
  rgba=np.zeros_like(self.body);rgba[390:900,310:534]=[50,120,180,255];rgba[390:450,:390]=0;rgba[390:450,452:]=0
  checks,warnings=broader_fit_checks(rgba,self.body,self.neck,'long sleeves')
  self.assertFalse(checks['left_sleeve']['passed']);self.assertTrue(any('cuff' in w for w in warnings));self.assertTrue(any('shoulder' in w for w in warnings))
  checks,_=broader_fit_checks(rgba,self.body,self.neck,'short sleeves');self.assertFalse(checks['left_sleeve']['required']);self.assertTrue(checks['left_sleeve']['passed'])
 def test_covered_shoulders_and_long_sleeves_pass_without_modification(self):
  rgba=np.zeros_like(self.body);rgba[350:710,:,3]=255;rgba[350:710,:,:3]=[40,120,200];before=rgba.copy();checks,warnings=broader_fit_checks(rgba,self.body,self.neck,'long sleeves')
  self.assertTrue(checks['left_shoulder']['passed']);self.assertTrue(checks['right_sleeve']['passed']);self.assertFalse(warnings);self.assertTrue(np.array_equal(before,rgba))
 def test_cuffs_covering_hands_are_flagged(self):
  rgba=np.zeros_like(self.body);rgba[350:800,:,3]=255;rgba[350:800,:,:3]=[40,120,200]
  checks,warnings=broader_fit_checks(rgba,self.body,self.neck,'long sleeves')
  self.assertTrue(any('extend over the hand' in w for w in warnings));self.assertFalse(checks['left_sleeve']['passed'])
 def test_opening_cleanup_is_local_and_preserves_hair_hidden_pixels_and_coverage(self):
  rgba=np.zeros_like(self.body)
  points=[(390,410),(390,412),(410,320),(1049,350),(1057,350)]
  for y,x in points:rgba[y,x]=self.body[y,x]
  rgba[390,414]=[240,240,240,255]
  protected=np.zeros((self.h,self.w),bool);protected[390,412]=True;coverage=np.zeros_like(protected);coverage[1057,350]=True
  out,r=clean_opening_edges(rgba,self.body,self.neck,{'feet':[{'side':'left','coverage_start_row':1055}]},protected,coverage)
  self.assertEqual(out[390,410,3],0);self.assertEqual(out[1049,350,3],0)
  for y,x in [(390,412),(410,320),(1057,350),(390,414)]:self.assertTrue(np.array_equal(out[y,x],rgba[y,x]))
  self.assertEqual(r['shoulder_pixels_modified'],0)
 def test_dark_collar_insert_removed_but_fabric_lower_outline_and_protected_pixels_kept(self):
  a=np.zeros((100,100,4),np.uint8);a[31:37,37:63]=[65,117,102,255]
  a[37:38,37:63]=[20,30,25,255];a[38:60,35:65]=[138,227,188,255]
  a[30,42:46]=[20,30,25,255]
  protected=np.zeros((100,100),bool);protected[32,43]=True
  before=a.copy();out,r=clean_collar_insert(a,[40,10,60,30],protected)
  self.assertGreater(r['dark_collar_fill_pixels_removed'],0);self.assertEqual(out[32,50,3],0)
  self.assertTrue(((out[:,:,3]>0)&(out[:,:,3]<255)).any());self.assertTrue(np.array_equal(out[30,43],a[30,43]));self.assertTrue(np.array_equal(out[37:],a[37:]));self.assertTrue(np.array_equal(out[32,43],a[32,43]))
  self.assertTrue(np.array_equal(a,before))
 def test_enclosed_collar_fill_uses_original_curved_outline(self):
  a=np.zeros((100,100,4),np.uint8);a[28:60,35:65]=[138,227,188,255]
  a[30:38,37:63]=[20,30,25,255];a[31:37,38:62]=[65,117,102,255];a[33:35,48:52]=[245,245,245,255]
  out,r=clean_collar_insert(a,[40,10,60,30]);self.assertGreater(r['dark_collar_fill_pixels_removed'],0)
  self.assertEqual(out[34,50,3],0);self.assertTrue(np.array_equal(out[30,45],a[30,45]))
 def test_dark_garment_continuing_below_collar_is_not_treated_as_insert(self):
  a=np.zeros((100,100,4),np.uint8);a[31:60,40:60]=[40,70,110,255]
  out,r=clean_collar_insert(a,[45,10,55,30]);self.assertEqual(r['dark_collar_fill_pixels_removed'],0);self.assertTrue(np.array_equal(a,out))
if __name__=='__main__':unittest.main()
