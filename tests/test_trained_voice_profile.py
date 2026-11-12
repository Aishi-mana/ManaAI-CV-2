import hashlib,json,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from trained_voice import trained_voice_profile,MODEL_RELATIVE
from singing_job import conversion_profile

class TrainedProfileTests(unittest.TestCase):
    def test_mousey_is_pinned_separately_and_unknown_profiles_fail(self):
        from trained_voice import PROFILES
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder:
            root=Path(folder)
            relative,dataset,_,_=PROFILES['mousey-trained-v2']
            model=root/relative
            model.parent.mkdir(parents=True)
            model.write_bytes(b'mousey-fixture')
            manifest=root/f'data/custom-voice/{dataset}/approved-candidate.json'
            manifest.parent.mkdir(parents=True)
            manifest.write_text(json.dumps(dict(epoch=50,modelSha256=hashlib.sha256(model.read_bytes()).hexdigest())))
            profile=conversion_profile(dict(trained_voice=True,data_root=str(root),voice_profile='mousey-trained-v2'))
            self.assertEqual(profile['profileId'],'mousey-trained-v2')
            self.assertEqual(profile['model'],str(model))
            with self.assertRaises(ValueError): trained_voice_profile(root,'unknown')
            model.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'approved Mousey voice model changed'):
                trained_voice_profile(root,'mousey-trained-v2')
    def test_only_pinned_model_contents_are_accepted(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as folder:
            root=Path(folder)
            model=root/MODEL_RELATIVE
            model.parent.mkdir(parents=True)
            model.write_bytes(b'approved-fixture')
            manifest=root/'data/custom-voice/mana-current-rvc-trial-v1/approved-candidate.json'
            manifest.parent.mkdir(parents=True)
            manifest.write_text(json.dumps(dict(epoch=50,modelSha256=hashlib.sha256(model.read_bytes()).hexdigest())))
            profile=conversion_profile(dict(trained_voice=True,data_root=str(root)))
            self.assertEqual(profile['engine'],'mana-trained-rvc-v1')
            self.assertFalse(profile['pitchSmoothing'])
            self.assertEqual(profile['device'],'cpu')
            model.write_bytes(b'unapproved-replacement')
            with self.assertRaisesRegex(ValueError,'approved Mana voice model changed'):
                trained_voice_profile(root)

if __name__=='__main__': unittest.main()
