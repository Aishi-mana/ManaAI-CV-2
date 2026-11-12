import sys,json
from pathlib import Path
import numpy as np,cv2
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts')
from clothing_fit import fit_closed_shoes
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'foot-fit-v3';out.mkdir(exist_ok=False)
size=(843,1264);rgba=np.array(Image.open(r/'refined/clothing.png').convert('RGBA').resize(size,Image.Resampling.LANCZOS));body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
# Remove disconnected scraps and thin wisps from the dress; leave the shoe region for fitting.
mask=(rgba[:,:,3]>0).astype(np.uint8);garment=mask.copy();garment[int(size[1]*.78):]=0
count,labels,stats,_=cv2.connectedComponentsWithStats(garment,8)
if count>1:
 main=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);keep=labels==main
 keep=cv2.morphologyEx(keep.astype(np.uint8),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3))).astype(bool)
 rgba[:int(size[1]*.78)][~keep[:int(size[1]*.78)]]=0
fitted,report=fit_closed_shoes(rgba,body);Image.fromarray(fitted).save(out/'clothing.png');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assets=Path('assets/avatar');canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA').resize(size))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
canvas.crop((280,1000,560,1245)).resize((560,490)).convert('RGB').save(out/'feet.jpg',quality=95)
board=Image.new('RGB',(1000,790),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,path in [(0,'Before shoe fitting',r/'wear-preview.jpg'),(500,'After shoe fitting',out/'wear-preview.jpg')]:
 draw.text((x+15,12),title,fill='black')
 with Image.open(path) as im:board.paste(im.resize((500,750)),(x,35))
board.save(out/'comparison.jpg',quality=95);print(json.dumps(report,indent=2))
