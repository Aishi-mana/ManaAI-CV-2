import sys,json
from pathlib import Path
import numpy as np,cv2
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts')
from clothing_fit import fit_closed_shoes
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'sock-details-restored-v2';out.mkdir(exist_ok=False)
a=np.array(Image.open(r/'layer-aware-cleanup-final/clothing.png').convert('RGBA'));source=np.array(Image.open(r/'image.png').convert('RGB'));body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
yy,xx=np.indices(a.shape[:2]);hsv=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2HSV);records=[]
# Transfer original sock fabric row by row onto the repaired leg contours.
# The source pixels retain the cuff curve, black lining and gray fabric shadows.
for side,sx0,sx1,top,bottom in [('left',320,405,1043,1118),('right',430,525,1047,1118)]:
 half=xx<421 if side=='left' else xx>=421
 zone=half&(yy>=top)&(yy<=bottom)
 navy=zone&(hsv[:,:,1]>70)&(hsv[:,:,2]<160)&(a[:,:,3]>0)
 saved=a.copy();a[zone]=0
 target=cv2.dilate((body[:,:,3]>128).astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))).astype(bool)
 for y in range(top,bottom+1):
  sy=1039+(y-top)/(bottom-top)*(1110-1039)
  row=source[int(round(sy)),sx0:sx1]
  # Original dark outline bounds; no guessed white replacement colors.
  gray=cv2.cvtColor(row[None],cv2.COLOR_RGB2GRAY)[0]
  dark=np.where(gray<180)[0]
  if len(dark)<2:continue
  left,right=int(dark.min()),int(dark.max()+1)
  xs=np.where(target[y]&half[y])[0]
  if not len(xs):continue
  mapped=cv2.resize(row[left:right][None],(len(xs),1),interpolation=cv2.INTER_LINEAR)[0]
  mh=cv2.cvtColor(mapped[None],cv2.COLOR_RGB2HSV)[0]
  skin=(mh[:,0]<25)&(mh[:,1]>30)&(mh[:,2]>110)
  valid=~skin
  a[y,xs[valid],:3]=mapped[valid];a[y,xs[valid],3]=255
 a[navy]=saved[navy]
 records.append({'side':side,'source_fabric_and_linework_restored':True})
a[a[:,:,3]==0]=0
original=np.array(Image.open(r/'layer-aware-cleanup-final/clothing.png').convert('RGBA'))
a,fit=fit_closed_shoes(a,body)
a[:1043]=original[:1043];a[1119:]=original[1119:];a[1043:1047,421:]=original[1043:1047,421:]
Image.fromarray(a).save(out/'clothing.png')
assets=Path('assets/avatar');canvas=Image.new('RGBA',(843,1264),'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
canvas.crop((280,1000,570,1230)).resize((725,575)).convert('RGB').save(out/'sock-detail.jpg',quality=95)
(out/'report.json').write_text(json.dumps({'prototype_specific':True,'sock_details':records,'fit':fit,'wardrobe_saved':False},indent=2),encoding='utf-8')
board=Image.new('RGB',(1000,790),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,path in [(0,'Before: flat sock repair',r/'layer-aware-cleanup-final/wear-preview.jpg'),(500,'Original sock details restored',out/'wear-preview.jpg')]:
 draw.text((x+15,12),title,fill='black')
 with Image.open(path) as im:board.paste(im.resize((500,750)),(x,35))
board.save(out/'comparison.jpg',quality=95);print(json.dumps(fit,indent=2))
