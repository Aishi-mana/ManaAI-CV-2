from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027/lower-fringe-temples';out=source/'eye-aligned-middle';out.mkdir(exist_ok=True)
a=np.array(Image.open(source/'hair_front.png').convert('RGBA'));h,w=a.shape[:2];yy,xx=np.indices((h,w));
# Move central fringe only; the transition returns to zero before temple locks.
lateral=np.clip(1-np.abs(xx-421)/67,0,1);lateral=lateral*lateral*(3-2*lateral)
vertical=np.clip((yy-135)/115,0,1);vertical=vertical*vertical*(3-2*vertical)
# Invert a forward displacement map independently per column.
sy=np.empty((h,w));original=np.arange(h,dtype=float)
for x in range(w):
 forward=original+30*lateral[:,x]*vertical[:,x]
 sy[:,x]=np.interp(original,forward,original,left=-1,right=h)
alpha=a[:,:,3]/255;premult=a[:,:,:3]*alpha[:,:,None];coords=[sy,xx.astype(float)];oa=map_coordinates(alpha,coords,order=1,mode='constant',cval=0);rgb=np.stack([map_coordinates(premult[:,:,c],coords,order=1,mode='constant',cval=0) for c in range(3)],axis=2);rgb=np.divide(rgb,oa[:,:,None],out=np.zeros_like(rgb),where=oa[:,:,None]>1e-6)
b=np.uint8(np.clip(np.dstack([rgb,oa*255]),0,255));unchanged=(xx<=354)|(xx>=488)|(yy<=135);b[unchanged]=a[unchanged];Image.fromarray(b,'RGBA').save(out/'hair_front.png');back=Image.open(source/'hair_back.png');back.save(out/'hair_back.png')
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'on-mana.jpg',quality=95);bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95)
assert np.array_equal(a[unchanged],b[unchanged])
(out/'fit-report.json').write_text(json.dumps({'newGenerations':0,'centralFringeDisplacement':30,'centerX':421,'halfWidth':67,'crownAndTemplesUnchanged':True,'wardrobeChanged':False},indent=2),encoding='utf-8')
