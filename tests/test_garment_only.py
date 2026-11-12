import sys,unittest,json,tempfile
from unittest.mock import patch
from pathlib import Path
import numpy as np,cv2
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from garment_only import fit_garment_only,warp_garment_rgba
from generated_outfit import prepare_outfit
class GarmentOnlyTests(unittest.TestCase):
 def test_strict_generation_rejects_hand_instead_of_removing_it(self):
  from garment_only import prepare_garment_only
  rgb,body=self.sample();rgb[690:725,240:265]=[235,175,145]
  labels=np.zeros(rgb.shape[:2],np.uint8);labels[690:725,240:265]=14
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png')
   (p/'request.json').write_text(json.dumps({'outfitSourcePolicy':'clothing-only-strict'}))
   (p/'opening-parsing').mkdir();np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   with patch('garment_only.fit_garment_only') as fit:
    with self.assertRaisesRegex(ValueError,'body parts'):prepare_garment_only(p,p/'body.png')
    fit.assert_not_called()
   self.assertFalse(json.loads((p/'source-validation.json').read_text())['accepted'])
   self.assertFalse((p/'outfit.png').exists());self.assertTrue(np.array_equal(np.array(Image.open(p/'image.png')),rgb))
 def test_strict_peach_fabric_reaches_fit_with_no_anatomy_erasure(self):
  from garment_only import prepare_garment_only
  rgb,body=self.sample();rgb[500:600,350:450]=[235,175,145]
  labels=np.zeros(rgb.shape[:2],np.uint8);labels[500:600,350:450]=4
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png')
   (p/'request.json').write_text(json.dumps({'outfitSourcePolicy':'clothing-only-strict'}))
   (p/'opening-parsing').mkdir();np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   with patch('garment_only.fit_garment_only',return_value=(np.dstack([rgb,np.full(rgb.shape[:2],255,np.uint8)]),{})) as fit:
    r=prepare_garment_only(p,p/'body.png')
    self.assertFalse(fit.call_args.args[2].any());self.assertEqual(r['opening_body_pixels_removed'],0)
   self.assertTrue(json.loads((p/'source-validation.json').read_text())['accepted'])
 def test_generated_neck_is_rejected_before_fitting_without_erasing_peach_fabric(self):
  from garment_only import prepare_garment_only
  rgb=np.full((1264,843,3),255,np.uint8);rgb[365:400,395:450]=[230,170,140]
  labels=np.zeros(rgb.shape[:2],np.uint8);labels[365:400,395:450]=11
  body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png')
   (p/'opening-parsing').mkdir();np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   with patch('garment_only.fit_garment_only') as fit:
    with self.assertRaisesRegex(ValueError,'generated neck'):prepare_garment_only(p,p/'body.png')
    fit.assert_not_called()
   self.assertFalse((p/'outfit.png').exists());self.assertTrue(np.array_equal(np.array(Image.open(p/'image.png')),rgb))
   labels[365:400,395:450]=4;np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   with patch('garment_only.fit_garment_only',return_value=(np.dstack([rgb,np.full(rgb.shape[:2],255,np.uint8)]),{})) as fit:
    prepare_garment_only(p,p/'body.png');fit.assert_called_once()
 def sample(self):
  body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
  rgb=np.full((1264,843,3),255,np.uint8)
  cv2.rectangle(rgb,(255,340),(590,900),(70,150,210),-1)
  for x in (325,445):cv2.rectangle(rgb,(x,1040),(x+75,1210),(20,35,70),-1)
  return rgb,body
 def test_keeps_whole_shoulders_and_covers_both_feet(self):
  rgb,body=self.sample();before=rgb.copy();out,r=fit_garment_only(rgb,body)
  self.assertTrue(np.array_equal(before,rgb));self.assertFalse(r['shoulder_erasure']);self.assertFalse(r['hair_mask_used'])
  self.assertEqual(out[410,300,3],255);self.assertEqual(out[410,540,3],255)
  self.assertTrue(all(f['foot_pixels_exposed_after']==0 for f in r['footwear']['feet']))
 def test_affine_keeps_light_edge_color_at_partial_alpha(self):
  a=np.zeros((40,40,4),np.uint8);a[5:35,5:35]=[210,225,240,255]
  out=warp_garment_rgba(a,np.array([[1,0,.4],[0,1,.4]],np.float32),(40,40))
  edge=(out[:,:,3]>20)&(out[:,:,3]<220)
  self.assertTrue(edge.any());self.assertLess(np.max(np.abs(out[:,:,:3][edge].astype(int)-[210,225,240])),3)
 def test_high_collar_fabric_is_not_cut_by_fixed_neck_polygon(self):
  rgb,body=self.sample();out,r=fit_garment_only(rgb,body,prompt='high collar dress')
  self.assertEqual(out[395,422,3],255);self.assertEqual(r['neck_cleanup_policy'],'generated-opening-only')
 def test_rejects_person_before_fitting(self):
  rgb,body=self.sample();rgb[100:300,350:490]=[240,190,160]
  with self.assertRaisesRegex(ValueError,'person'):fit_garment_only(rgb,body)
 def test_connected_bare_legs_removed_without_shoulder_cleanup(self):
  rgb,body=self.sample();labels=np.zeros(rgb.shape[:2],np.uint8)
  for x,c in [(325,13),(445,12)]:
   rgb[901:1040,x:x+75]=[250,220,200];labels[901:1040,x:x+75]=c
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png');(p/'opening-parsing').mkdir()
   np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels,probabilities=np.zeros((18,*labels.shape),np.float32))
   from garment_only import prepare_garment_only
   r=prepare_garment_only(p,p/'body.png');out=np.array(Image.open(p/'outfit.png'))
   self.assertGreater(r['opening_body_pixels_removed'],1000)
   self.assertEqual(out[410,300,3],255);self.assertEqual(out[410,540,3],255)
   self.assertTrue((out[950:1000,340:380,3]==0).all())
 def test_production_dispatch_uses_garment_fitter_without_parser_or_hair(self):
  rgb,body=self.sample()
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png')
   (p/'request.json').write_text(json.dumps({'outfitExtraction':'garment-only-body-guide'}),encoding='utf-8')
   r=prepare_outfit(p,p/'body.png');self.assertEqual(r['fit_version'],9);self.assertTrue((p/'outfit.png').is_file())

 def test_incomplete_footwear_reaches_review_with_warning_not_failure(self):
  rgb,body=self.sample()
  with patch('garment_only.fit_closed_shoes',side_effect=lambda rgba,body,**kw:(rgba,{'feet':[{'side':'left','fitted':False,'coverage_start_row':1040}]})):
   out,report=fit_garment_only(rgb,body)
  self.assertTrue(out[:,:,3].any())
  self.assertFalse(report['automatic_save_allowed'])
  self.assertFalse(report['fit_check_passed'])
  self.assertTrue(any('Socks or shoes' in warning for warning in report['fit_warnings']))
  self.assertFalse(report['shoulder_erasure'])

 def test_waist_skin_band_removed_without_erasing_peach_fabric_or_shoulders(self):
  rgb,body=self.sample();rgb[550:565,350:480]=[250,220,200];rgb[600:610,350:480]=[250,220,200]
  labels=np.zeros(rgb.shape[:2],np.uint8);labels[542:550,350:480]=4;labels[565:579,350:480]=5;labels[600:610,350:480]=4
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png');(p/'opening-parsing').mkdir();np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   from garment_only import prepare_garment_only
   report=prepare_garment_only(p,p/'body.png');out=np.array(Image.open(p/'outfit.png'))
   self.assertEqual(report['opening_body_pixels_removed'],1950)
   self.assertEqual(out[410,300,3],255)
   m=np.array(report['main_transform']);x,y=(m@np.array([415,605,1])).round().astype(int);self.assertGreater(out[y,x,3],220)

 def test_fit_only_preserves_fabric_without_calling_automatic_cleanup(self):
  rgb,body=self.sample()
  with patch('garment_only.refine_outfit_matte',side_effect=AssertionError('matte cleanup called')),patch('garment_only.clear_underarm_background',side_effect=AssertionError('underarm cleanup called')),patch('outfit_quality.clean_collar_insert',side_effect=AssertionError('collar cleanup called')),patch('outfit_quality.clean_opening_edges',side_effect=AssertionError('opening cleanup called')):
   out,report=fit_garment_only(rgb,body,cleanup=False)
  self.assertTrue(out[:,:,3].any());self.assertEqual(report['opening_cleanup']['cleanup_mode'],'fit-only');self.assertNotIn('cleanup',report['flow']);self.assertEqual(report['matte_edge_pixels_refined'],0)
