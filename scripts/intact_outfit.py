"""Fit a regenerated intact copy against the SAME design's saved placement.

No semantic parsing, hair masks, shoulder erasure, or hidden-fabric patching.
This registration requires an already fitted template and is not a new-design fitter.
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image


def register_intact(rgba,template):
    def pieces(a):
        n,labels,stats,centers=cv2.connectedComponentsWithStats((a[:,:,3]>128).astype(np.uint8),8)
        ids=sorted(range(1,n),key=lambda i:stats[i,4],reverse=True)
        if not ids:raise ValueError('Empty outfit')
        shoes=sorted([i for i in ids[1:] if centers[i,1]>a.shape[0]*.78 and stats[i,4]>max(30,a.shape[0]*a.shape[1]*.0004) and stats[i,3]>a.shape[0]*.02 and .15<stats[i,2]/stats[i,3]<3],key=lambda i:centers[i,0])
        if len(shoes)!=2:raise ValueError('This registration needs two separate footwear pieces in source and template.')
        return labels,stats,[ids[0],*shoes]
    sl,ss,si=pieces(rgba);_,ts,ti=pieces(template)
    result=Image.new('RGBA',(template.shape[1],template.shape[0]));transforms=[]
    for source,target in zip(si,ti):
        sx,sy,sw,sh,_=ss[source];tx,ty,tw,th,_=ts[target]
        layer=rgba.copy();layer[sl!=source]=0
        crop=Image.fromarray(layer).crop((sx,sy,sx+sw,sy+sh))
        scale=min(tw/sw,th/sh);nw,nh=max(1,round(sw*scale)),max(1,round(sh*scale))
        x,y=round(tx+(tw-nw)/2),int(ty)
        result.alpha_composite(crop.resize((nw,nh),Image.Resampling.LANCZOS),(x,y))
        transforms.append({'source_box':[int(sx),int(sy),int(sw),int(sh)],'template_box':[int(tx),int(ty),int(tw),int(th)],'scale':float(scale),'placed_at':[x,y]})
    return np.array(result),transforms


def fit_neck_opening(pixels,template,body):
    """Use the fitted neckline only inside the body's narrow central neck.

    A ghost garment includes its back collar. In a single front layer that panel
    must not cover the avatar's neck. Shoulder fabric is outside this operation.
    """
    if pixels.shape!=template.shape or pixels.shape!=body.shape:
        raise ValueError('Outfit, neckline template and body canvases must match')
    h,w=pixels.shape[:2];spans=[]
    for y in range(int(h*.25),int(h*.34)+1):
        xs=np.where(body[y,:,3]>128)[0]
        if len(xs)>=w*.025:spans.append((len(xs),y,int(xs.min()),int(xs.max()+1)))
    if not spans:return pixels.copy(),{'available':False,'changed_pixels':0}
    width,row,left,right=min(spans)
    if width>w*.2:return pixels.copy(),{'available':False,'changed_pixels':0}
    transition=next((y for span,y,_,_ in spans if y>row and span>=width*3),None)
    if transition is None:return pixels.copy(),{'available':False,'changed_pixels':0}
    pad=round(width*.2);x0=max(0,left-pad);x1=min(w,right+pad)
    y0=int(h*.25);y1=min(h,transition+round(width*.4))
    # The existing opening supplies its depth, not its jagged parser edge.
    # Draw a smooth V and intersect with the actual body neck so no white gap
    # opens beside her neck and no shoulder pixels are removed.
    center=(left+right-1)/2
    gaps=(template[y0:y1,round(center),3]<64)&(body[y0:y1,round(center),3]>128)
    rows=np.where(gaps)[0]
    bottom=min(y1-1,y0+int(rows.max())+1) if len(rows) else y1-1
    flare=min(transition-10,bottom-8)
    scale=4;mask=np.zeros((h*scale,w*scale),np.uint8)
    polygon=np.array([[x0,y0],[x1,y0],[x1,flare],[center,bottom],[x0,flare]],np.float32)
    cv2.fillPoly(mask,[np.round(polygon*scale).astype(np.int32)],255)
    opening=cv2.resize(mask,(w,h),interpolation=cv2.INTER_AREA).astype(np.float32)/255
    opening[:,:x0]=0;opening[:,x1:]=0;opening[:y0]=0;opening[y1:]=0
    opening*=body[:,:,3].astype(np.float32)/255
    result=pixels.copy()
    result[:,:,3]=np.round(result[:,:,3]*(1-opening)).astype(np.uint8)
    result[result[:,:,3]==0]=0
    changed=(result!=pixels).any(axis=2)
    return result,{'available':True,'changed_pixels':int(changed.sum()),
                   'neck_bounds':[x0,y0,x1,y1],
                   'note':'Only the central anatomical neck uses the old neckline; shoulder masks are never transferred.'}


def prepare_intact_outfit(directory):
    from generated_outfit import remove_outer_background
    directory=Path(directory)
    with Image.open(directory/'image.png') as im:rgb=np.array(im.convert('RGB'))
    with Image.open(directory/'outfit-fit-template.png') as im:template=np.array(im.convert('RGBA'))
    pixels,transforms=register_intact(remove_outer_background(rgb),template)
    neck={'available':False,'changed_pixels':0}
    if (directory/'avatar-body.png').is_file():
        with Image.open(directory/'avatar-body.png') as im:body=np.array(im.convert('RGBA'))
        pixels,neck=fit_neck_opening(pixels,template,body)
        from clothing_fit import fit_closed_shoes
        pixels,footwear=fit_closed_shoes(pixels,body)
    else:footwear={'feet':[]}
    Image.fromarray(pixels).save(directory/'outfit.png')
    report={'source':'local-intact-garment-regeneration','fit_version':4,'width':pixels.shape[1],'height':pixels.shape[0],
            'shoulder_erasure':False,'semantic_cleanup':False,'hidden_fabric_patching':False,
            'registration':'same-design-existing-placement','transforms':transforms,
            'neck_opening':neck,'footwear':footwear,'review_required':True}
    (directory/'outfit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report
