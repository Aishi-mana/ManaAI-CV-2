import sys,json
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
from aligned_outfit import extract_aligned
from shoulder_fabric import complete_shoulders
from clothing_fit import fit_closed_shoes
s=Path('exports/images/image-1792972899187697700');p=Path('exports/images/shoulder-only-production-test-20261026');raw=np.array(Image.open(s/'image.png').convert('RGB'));d=np.load(s/'aligned-parsing/parsing.npz');f=np.array(Image.open(s/'avatar-front-hair.png'))[:,:,3]
b,r=extract_aligned(raw,d['labels'],d['probabilities'],(843,1264),f)
a,_=extract_aligned(raw,d['labels'],d['probabilities'],(843,1264),None)
# Apply the same clean-alpha protection that ran before shoulder completion.
import cv2
garment=cv2.resize(np.isin(d['labels'],[4,5,6,7,8]).astype(np.uint8),(843,1264),interpolation=cv2.INTER_NEAREST)>0
from clothing_refine import refine
alpha,_=refine(raw,d['labels'],d['probabilities']);clean=cv2.resize((alpha>128).astype(np.uint8),(843,1264),interpolation=cv2.INTER_NEAREST)>0
a[:,:,3][garment&clean&(f>240)]=255
changed=np.any(a!=b,axis=2);ys,xs=np.where(changed)
assert np.array_equal(a[500:],b[500:]),'Changed lower outfit fit'
assert np.array_equal(a[:,380:450],b[:,380:450]),'Changed neckline'
body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
b,_=fit_closed_shoes(b,body);a,_=fit_closed_shoes(a,body)
assert np.array_equal(a[500:],b[500:]),'Changed original footwear fitting'
Image.fromarray(b).save(p/'outfit.png');Image.fromarray(a).save(p/'baseline.png')
r['verification']={'changed_pixels':int(changed.sum()),'bounds':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'lower_outfit_and_footwear_byte_identical':True,'central_neckline_byte_identical':True,'new_generations':0,'saved_outfits_changed':False}
bg=Image.new('RGBA',(843,1264),'#ddd9e5');bg.alpha_composite(Image.fromarray(b));bg.convert('RGB').crop((230,330,630,620)).resize((800,580)).save(p/'shoulders.jpg')
assets=Path('assets/avatar');bg=Image.new('RGBA',(843,1264),'#ddd9e5')
for fn in ['hairstyles/default/hair_back.png','base/body.png',None,'mouth/mouth_neutral.png','eyes/eye_neutral.png','hairstyles/default/hair_front.png','hairstyles/default/hair_ahoge.png']:bg.alpha_composite(Image.fromarray(b) if fn is None else Image.open(assets/fn).convert('RGBA'))
bg.convert('RGB').save(p/'on-mana.jpg',quality=95)
(p/'report.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(r['verification'])
