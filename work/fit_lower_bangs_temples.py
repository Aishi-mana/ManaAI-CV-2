from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027';out=source/'lower-fringe-temples';out.mkdir(exist_ok=True)
piece=Image.open(source/'front-cutout.png').convert('RGBA').resize((338,234),Image.Resampling.LANCZOS);a=np.array(piece).astype(float)
# Preserve the crown. Move the lower fringe down gradually, and extend existing
# outer temple strands further with a smooth lateral blend. No new painted hair.
w,h=338,234;oh=304;yy,xx=np.indices((oh,w));xf=xx/(w-1)
side=np.clip((np.abs(xf-.5)-.19)/.16,0,1);side=side*side*(3-2*side)
extra=22+42*side
# Forward vertical mapping for each column, inverted for alpha-aware resampling.
sy=np.empty((oh,w));original=np.arange(h,dtype=float)
for x in range(w):
 blend=np.clip((original-65)/(h-1-65),0,1);blend=blend*blend*(3-2*blend)
 forward=original+extra[0,x]*blend
 sy[:,x]=np.interp(np.arange(oh),forward,original,left=-1,right=h)
alpha=a[:,:,3]/255;premult=a[:,:,:3]*alpha[:,:,None]
coords=[sy,xx.astype(float)];oa=map_coordinates(alpha,coords,order=1,mode='constant',cval=0)
rgb=np.stack([map_coordinates(premult[:,:,c],coords,order=1,mode='constant',cval=0) for c in range(3)],axis=2)
rgb=np.divide(rgb,oa[:,:,None],out=np.zeros_like(rgb),where=oa[:,:,None]>1e-6)
warped=Image.fromarray(np.uint8(np.clip(np.dstack([rgb,oa*255]),0,255)),'RGBA');front=Image.new('RGBA',(843,1264));front.alpha_composite(warped,(252,60));fp=np.array(front);fp[:125]=np.array(Image.open(source/'hair_front.png'))[:125];front=Image.fromarray(fp,'RGBA');front.save(out/'hair_front.png')
back=Image.open(source/'hair_back.png').convert('RGBA');back.save(out/'hair_back.png')
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'on-mana.jpg',quality=95);bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95)
(out/'fit-report.json').write_text(json.dumps({'newGenerations':0,'paintedPixels':False,'source':str(source/'front-cutout.png'),'crownOrigin':[252,60],'centerLowerTipDisplacement':22,'templeMaxDisplacement':64,'method':'smooth per-column alpha-aware vertical warp; existing strands only','wardrobeChanged':False},indent=2),encoding='utf-8')
