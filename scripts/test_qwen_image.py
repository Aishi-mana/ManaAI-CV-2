import base64,io,unittest
from PIL import Image
from qwen_image import avatar_reference
class AvatarInput(unittest.TestCase):
    def test_prepared_snapshot_decodes_without_files_or_gpu(self):
        data=io.BytesIO();Image.new('RGB',(32,48),(50,90,120)).save(data,format='JPEG')
        image=avatar_reference('data:image/jpeg;base64,'+base64.b64encode(data.getvalue()).decode())
        self.assertEqual(image.size,(32,48));self.assertEqual(image.mode,'RGB');image.close()
    def test_invalid_reference_is_rejected_before_model_loading(self):
        for value in ['https://example/image.jpg','data:image/jpeg;base64,!!!','x'*1000001]:
            with self.assertRaises(Exception):avatar_reference(value)
        data=io.BytesIO();Image.new('RGB',(1296,16)).save(data,format='JPEG')
        with self.assertRaises(ValueError):avatar_reference('data:image/jpeg;base64,'+base64.b64encode(data.getvalue()).decode())
if __name__=='__main__':unittest.main()
