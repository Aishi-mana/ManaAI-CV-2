import sys,unittest,tempfile,json
from pathlib import Path
import numpy as np,cv2
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from generated_outfit import remove_outer_background,fit_generated_outfit,prepare_outfit
class GeneratedOutfitTests(unittest.TestCase):
 def sample(self):
  rgb=np.full((600,400,3),255,np.uint8);cv2.rectangle(rgb,(100,100),(300,350),(40,140,220),-1);cv2.rectangle(rgb,(170,150),(230,220),(250,250,250),-1)
  for x in (130,240):cv2.rectangle(rgb,(x,470),(x+35,560),(20,30,80),-1)
  return rgb
 def test_preserves_white_fabric_and_removes_exterior(self):
  a=remove_outer_background(self.sample());self.assertEqual(a[180,200,3],255);self.assertEqual(a[0,0,3],0);self.assertTrue((a[a[:,:,3]==0]==0).all())
 def test_blank_background_rejected(self):
  with self.assertRaises(ValueError):remove_outer_background(np.full((200,200,3),255,np.uint8))
 def test_fits_complete_outfit_to_body_canvas(self):
  body=np.zeros((600,400,4),np.uint8);body[450:575,125:170]=[240,200,180,255];body[450:575,235:280]=[240,200,180,255]
  pixels,r=fit_generated_outfit(remove_outer_background(self.sample()),body)
  self.assertEqual(pixels.shape,body.shape);self.assertTrue(r['initial_fit']);self.assertEqual(len(r['footwear']['feet']),2);self.assertTrue((pixels[pixels[:,:,3]==0]==0).all())
 def test_connected_trousers_and_shoes_are_not_shrunk_into_torso(self):
  rgb=np.full((600,400,3),255,np.uint8);cv2.rectangle(rgb,(85,30),(315,295),(40,140,220),-1)
  for x in (130,235):cv2.rectangle(rgb,(x,290),(x+40,580),(20,30,80),-1)
  body=np.zeros((600,400,4),np.uint8);body[380:580,133:167]=[240,200,180,255];body[380:580,238:272]=[240,200,180,255]
  a,r=fit_generated_outfit(remove_outer_background(rgb),body)
  self.assertEqual(r['layout'],'connected-full-outfit');self.assertTrue((a[560:,:,3]>0).any());self.assertTrue((a[180:350,:,3]>0).any())
  self.assertEqual(len(r['footwear']['feet']),2);self.assertTrue(all(f['fitted'] for f in r['footwear']['feet']));self.assertEqual(r['fit_version'],2)
 def test_tall_single_garment_without_leg_layout_is_rejected_instead_of_tiny_fit(self):
  rgb=np.full((600,400,3),255,np.uint8);rgb[20:580,100:300]=[40,140,220];body=np.zeros((600,400,4),np.uint8)
  with self.assertRaisesRegex(ValueError,'manual alignment'):fit_generated_outfit(remove_outer_background(rgb),body)
 def test_production_outputs_png_and_matching_report(self):
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as d:
   root=Path(d);Image.fromarray(self.sample()).save(root/'image.png');body=np.zeros((600,400,4),np.uint8);Image.fromarray(body).save(root/'body.png')
   r=prepare_outfit(root,root/'body.png');im=Image.open(root/'outfit.png');self.assertEqual(im.mode,'RGBA');self.assertEqual(im.size,(r['width'],r['height']));self.assertEqual(json.loads((root/'outfit-report.json').read_text())['source'],'local-outfit-generation');im.close()
if __name__=='__main__':unittest.main()
