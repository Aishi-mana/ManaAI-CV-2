"""Register intact regenerated pieces to the same saved design's existing bounds."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

root=Path('C:/AI/ManaAI-CV-2/exports/images/cloud-sailor-intact-regeneration-20261026')
assets=Path('C:/AI/ManaAI-CV-2/assets/avatar')
reference=Path('C:/AI/ManaAI-CV-2/exports/images/image-1792972899187697700/outfit-before-shoulder-repair.png')
template=np.array(Image.open(reference).convert('RGBA'))
raw=np.array(Image.open(root/'outfit.png').convert('RGBA'))
def pieces(a):
    n,labels,stats,centers=cv2.connectedComponentsWithStats((a[:,:,3]>128).astype(np.uint8),8)
    ids=sorted(range(1,n),key=lambda i:stats[i,4],reverse=True)
    main=ids[0]
    shoes=sorted([i for i in ids[1:] if centers[i,1]>a.shape[0]*.78 and stats[i,4]>500 and stats[i,3]>30],key=lambda i:centers[i,0])
    assert len(shoes)==2, 'Expected exactly two separate shoes'
    return labels,stats,[main,*shoes]
sl,ss,si=pieces(raw);tl,ts,ti=pieces(template)
result=Image.new('RGBA',(raw.shape[1],raw.shape[0]));transforms=[]
for source,target in zip(si,ti):
    sx,sy,sw,sh,_=ss[source];tx,ty,tw,th,_=ts[target]
    layer=raw.copy();layer[sl!=source]=0
    crop=Image.fromarray(layer).crop((sx,sy,sx+sw,sy+sh))
    # This is registration against an already fitted copy of the SAME design,
    # not a general clothing fitter or a guessed torso rectangle.
    scale=min(tw/sw,th/sh);nw,nh=round(sw*scale),round(sh*scale)
    x,y=round(tx+(tw-nw)/2),int(ty)
    result.alpha_composite(crop.resize((nw,nh),Image.Resampling.LANCZOS),(x,y))
    transforms.append({'source_box':[int(sx),int(sy),int(sw),int(sh)],'existing_fitted_box':[int(tx),int(ty),int(tw),int(th)],'scale':float(scale),'placed_at':[x,y]})
result.save(root/'outfit-aligned.png')
canvas=Image.new('RGBA',result.size,'white')
for f in ['hairstyles/default/hair_back.png','base/body.png',None,'mouth/mouth_neutral.png','eyes/eye_neutral.png','hairstyles/default/hair_front.png','hairstyles/default/hair_ahoge.png','accessories/cross_hairclip.png']:
    canvas.alpha_composite(result if f is None else Image.open(assets/f).convert('RGBA'))
canvas.convert('RGB').save(root/'aligned-on-mana.jpg',quality=95)
bg=Image.new('RGBA',result.size,(215,210,225));bg.alpha_composite(result)
bg.convert('RGB').save(root/'aligned-standalone.jpg',quality=95)
bg.crop((220,320,640,600)).resize((1050,700)).convert('RGB').save(root/'aligned-shoulders.jpg',quality=95)
(root/'registration.json').write_text(json.dumps({'template':str(reference),'transforms':transforms,'shoulder_erasure':False,'semantic_cleanup':False,'generalized_fit_claim':False},indent=2),encoding='utf-8')
