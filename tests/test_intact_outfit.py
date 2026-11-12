import json
from pathlib import Path
import sys,tempfile,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from generated_outfit import prepare_outfit
from intact_outfit import fit_neck_opening


class IntactOutfitTests(unittest.TestCase):
    def test_neck_opening_exposes_skin_without_cutting_shoulder_fabric(self):
        outfit=np.zeros((300,200,4),np.uint8);outfit[78:200,45:155]=[30,100,220,255]
        template=outfit.copy();template[78:102,90:110]=0
        body=np.zeros_like(outfit);body[75:80,75:125]=[240,190,160,255]
        body[80:96,90:110]=[240,190,160,255];body[96:200,60:140]=[240,190,160,255]
        original=body.copy();result,report=fit_neck_opening(outfit,template,body)
        self.assertTrue(report['available']);self.assertGreater(report['changed_pixels'],0)
        self.assertEqual(result[88,100,3],0)
        x0,_,x1,_=report['neck_bounds']
        self.assertTrue(np.array_equal(outfit[:,:x0],result[:,:x0]))
        self.assertTrue(np.array_equal(outfit[:,x1:],result[:,x1:]))
        self.assertTrue(np.array_equal(body,original))

    def test_regeneration_dispatch_keeps_solid_shoulders_without_semantic_cleanup(self):
        rgb=np.full((300,200,3),255,np.uint8)
        rgb[30:170,40:160]=[30,100,220]
        for x in (60,120):rgb[250:285,x:x+20]=[20,30,70]
        target=np.zeros((300,200,4),np.uint8)
        target[100:200,55:145]=[30,100,220,255]
        for x in (60,120):target[250:285,x:x+20]=[20,30,70,255]
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
            root=Path(folder)
            Image.fromarray(rgb).save(root/'image.png')
            Image.fromarray(target).save(root/'outfit-fit-template.png')
            (root/'request.json').write_text(json.dumps({'outfitExtraction':'intact-garment'}),encoding='utf-8')
            # No body, parser cache, or hair mask: this route must not erase them.
            report=prepare_outfit(root,root/'not-needed.png')
            result=np.array(Image.open(root/'outfit.png'))
            self.assertEqual(report['fit_version'],4)
            self.assertFalse(report['semantic_cleanup'])
            self.assertFalse(report['shoulder_erasure'])
            self.assertTrue((result[103:112,65:135,3]==255).all())
            self.assertTrue((result[275,62:77,3]==255).all())


if __name__=='__main__':unittest.main()
