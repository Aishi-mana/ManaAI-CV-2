from pathlib import Path
import numpy as np,cv2,json
from PIL import Image
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'collar-shoulder-restored';out.mkdir(exist_ok=False);size=(843,1264)
a=np.array(Image.open(r/'complete-shoes-neck-shoulders-verified/clothing.png').convert('RGBA'));approved=a.copy();previous=np.array(Image.open(r/'shoe-neck-review/clothing.png').convert('RGBA'));front=np.array(Image.open('assets/avatar/hairstyles/default/hair_front.png'))[:,:,3];yy,xx=np.indices(a.shape[:2])
old_edge=np.interp(yy,[350,375,390,410],[450,452,456,450]);new_edge=np.interp(yy,[350,375,390,410],[449,451,454,448])
restore=(yy>=350)&(yy<=410)&(xx>new_edge)&(xx<=old_edge)&(xx>420)&(previous[:,:,3]>0)
a[restore]=previous[restore]
# Restore source garment pixels under front hair first, then bridge hidden gaps
# using adjacent fabric colors. These remain below the front-hair layer.
raw=np.array(Image.open(r/'parsed/clothing.png').convert('RGBA').resize(size,Image.Resampling.LANCZOS))
covered=(front>240)&(yy>390)&(yy<595)&((xx<380)|(xx>465))
source_restore=covered&(raw[:,:,3]>128)
a[source_restore]=raw[source_restore]
hsv=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2HSV)
cloth=(a[:,:,3]>220)&(hsv[:,:,0]>90)&(hsv[:,:,0]<130)&(hsv[:,:,1]>90)
near=cv2.dilate(cloth.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45))).astype(bool)
fill=covered&near&(a[:,:,3]<220)
_,indices=cv2.distanceTransformWithLabels((~cloth).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
palette=np.zeros((int(indices.max())+1,3),np.uint8);palette[indices[cloth]]=a[:,:,:3][cloth]
a[:,:,:3][fill]=palette[indices[fill]];a[:,:,3][fill]=255
a[a[:,:,3]==0]=0
assert np.array_equal(a[1028:],approved[1028:])
Image.fromarray(a).save(out/'clothing.png')
assets=Path('assets/avatar');canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
for name,box,res in [('neck',(330,325,520,490),(760,660)),('shoulders',(230,350,625,600),(790,500))]:canvas.crop(box).resize(res).convert('RGB').save(out/(name+'.jpg'),quality=95)
report={'collar_pixels_restored':int(restore.sum()),'covered_source_pixels_restored':int(source_restore.sum()),'hidden_shoulder_gap_pixels_filled':int(fill.sum()),'approved_footwear_byte_identical':True,'wardrobe_saved':False,'prototype_specific':True}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
