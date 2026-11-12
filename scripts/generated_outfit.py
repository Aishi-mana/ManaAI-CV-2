"""Production outfit-only postprocessing: preserve complete garments, fit a reviewable draft."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image


def remove_outer_background(rgb):
    # Flood only the near-white exterior. Enclosed white fabric remains opaque.
    white=(rgb.min(axis=2)>230)&(np.ptp(rgb.astype(np.int16),axis=2)<22)
    _,labels=cv2.connectedComponents(white.astype(np.uint8),8)
    border=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]));border=border[border!=0]
    keep=~np.isin(labels,border)
    n,parts,stats,_=cv2.connectedComponentsWithStats(keep.astype(np.uint8),8)
    clean=np.zeros(keep.shape,np.uint8)
    for i in range(1,n):
        if stats[i,cv2.CC_STAT_AREA]>=max(30,keep.size*.00008):clean[parts==i]=255
    if not clean.any() or (clean>0).mean()>.8:raise ValueError('Could not separate the outfit from its background. Try a simpler plain-background design.')
    rgba=np.dstack([rgb,clean]);rgba[clean==0]=0
    return rgba


def fit_generated_outfit(rgba,body):
    h,w=body.shape[:2];alpha=(rgba[:,:,3]>0).astype(np.uint8)
    n,parts,stats,centers=cv2.connectedComponentsWithStats(alpha,8)
    ids=sorted(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)
    if not ids:raise ValueError('The generated outfit is empty')
    main=ids[0];main_bottom=stats[main,cv2.CC_STAT_TOP]+stats[main,cv2.CC_STAT_HEIGHT]
    shoes=[i for i in ids[1:] if centers[i,1]>main_bottom and centers[i,1]>rgba.shape[0]*.6]
    upper=[i for i in ids if i not in shoes]
    result=Image.new('RGBA',(w,h))
    def place(ids,rect):
        place_mask(np.isin(parts,ids),rect)
    def place_mask(mask,rect,stretch=False):
        ys,xs=np.where(mask)
        layer=rgba.copy();layer[~mask]=0
        crop=Image.fromarray(layer).crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
        x,y,rw,rh=rect;scale=min(rw/crop.width,rh/crop.height);nw,nh=(max(1,round(rw)),max(1,round(rh))) if stretch else (max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
        result.alpha_composite(crop.resize((nw,nh),Image.Resampling.LANCZOS),(round(x+(rw-nw)/2),round(y)))
    # Some models connect trousers, socks and shoes to the main garment. Do not
    # shrink that whole silhouette into the upper-body rectangle.
    sx,sy,sw,sh,_=stats[main];source_h,source_w=alpha.shape
    connected_full=not shoes and sh>source_h*.70 and main_bottom>source_h*.85
    if connected_full:
        center=int(sx+sw/2);yy,xx=np.indices(alpha.shape)
        gap=(alpha[:,max(0,center-2):center+3].sum(axis=1)==0)
        left=(alpha[:,:center].sum(axis=1)>source_w*.015)
        right=(alpha[:,center:].sum(axis=1)>source_w*.015)
        candidates=np.where(gap&left&right&(np.arange(source_h)>sy+sh*.45)&(np.arange(source_h)<sy+sh*.78))[0]
        split=None
        for row in candidates:
            if (gap&left&right)[row:row+8].all():split=int(row);break
        if split is None:raise ValueError('This connected outfit layout needs manual alignment in Atelier. Try requesting separate shoes below the outfit.')
        # Use the same hem/hip anchor for both halves so there is no vertical gap.
        join=round(h*.67);bottom=int(np.where(body[:,:,3]>128)[0].max()+5) if (body[:,:,3]>128).any() else round(h*.96)
        place_mask((alpha>0)&(yy<split),(w*.20,h*.295,w*.60,join-h*.295),stretch=True)
        foot_reports=[]
        for side,source_half in [('left',xx<center),('right',xx>=center)]:
            mask=(alpha>0)&(yy>=split)&source_half
            if not mask.any():raise ValueError('A connected leg or shoe is missing.')
            by,bx=np.indices(body.shape[:2]);target_half=bx<w//2 if side=='left' else bx>=w//2
            leg=(body[:,:,3]>128)&target_half&(by>=join)
            ys,xs=np.where(leg)
            if not len(xs):raise ValueError('The avatar has no matching leg reference.')
            width=int(xs.max()-xs.min()+15);cx=(xs.min()+xs.max())/2
            # Small bounded width expansion covers the unchanged body foot while
            # retaining the complete source shoe, including buckles and soles.
            base=result.copy();target=(body[:,:,3]>128)&target_half&(by>h*.92)
            best=None
            for extra in (0,4,8,12,16,20,24,28,32):
                result=base.copy();place_mask(mask,(cx-(width+extra)/2,join,width+extra,bottom-join),stretch=True)
                pixels=np.array(result);missed=int((target&(pixels[:,:,3]<220)).sum())
                if best is None or missed<best[0]:best=(missed,result.copy(),extra)
                if missed==0:break
            missed,result,extra=best;foot_reports.append({'side':side,'fitted':missed==0,'foot_pixels_exposed_after':missed,'width_expansion':extra})
        pixels=np.array(result);pixels[pixels[:,:,3]==0]=0
        return pixels,{'initial_fit':True,'manual_review_recommended':True,'layout':'connected-full-outfit','split_row':split,'footwear':{'feet':foot_reports},'component_count':len(ids),'fit_version':2}
    # An initial front-view fit, kept editable in Atelier. No original outfit mask.
    place(upper,(w*.20,h*.295,w*.60,h*.38))
    if shoes:
        shoes=sorted(shoes,key=lambda i:centers[i,0])
        if len(shoes)>2:raise ValueError('The design has too many separate footwear pieces. Try a simpler outfit.')
        for i,part in enumerate(shoes):
            half=(np.indices(body.shape[:2])[1]<w//2) if i==0 else (np.indices(body.shape[:2])[1]>=w//2)
            target=(body[:,:,3]>128)&half&(np.indices(body.shape[:2])[0]>h*.90)
            ys,xs=np.where(target)
            if not len(xs):continue
            place([part],(float(xs.min()-5),h*.84,float(xs.max()-xs.min()+11),h*.115))
    pixels=np.array(result)
    if shoes:
        from clothing_fit import fit_closed_shoes
        pixels,fit=fit_closed_shoes(pixels,body)
    else:fit={'feet':[],'note':'No separate shoes generated; existing body feet remain visible.'}
    pixels[pixels[:,:,3]==0]=0
    return pixels,{'initial_fit':True,'manual_review_recommended':True,'footwear':fit,'component_count':len(ids),'layout':'separate-footwear','fit_version':2}


def prepare_outfit(directory,body_path):
    directory=Path(directory)
    request_path=directory/'request.json'
    request=json.loads(request_path.read_text(encoding='utf-8')) if request_path.is_file() else {}
    if request.get('outfitExtraction')=='garment-only-body-guide':
        from garment_only import prepare_garment_only
        return prepare_garment_only(directory,body_path)
    if request.get('outfitExtraction')=='intact-garment':
        from intact_outfit import prepare_intact_outfit
        return prepare_intact_outfit(directory)
    if request.get('outfitExtraction')=='aligned-avatar':
        if not request.get('reference'):
            raise ValueError('An avatar reference is required for aligned outfit extraction.')
        from aligned_outfit import prepare_aligned_outfit
        return prepare_aligned_outfit(directory,body_path)
    source=directory/'image.png'
    if not source.is_file():source=directory/'image.jpg'
    with Image.open(source) as im:rgb=np.array(im.convert('RGB'))
    with Image.open(body_path) as im:body=np.array(im.convert('RGBA'))
    if not 128<=body.shape[0]<=2048 or not 128<=body.shape[1]<=2048:raise ValueError('Unsupported avatar body size')
    rgba=remove_outer_background(rgb);pixels,report=fit_generated_outfit(rgba,body)
    Image.fromarray(pixels).save(directory/'outfit.png')
    report.update(width=body.shape[1],height=body.shape[0],prototype=True,source='local-outfit-generation')
    (directory/'outfit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('directory');parser.add_argument('body');args=parser.parse_args()
    print(json.dumps(prepare_outfit(args.directory,args.body),indent=2))
