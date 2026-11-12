import json,sys
from pathlib import Path
import numpy as np,cv2
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts')
from clothing_edges import polish_edges
from clothing_fit import fit_closed_shoes
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'layer-aware-cleanup-final';out.mkdir(exist_ok=False)
size=(843,1264);a=np.array(Image.open(r/'edge-polish/clothing.png').convert('RGBA'));body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
raw=np.array(Image.open(r/'parsed/clothing.png').convert('RGBA').resize(size,Image.Resampling.LANCZOS))
front=np.array(Image.open('assets/avatar/hairstyles/default/hair_front.png').convert('RGBA'))[:,:,3]
yy,xx=np.indices(a.shape[:2]);protected=(front>200)&(yy>350)&(yy<610)&(raw[:,:,3]>128)
# Restore source garment pixels under front hair instead of trimming shoulder holes.
a[protected]=raw[protected]
rgb=a[:,:,:3];hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
# Neck skin leftovers, restricted to the central collar opening.
neck=(yy>350)&(yy<435)&(xx>365)&(xx<475)&(hsv[:,:,0]<25)&(hsv[:,:,1]>30)&(hsv[:,:,2]>100)&(a[:,:,3]>0)
a[neck]=0
# Silver hair remnants beside the blue skirt; never apply to the white bow or shoulders.
fringe=(yy>600)&(yy<820)&((xx<330)|(xx>510))&(a[:,:,3]>0)&(hsv[:,:,1]<60)
a[fringe]=0
# Rebuild only the white sock fabric to follow the unchanged lower legs.
# Navy straps, buckles and shoes remain the generated pixels above this fabric.
sock_reports=[]
for side,half in [('left',xx<421),('right',xx>=421)]:
 foot=(a[:,:,3]>128)&half&(yy>1000);ys,xs=np.where(foot);top=int(ys.min())
 navy=foot&(hsv[:,:,0]>95)&(hsv[:,:,0]<140)&(hsv[:,:,1]>80)&(hsv[:,:,2]<140)
 counts=navy.sum(axis=1);rows=np.where(counts>15)[0];bottom=int(rows.min()+10)
 zone=half&(yy>=top)&(yy<=bottom)
 target=cv2.dilate((body[:,:,3]>128).astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))).astype(bool)&zone
 preserve_navy=zone&(hsv[:,:,1]>70)&(hsv[:,:,2]<160)&(a[:,:,3]>0)
 saved=a.copy();a[zone]=0
 dist=cv2.distanceTransform(target.astype(np.uint8),cv2.DIST_L2,5)
 shade=np.clip(250-np.maximum(0,4-dist)*5,228,250).astype(np.uint8)
 for c in range(3):a[:,:,c][target]=shade[target]
 a[:,:,3][target]=255;a[preserve_navy]=saved[preserve_navy]
 sock_reports.append({'side':side,'top':top,'bottom':bottom})
clean,edge_report=polish_edges(a)
# Don't smooth across protected shoulder pixels.
clean[protected]=raw[protected];clean[neck]=0
clean,fit=fit_closed_shoes(clean,body)
Image.fromarray(clean).save(out/'clothing.png')
assets=Path('assets/avatar');canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
canvas.crop((230,350,625,865)).resize((553,721)).convert('RGB').save(out/'dress-detail.jpg',quality=95)
canvas.crop((280,1000,570,1230)).resize((725,575)).convert('RGB').save(out/'sock-detail.jpg',quality=95)
report={'prototype_specific_cleanup':True,'shoulder_pixels_protected':int(protected.sum()),'neck_pixels_removed':int(neck.sum()),'skirt_fringe_pixels_removed':int(fringe.sum()),'sock_regions':sock_reports,'edges':edge_report,'fit':fit,'wardrobe_saved':False}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))

board=Image.new('RGB',(1000,790),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,path in [(0,'Before targeted cleanup',r/'edge-polish/wear-preview.jpg'),(500,'After targeted cleanup',out/'wear-preview.jpg')]:
 draw.text((x+15,12),title,fill='black')
 with Image.open(path) as im:board.paste(im.resize((500,750)),(x,35))
board.save(out/'comparison.jpg',quality=95)
