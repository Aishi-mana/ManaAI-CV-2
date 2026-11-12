from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/hairstyle-style-reference-trial-20261027';out=source/'cleaned';out.mkdir(exist_ok=True)
im=np.array(Image.open(source/'image.png').convert('RGB'))
report={'generationCount':1,'productionChanged':False,'wardrobeChanged':False,'layers':[]}
for name,part in [('front',im[:,:512]),('back',im[:,512:])]:
 a=part.astype(float);white=(a.min(2)>238)&((a.max(2)-a.min(2))<20)
 white_labels,white_count=ndi.label(white)
 edge_ids=np.unique(np.concatenate([white_labels[0],white_labels[-1],white_labels[:,0],white_labels[:,-1]]));edge_ids=edge_ids[edge_ids>0]
 remove_white=np.isin(white_labels,edge_ids)
 if name=='front':
  # Empty face region is the large enclosed white region near panel center.
  candidates=[]
  for label in range(1,white_count+1):
   ys0,xs0=np.where(white_labels==label)
   if len(xs0)>part.shape[0]*part.shape[1]*.025 and part.shape[1]*.25<xs0.mean()<part.shape[1]*.75 and ys0.mean()>part.shape[0]*.3:candidates.append(label)
  remove_white|=np.isin(white_labels,candidates)
 # Pure-white enclosed gaps between curls are background, not pale painted
 # strand highlights. Leave smaller/highlight regions and all colored pixels.
 pure=(a.min(2)>247)&((a.max(2)-a.min(2))<12)
 pure_labels,pure_count=ndi.label(pure)
 pure_sizes=np.bincount(pure_labels.ravel())
 gaps=np.flatnonzero(pure_sizes>100);gaps=gaps[gaps>0]
 remove_white|=np.isin(pure_labels,gaps)
 mask=~remove_white
 # The face outline is thin dark ink without adjacent filled hair. Remove only
 # unsupported ink in the lower central face opening of the FRONT panel.
 removed=np.zeros(mask.shape,bool)
 if name=='front':
  colored=(a.mean(2)>110)&(a.min(2)>65)&(a.min(2)<225)&((a.max(2)-a.min(2))>15)
  thick_hair=ndi.binary_opening(mask,iterations=5)
  distance=ndi.distance_transform_edt(~thick_hair)
  yy,xx=np.indices(mask.shape)
  removed=mask&(distance>6)&(yy>part.shape[0]*.34)&(yy<part.shape[0]*.70)&(xx>part.shape[1]*.25)&(xx<part.shape[1]*.75)
  mask[removed]=False
 labels,n=ndi.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0;mask=labels==sizes.argmax()
 ys,xs=np.where(mask);bounds=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
 alpha=np.clip(ndi.gaussian_filter(mask.astype(float),.45)*255,0,255).astype('uint8')
 rgba=np.dstack([part,alpha]);piece=Image.fromarray(rgba,'RGBA');piece.save(out/f'{name}-cutout.png')
 # Trial placement uses a shared scale and crown height, not independent stretch.
 # Generated panel crowns are about the same head width, with front framing locks.
 scale=.94;target=Image.new('RGBA',(843,1264));resized=piece.resize((round(512*scale),round(768*scale)),Image.Resampling.LANCZOS)
 x=round(421-256*scale);y=round(60-bounds[1]*scale);target.alpha_composite(resized,(x,y));target.save(out/f'hair_{name}.png')
 report['layers'].append({'layer':name,'bounds':bounds,'removedUnsupportedFaceInk':int(removed.sum()),'scale':scale,'offset':[x,y]})
base=Image.new('RGBA',(843,1264))
for path in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:
 base.alpha_composite(Image.open(path).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'on-mana.jpg',quality=94)
bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95)
(out/'preparation-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
