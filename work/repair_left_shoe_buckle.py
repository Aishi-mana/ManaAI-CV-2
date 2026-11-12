from pathlib import Path
import numpy as np,cv2,json
from PIL import Image
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'shoe-neck-review';size=(843,1264)
a=np.array(Image.open(r/'sock-details-restored-v2/clothing.png').convert('RGBA'));original=a.copy();rgb=np.array(Image.open(r/'image.png').convert('RGB').resize(size,Image.Resampling.LANCZOS))
ref=np.array(Image.open(r/'refined/clothing.png').convert('RGBA').resize(size,Image.Resampling.LANCZOS));yy,xx=np.indices(a.shape[:2])
# Restore the original left shoe buckle in the same coordinates as the fitted shoe.
region=(xx<421)&(yy>int(1264*.78))&(ref[:,:,3]>0)
y,x=np.where(region);cx=(x.min()+x.max())/2;y0=y.min()
matrix=np.array([[1.16,0,cx*(1-1.16)],[0,1.04,y0*(1-1.04)]],np.float32)
hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
shoe=(xx<421)&(yy>1085)&(yy<1210)&((hsv[:,:,2]<175)|((hsv[:,:,1]>70)&(hsv[:,:,2]<220)))
contours,_=cv2.findContours(shoe.astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
mask=np.zeros(shoe.shape,np.uint8);cv2.drawContours(mask,[max(contours,key=cv2.contourArea)],-1,255,cv2.FILLED)
source=np.dstack([rgb,mask]);source[mask==0]=0
premul=source.astype(np.float32)/255;premul[:,:,:3]*=premul[:,:,3:4]
warped=cv2.warpAffine(premul,matrix,size);alpha=warped[:,:,3:4]
colors=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>0)
# Patch only the damaged buckle region, leaving the rest of the fitted shoes intact.
patch=(xx>300)&(xx<345)&(yy>1104)&(yy<1140)&(alpha[:,:,0]>.1)
for c in range(3):a[:,:,c][patch]=np.clip(colors[:,:,c][patch]*255,0,255).astype(np.uint8)
a[:,:,3][patch]=np.maximum(a[:,:,3][patch],(alpha[:,:,0][patch]*255).astype(np.uint8))
a[a[:,:,3]==0]=0
Image.fromarray(a).save(out/'clothing.png')
assets=Path('assets/avatar');canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
canvas.crop((295,1070,535,1230)).resize((840,560)).convert('RGB').save(out/'shoes-after.jpg',quality=95)
canvas.crop((330,325,520,490)).resize((760,660)).convert('RGB').save(out/'neck-zoom.jpg',quality=95)
report={'left_shoe_source_pixels_restored':int(patch.sum()),'neck_pixels_changed':int(np.any(a[:1000]!=original[:1000],axis=2).sum()),'outside_buckle_unchanged':bool(np.array_equal(a[~patch],original[~patch])),'transparent_rgb_zero':bool((a[a[:,:,3]==0]==0).all()),'wardrobe_saved':False}
assert report['outside_buckle_unchanged'] and report['neck_pixels_changed']==0 and report['transparent_rgb_zero']
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))

