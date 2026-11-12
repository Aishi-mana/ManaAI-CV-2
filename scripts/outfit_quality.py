"""Conservative fit diagnostics and opening-edge cleanup; never edits shoulders."""
import cv2
import numpy as np
import re


def _runs(row):
    x=np.flatnonzero(row)
    return [r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)]


def broader_fit_checks(rgba,body,neck_bounds,prompt=''):
    h,w=body.shape[:2];opaque=rgba[:,:,3]>=220;skin=body[:,:,3]>128
    left,top,right,bottom=neck_bounds;center=round((left+right)/2);neck_width=max(4,right-left)
    checks={};warnings=[]
    for side,half in [('left',slice(0,center)),('right',slice(center,w))]:
        target=np.zeros((h,w),np.uint8)
        y0=max(0,bottom-round(neck_width*.15));y1=min(h,y0+max(8,round(neck_width*.45)))
        target[y0:y1,half]=skin[y0:y1,half]
        target[:,max(0,left-2):min(w,right+2)]=0
        target=cv2.erode(target,np.ones((3,3),np.uint8))>0
        count=int(target.sum());missed=int((target&~opaque).sum());fraction=missed/max(1,count)
        checks[side+'_shoulder']={'target_pixels':count,'exposed_pixels':missed,'fraction_exposed':fraction,'passed':count>0 and fraction<=.08}
        if count and fraction>.08:warnings.append(side.capitalize()+' shoulder may be too narrow or offset. Check its alignment in Atelier.')
    explicit_short=bool(re.search(r'\b(short[- ]sleeved?|short sleeves|sleeveless|cap sleeves)\b',prompt,re.I))
    explicit_long=bool(re.search(r'\b(long[- ]sleeved?|long sleeves|full[- ]length sleeves|cardigan|hoodie|sweater|jacket)\b',prompt,re.I)) and not explicit_short
    for side,index in [('left',0),('right',-1)]:
        rows=[]
        for y in range(round(h*.40),round(h*.565)):
            runs=_runs(skin[y]);central=[r for r in runs if r[0]<=center<=r[-1]]
            if len(runs)>=3 and central:
                run=runs[index]
                if (side=='left' and run[-1]<central[0][0]) or (side=='right' and run[0]>central[0][-1]):rows.append((y,run))
        if not rows:
            checks[side+'_sleeve']={'passed':None,'reason':'No distinct arm geometry'};warnings.append(side.capitalize()+' sleeve could not be checked against the body.');continue
        wrist_candidates=[(y,r) for y,r in rows if y>=h*.49]
        wrist,run=min(wrist_candidates or rows,key=lambda yr:len(yr[1]))
        target=np.zeros((h,w),bool);cuff=np.zeros_like(target)
        for y,r in rows:
            if y<=wrist:target[y,r[2:-2]]=True
            if wrist-round(h*.006)<=y<=wrist:cuff[y,r[2:-2]]=True
        count=int(target.sum());missed=int((target&~opaque).sum());fraction=missed/max(1,count)
        inferred_long=(target&opaque).sum()/max(1,count)>.65
        required=explicit_long or (not explicit_short and inferred_long)
        cuff_missed=int((cuff&~opaque).sum());cuff_fraction=cuff_missed/max(1,int(cuff.sum()))
        passed=not required or (fraction<=.06 and cuff_fraction<=.10)
        checks[side+'_sleeve']={'required':bool(required),'wrist_row':wrist,'target_pixels':count,'exposed_pixels':missed,'fraction_exposed':fraction,'cuff_exposed_pixels':cuff_missed,'passed':bool(passed)}
        cuff_widths=[]
        for cy in range(wrist,min(h,wrist+max(4,round(h*.012)))):
            pieces=[r for r in _runs(opaque[cy]) if r[-1]>=run[0] and r[0]<=run[-1] and (r[-1]<center-w*.06 if side=='left' else r[0]>center+w*.06)]
            if pieces:cuff_widths.append(min(len(r) for r in pieces))
        if required and cuff_widths:
            ease=float(np.median(cuff_widths)/max(1,len(run)))
            checks[side+'_sleeve']['cuff_width_to_wrist_ratio']=ease
            if ease>1.85 and not re.search(r'bell sleeves|trumpet|oversized cuffs|wide cuffs',prompt,re.I):
                checks[side+'_sleeve']['passed']=False
                warnings.append(side.capitalize()+' cuff is oversized around the wrist; coverage alone is not a fitted sleeve.')
        if required and fraction>.06:warnings.append(side.capitalize()+' sleeve leaves part of the arm exposed; check its width and length.')
        hand=np.zeros((h,w),bool)
        hx=np.indices((h,w))[1];outer=hx<center-w*.15 if side=='left' else hx>center+w*.15
        y0=min(h,wrist+round(h*.014));y1=min(h,wrist+round(h*.065))
        hand[y0:y1]=skin[y0:y1]&outer[y0:y1]
        covered_hand=int((hand&opaque).sum())/max(1,int(hand.sum()))
        checks[side+'_sleeve']['hand_coverage_fraction']=covered_hand
        if required and hand.sum()>50 and covered_hand>.65:
            checks[side+'_sleeve']['passed']=False
            warnings.append(side.capitalize()+' cuff may extend over the hand. Check its end position.')
        if required and cuff_fraction>.10:warnings.append(side.capitalize()+' cuff does not reach or cover the wrist correctly.')
    return checks,warnings


def clean_opening_edges(rgba,body,neck_bounds,footwear,protected=None,coverage=None):
    """Remove narrow body-colored remnants at the central collar and above sock rims.

    Matching body color, adjacency to transparency and small anatomical windows
    are required together. Never globally erase peach fabric or shoulder pixels.
    """
    result=rgba.copy();h,w=result.shape[:2];yy,xx=np.indices((h,w));alpha=result[:,:,3]>0
    left,top,right,bottom=map(int,neck_bounds)
    transparent=(~alpha).astype(np.uint8);near=cv2.dilate(transparent,np.ones((5,5),np.uint8))>0
    rgb=result[:,:,:3].astype(np.int16);reference=body[:,:,:3].astype(np.int16)
    hsv=cv2.cvtColor(result[:,:,:3],cv2.COLOR_RGB2HSV)
    skin=(hsv[:,:,0]<25)&(hsv[:,:,1]>25)&(hsv[:,:,2]>100)&(body[:,:,3]>128)&(np.max(np.abs(rgb-reference),axis=2)<38)
    collar=(xx>=max(0,left))&(xx<min(w,right))&(yy>=max(0,top))&(yy<=min(h-1,bottom+2))
    rims=np.zeros((h,w),bool)
    for foot in footwear.get('feet',[]):
        half=xx<w//2 if foot.get('side')=='left' else xx>=w//2
        start=int(foot.get('coverage_start_row',h))
        rims|=half&(yy>=start-max(4,round(h*.012)))&(yy<start)
    remove=alpha&skin&near&(collar|rims)
    if protected is not None:remove&=~protected
    if coverage is not None:remove&=~coverage
    result[remove]=0
    return result,{'collar_edge_pixels_removed':int((remove&collar).sum()),'sock_rim_pixels_removed':int((remove&rims).sum()),'shoulder_pixels_modified':0}

def clean_collar_insert(rgba,neck_bounds,protected=None,body=None):
    """Remove a bounded, shaded invisible-mannequin fill inside a round collar.

    Requires an opening-connected, broad shallow color patch and brighter fabric
    below it. A dark bib/trim continuing into the garment is left unchanged.
    """
    result=rgba.copy();h,w=rgba.shape[:2];left,top,right,bottom=map(int,neck_bounds)
    width=max(4,right-left);center=round((left+right)/2)
    empty={'dark_collar_fill_pixels_removed':0}
    if not (0<=center<w and 0<=bottom+2<h):return result,empty
    # Some clothing-only sprites shade the hollow collar grey ABOVE the
    # opening's lower edge. Search that bounded opening separately from a bib.
    yy,xx=np.indices((h,w));color_range=np.ptp(rgba[:,:,:3].astype(np.int16),axis=2)
    hole_roi=(xx>left-width*.4)&(xx<right+width*.4)&(yy>=max(top,bottom-width*.65))&(yy<bottom+width*.4)
    grey=hole_roi&(rgba[:,:,3]>220)&(color_range<25)&(rgba[:,:,:3].min(2)>110)&(rgba[:,:,:3].max(2)<225)
    n,hole_labels,hole_stats,_=cv2.connectedComponentsWithStats(grey.astype(np.uint8),8)
    for label in np.unique(hole_labels[:,center]):
        if not label:continue
        x,y,bw,bh,area=hole_stats[label]
        if area<width*2 or bw<width*.8 or bw>width*1.7 or bh>width*.42 or y+bh>bottom:continue
        remove=hole_labels==label
        ring=(cv2.dilate(remove.astype(np.uint8),np.ones((7,7),np.uint8))>0)&~remove
        white=(rgba[:,:,:3].min(2)>215)&(color_range<35)&(rgba[:,:,3]>220)
        if (ring&white).sum()<width*.5:continue
        if protected is not None:remove&=~protected
        soft=cv2.GaussianBlur(remove.astype(np.float32),(3,3),.65)
        result[:,:,3][remove]=np.rint(rgba[:,:,3][remove]*(1-soft[remove])).astype(np.uint8)
        rear_occluded=0
        if body is not None:
            # The upper rim belongs BEHIND the real neck. Omit only its hidden
            # central pixels from the front garment; retain both visible sides.
            rear=(yy>=y-6)&(yy<y)&(xx>=left)&(xx<=right)&(body[:,:,3]>128)&(rgba[:,:,3]>0)
            result[rear]=0;rear_occluded=int(rear.sum())
        result[result[:,:,3]==0]=0
        return result,{'dark_collar_fill_pixels_removed':0,'neutral_collar_hole_pixels_removed':int(remove.sum()),'rear_collar_pixels_occluded_by_neck':rear_occluded}
    seed=None
    for y in range(bottom+1,min(h,bottom+max(3,round(width*.10)))):
        if rgba[y,center,3]>220:seed=(y,center);break
    if seed is None:return result,empty
    sy,sx=seed;color=rgba[sy,sx,:3].astype(np.int16);value=int(color.max())
    if value<55 or value>195:return result,empty
    below=rgba[min(h,bottom+round(width*.38)):min(h,bottom+round(width*.72)),max(0,center-round(width*.16)):min(w,center+round(width*.16))]
    if not below.size:return result,empty
    fabric=below[below[:,:,3]>220,:3]
    if len(fabric)<20 or np.median(fabric.max(axis=1))<value*1.4:return result,empty
    yy,xx=np.indices((h,w));rgb=rgba[:,:,:3].astype(np.int16)
    roi=(xx>=left-width*.65)&(xx<=right+width*.65)&(yy>=top)&(yy<=bottom+width*.6)
    similar=(np.max(np.abs(rgb-color),axis=2)<38)&(rgba[:,:,3]>32)&roi
    n,labels,stats,_=cv2.connectedComponentsWithStats(similar.astype(np.uint8),8)
    label=labels[sy,sx]
    if not label:return result,empty
    x,y,bw,bh,area=stats[label]
    if area<width*2 or bw<width*.8 or bw>width*2.2 or bh>width*.65:return result,empty
    if x<=left-width*.65+1 or x+bw>=right+width*.65-1 or y+bh>=bottom+width*.6-1:return result,empty
    remove=labels==label
    # Remove small enclosed islands inside the discarded neck fill as well
    # (e.g. a generated clothing tag), not the surrounding collar outline.
    contours,_=cv2.findContours(remove.astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    solid=np.zeros((h,w),np.uint8);cv2.drawContours(solid,contours,-1,1,cv2.FILLED)
    islands=(solid>0)&~remove
    count,parts,stats,_=cv2.connectedComponentsWithStats(islands.astype(np.uint8),8)
    for island in range(1,count):
        if stats[island,cv2.CC_STAT_AREA]<=width*width*.10:remove|=parts==island
    near=cv2.dilate((rgba[:,:,3]==0).astype(np.uint8),np.ones((3,3),np.uint8))>0
    # A real generated neck hole can be enclosed by its dark collar outline.
    # The bounded bowl/contrast checks above still apply; retain the outline
    # itself rather than requiring an artificial cut to reach the fill.
    # Retain the upper/back collar rim behind the neck. Only its interior
    # mannequin fill is removed; dark fabric/outline is not a cleanup target.
    if protected is not None:remove&=~protected
    # Feather only the removed side of the boundary. The surrounding collar
    # and preserved back rim remain byte-identical, without a blurred outline.
    soft=cv2.GaussianBlur(remove.astype(np.float32),(3,3),.65)
    result[:,:,3][remove]=np.round(rgba[:,:,3][remove]*(1-soft[remove])).astype(np.uint8)
    result[result[:,:,3]==0]=0
    return result,{'dark_collar_fill_pixels_removed':int(remove.sum()),'collar_edge_refinement':'subpixel-interior'}


