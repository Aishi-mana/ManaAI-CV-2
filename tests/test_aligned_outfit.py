import json
from pathlib import Path
import sys
import tempfile
import unittest
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from aligned_outfit import extract_aligned
from generated_outfit import prepare_outfit


class AlignedOutfitTests(unittest.TestCase):
    def sample(self):
        rgb=np.full((200,200,3),255,np.uint8)
        rgb[75:135,55:145]=[30,100,220]
        labels=np.zeros((200,200),np.uint8);labels[75:135,55:145]=4
        probabilities=np.zeros((18,200,200),np.float32)
        for label in (0,4): probabilities[label][labels==label]=1
        return rgb,labels,probabilities

    def test_keeps_source_position_instead_of_fitting_to_torso_box(self):
        rgb,labels,p=self.sample();original=rgb.copy()
        pixels,report=extract_aligned(rgb,labels,p,(200,200))
        ys,xs=np.where(pixels[:,:,3]>128)
        self.assertLessEqual(abs(xs.mean()-99.5),1)
        self.assertLessEqual(abs(ys.mean()-104.5),1)
        self.assertTrue(np.array_equal(rgb,original))
        self.assertFalse(report['automatic_save_allowed'])
        self.assertEqual(report['geometry'],'source-canvas-preserved')

    def test_aligned_dispatch_reuses_cached_parsing_without_model_or_generation(self):
        rgb,labels,p=self.sample()
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
            root=Path(folder);(root/'aligned-parsing').mkdir()
            np.savez_compressed(root/'aligned-parsing/parsing.npz',labels=labels,probabilities=p)
            Image.fromarray(rgb).save(root/'image.png')
            Image.new('RGBA',(200,200)).save(root/'body.png')
            Image.new('RGBA',(200,200)).save(root/'avatar-front-hair.png')
            (root/'request.json').write_text(json.dumps({'outfitExtraction':'aligned-avatar','reference':'cached-test-reference'}),encoding='utf-8')
            report=prepare_outfit(root,root/'body.png')
            self.assertEqual(report['fit_version'],6)
            self.assertEqual(report['source'],'local-avatar-redesign')
            self.assertTrue(report['front_hair_protection_used'])
            self.assertTrue((root/'outfit.png').is_file())

    def test_front_hair_never_copies_source_hair_or_skin_into_clothing(self):
        rgb,labels,p=self.sample()
        # Hair interrupts a shoulder; the separate front layer will cover it.
        rgb[75:110,65:75]=[190,190,200];labels[75:110,65:75]=2
        # The exposed neckline has no front hair and must remain transparent.
        rgb[75:95,90:110]=[245,195,170];labels[75:95,90:110]=11
        p[:]=0
        for label in (0,2,4,11):p[label][labels==label]=1
        front=np.zeros((200,200),np.uint8);front[75:110,65:75]=255
        baseline,_=extract_aligned(rgb,labels,p,(200,200))
        result,report=extract_aligned(rgb,labels,p,(200,200),front)
        self.assertEqual(baseline[90,70,3],0)
        self.assertEqual(result[90,70,3],0)
        self.assertEqual(result[82,100,3],0)
        self.assertEqual(report['hidden_gap_pixels'],0)
        self.assertFalse(report['shoulder_completion'])
        self.assertEqual(report['protected_source_pixels'],0)
        self.assertTrue(np.array_equal(baseline[140:],result[140:]))
        # Only the shoulder band can be completed; central neck and all lower
        # clothing remain byte-identical, with no raw source hair copied.
        self.assertTrue(np.array_equal(result[:,90:110],baseline[:,90:110]))
        self.assertTrue(np.array_equal(result[100:],baseline[100:]))

    def test_front_hair_canvas_mismatch_rejected(self):
        rgb,labels,p=self.sample()
        with self.assertRaisesRegex(ValueError,'must match'):
            extract_aligned(rgb,labels,p,(200,200),np.zeros((50,50),np.uint8))

    def test_protection_does_not_add_source_head_above_garment(self):
        rgb,labels,p=self.sample();rgb[10:60,70:130]=[190,190,200]
        front=np.zeros((200,200),np.uint8);front[10:60,70:130]=255
        result,report=extract_aligned(rgb,labels,p,(200,200),front)
        self.assertTrue((result[10:60,70:130,3]==0).all())
        self.assertEqual(report['protected_source_pixels'],0)

    def test_missing_avatar_reference_fails_before_extraction(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
            root=Path(folder)
            (root/'request.json').write_text('{"outfitExtraction":"aligned-avatar"}',encoding='utf-8')
            with self.assertRaisesRegex(ValueError,'avatar reference'):
                prepare_outfit(root,root/'missing-body.png')


if __name__=='__main__':unittest.main()
