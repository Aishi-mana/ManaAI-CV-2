import sys,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
from clothing_footwear import extract_closed_footwear
from clothing_fit import fit_closed_shoes
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'complete-shoes-neck-shoulders-verified';out.mkdir(exist_ok=False);size=(843,1264)
a=np.array(Image.open(r/'shoe-neck-review/clothing.png').convert('RGBA'));before=a.copy();rgb=np.array(Image.open(r/'image.png').convert('RGB').resize(size,Image.Resampling.LANCZOS));body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'));front=np.array(Image.open('assets/avatar/hairstyles/default/hair_front.png'))[:,:,3];yy,xx=np.indices(a.shape[:2])
# Replace footwear from the untouched source; no shoe erasing/opening operation.
a[yy>=1028]=0
for x0,x1 in [(305,411),(429,530)]:
 shoe=extract_closed_footwear(rgb[1039:1210,x0:x1]);a[1039:1210,x0:x1]=shoe
# Remove only collar pixels overlapping the original narrow neck silhouette.
right_edge=np.interp(yy,[350,375,390,410],[450,452,456,450])
neck=(yy>=350)&(yy<=410)&(xx>420)&(xx<=right_edge)&(a[:,:,3]>0)
a[neck]=0
# Fill small garment gaps beneath front hair. Infer colors from adjacent blue cloth,
# not the source hair pixels. Shoulders stay behind the separate front-hair layer.
hsv=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2HSV)
cloth=(a[:,:,3]>220)&(hsv[:,:,0]>90)&(hsv[:,:,0]<130)&(hsv[:,:,1]>90)
near=cv2.dilate((a[:,:,3]>128).astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25))).astype(bool)
shoulder=(front>220)&(yy>402)&(yy<570)&((xx<355)|(xx>490))&near&(a[:,:,3]<220)
_,indices=cv2.distanceTransformWithLabels((~cloth).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
palette=np.zeros((int(indices.max())+1,3),np.uint8);palette[indices[cloth]]=a[:,:,:3][cloth]
a[:,:,:3][shoulder]=palette[indices[shoulder]];a[:,:,3][shoulder]=255
# Only the newly extracted complete footwear is transformed to cover the body feet.
a,fit=fit_closed_shoes(a,body);a[a[:,:,3]==0]=0
Image.fromarray(a).save(out/'clothing.png')
assets=Path('assets/avatar');canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
for name,box,res in [('neck',(330,325,520,490),(760,660)),('shoes',(295,1005,540,1230),(735,675)),('shoulders',(230,350,625,600),(790,500))]:canvas.crop(box).resize(res).convert('RGB').save(out/(name+'.jpg'),quality=95)
report={'complete_source_footwear':True,'shoe_erosion_used':False,'neck_overlap_pixels_removed':int(neck.sum()),'hidden_shoulder_pixels_filled':int(shoulder.sum()),'fit':fit,'prototype_specific':True,'wardrobe_saved':False}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))

