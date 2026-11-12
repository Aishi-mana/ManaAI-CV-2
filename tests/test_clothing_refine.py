import sys,unittest,tempfile
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from clothing_refine import refine,remove_small,fit_audit,run
class ClothingRefinementTests(unittest.TestCase):
 def scene(self):
  rgb=np.full((100,100,3),255,np.uint8);labels=np.zeros((100,100),np.uint8);labels[20:80,20:80]=4;rgb[20:80,20:80]=[240,240,245]
  probs=np.zeros((18,100,100),np.float32)
  for c in range(18):probs[c]=labels==c
  return rgb,labels,probs
 def test_removes_only_small_disconnected_components(self):
  m=np.zeros((20,20),bool);m[2:12,2:12]=True;m[18,18]=True
  self.assertEqual(remove_small(m,10).sum(),100)
 def test_pale_fabric_retained_and_alpha_not_expanded(self):
  rgb,l,p=self.scene();a,r=refine(rgb,l,p)
  self.assertTrue((a[l==0]==0).all());self.assertEqual(a[50,50],255);self.assertTrue((a[l==4]>0).all());self.assertTrue(r['review_required']);self.assertTrue(r['color_cleanup_skipped_for_pale_fabric'])
 def test_shoe_wisps_removed_straps_and_soles_preserved(self):
  rgb,l,p=self.scene();l[:]=0;l[20:60,20:30]=9;l[65:80,18:45]=9;l[40:70,42]=9
  rgb[:]=255;rgb[l==9]=[170,110,210]
  for c in range(18):p[c]=l==c
  a,r=refine(rgb,l,p)
  self.assertEqual(a[50,42],0);self.assertEqual(a[35,25],255);self.assertEqual(a[72,30],255)
  self.assertGreater(r['shoe_wisp_pixels_removed'],0)
 def test_front_hair_protects_garment_from_hair_color_trimming(self):
  from unittest.mock import patch
  rgb,l,p=self.scene();rgb[l==4]=[40,130,220];protect=np.zeros(l.shape,bool);protect[20:28,20:80]=True
  far=np.full(l.shape,999,np.float32);near=np.zeros(l.shape,np.float32)
  with patch('clothing_refine.palette_distance',side_effect=[far,near,far]):a,_=refine(rgb,l,p,protect)
  self.assertGreater(a[22,50],0);self.assertEqual(a[77,50],0)
 def test_misclassified_silver_hair_removed_but_blue_cloth_and_white_tie_retained(self):
  rgb,l,p=self.scene();rgb[l==4]=[100,170,220]
  rgb[25:35,25:35]=[149,146,163];p[4,25:35,25:35]=.52;p[2,25:35,25:35]=.44
  rgb[40:55,40:55]=[242,241,241]
  a,_=refine(rgb,l,p)
  self.assertEqual(a[30,30],0);self.assertEqual(a[50,50],255);self.assertEqual(a[60,60],255)
 def test_front_hair_guard_retains_only_confident_cloth_without_repainting(self):
  rgb,l,p=self.scene();rgb[l==4]=[40,130,220];mask=l==4
  rgb[20:30,20:30]=[190,190,200];l[20:30,20:30]=2
  p[:]=0
  for c in range(18):p[c]=l==c
  before=rgb.copy();a,_=refine(rgb,l,p,mask)
  self.assertTrue((a[(l==4)&mask]==255).all())
  self.assertTrue((a[l==2]==0).all());self.assertTrue(np.array_equal(rgb,before))
 def test_front_hair_mask_requires_matching_dimensions(self):
  rgb,l,p=self.scene()
  with self.assertRaises(ValueError):refine(rgb,l,p,np.zeros((2,2),bool))
 def test_invalid_dimensions_rejected(self):
  rgb,l,p=self.scene()
  with self.assertRaises(ValueError):refine(rgb,l[:5],p)
 def test_identical_regions_pass_shift_fails_missing_fails(self):
  l=np.zeros((200,200),np.uint8)
  for i,c in enumerate(range(11,16)):l[20:40,10+i*30:25+i*30]=c
  self.assertTrue(fit_audit(l,l)['alignment_pass'])
  self.assertFalse(fit_audit(l,np.roll(l,20,axis=0))['alignment_pass'])
  self.assertFalse(fit_audit(l,np.zeros_like(l))['alignment_pass'])
 def test_export_zeroes_hidden_rgb_and_blocks_auto_save(self):
  rgb,l,p=self.scene()
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/"work") as d:
   root=Path(d);Image.fromarray(rgb).save(root/'image.png');np.savez(root/'parse.npz',labels=l,probabilities=p)
   r=run(root/'image.png',root/'parse.npz',root/'out');a=np.array(Image.open(root/'out/clothing.png'))
   self.assertTrue((a[a[:,:,3]==0]==0).all());self.assertFalse(r['automatic_save_allowed'])
if __name__=='__main__':unittest.main()

