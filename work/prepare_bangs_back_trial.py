from pathlib import Path
import numpy as np,json
from PIL import Image
from scipy import ndimage as ndi
root=Path('C:/AI/ManaAI-CV-2');out=root/'exports/images/bangs-back-trial-20261027';im=np.array(Image.open(out/'image.png').convert('RGB'))
report={'generationCount':1,'faceOutlineErasure':False,'wardrobeChanged':False,'productionChanged':False,'layers':[]}
for name,part in [('front',im[:,:512]),('back',im[:,512:])]:
 a=part.astype(float);white=(a.min(2)>238)&((a.max(2)-a.min(2))<20);labels,n=ndi.label(white)
 edges=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]]);edges=edges[edges>0];remove=np.isin(labels,edges)
 # White spaces enclosed by curls, not colored strand highlights.
 pure=(a.min(2)>247)&((a.max(2)-a.min(2))<12);pl,pn=ndi.label(pure);sizes=np.bincount(pl.ravel());ids=np.flatnonzero(sizes>100);ids=ids[ids>0];remove|=np.isin(pl,ids)
 mask=~remove;lab,n=ndi.label(mask);sz=np.bincount(lab.ravel());sz[0]=0;mask=lab==sz.argmax();ys,xs=np.where(mask);box=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
 alpha=np.uint8(np.clip(ndi.gaussian_filter(mask.astype(float),.45)*255,0,255));piece=Image.fromarray(np.dstack([part,alpha]),'RGBA').crop(box);piece.save(out/f'{name}-cutout.png')
 # Fit compact bangs to forehead height, back hair to the wider crown silhouette.
 target_width=338 if name=='front' else 410
 target_height=234 if name=='front' else round(piece.height*target_width/piece.width)
 resized=piece.resize((target_width,target_height),Image.Resampling.LANCZOS);target=Image.new('RGBA',(843,1264));x=round(421-target_width/2);y=60;target.alpha_composite(resized,(x,y));target.save(out/f'hair_{name}.png')
 report['layers'].append({'layer':name,'sourceBounds':box,'targetBounds':[x,y,target_width,target_height]})
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'on-mana.jpg',quality=95);bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95)
(out/'preparation-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
