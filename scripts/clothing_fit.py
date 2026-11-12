"""Diagnostic closed-shoe fitting to an unchanged body. Never writes Wardrobe."""
import cv2
import numpy as np


def fit_shoulder_drape(rgba,body,neck_bounds):
    """Raise dropped shoulder seams to the unchanged body with a smooth warp.

    Collar center stays pinned. Complete shoulder artwork moves, including
    fabric hidden behind front hair. No alpha erasure or painted replacement.
    """
    h,w=rgba.shape[:2];left,_,right,_=neck_bounds;center=(left+right)/2;nw=right-left
    yy,xx=np.indices((h,w),dtype=np.float32);offset=np.zeros(w,np.float32);measured=np.zeros(w,bool)
    for x in range(w):
        distance=abs(x-center)
        if not nw*.55<distance<w*.16:continue
        by=np.flatnonzero(body[round(h*.29):round(h*.37),x,3]>128)
        gy=np.flatnonzero(rgba[round(h*.29):round(h*.40),x,3]>128)
        if not len(by) or not len(gy):continue
        bt=int(by[0])+round(h*.29);gt=int(gy[0])+round(h*.29)
        if bt<h*.30:continue
        delta=gt-(bt+1)
        if 3<delta<h*.03:offset[x]=delta;measured[x]=True
    offset=cv2.GaussianBlur(offset.reshape(1,-1),(11,1),2).ravel()
    distance=np.abs(np.arange(w)-center)
    inner=np.clip((distance-nw*.55)/max(1,nw*.35),0,1)
    outer=np.clip((w*.17-distance)/(w*.025),0,1)
    offset*=inner*inner*(3-2*inner)*outer*outer*(3-2*outer)
    t=np.clip((h*.46-yy)/(h*.46-h*.34),0,1);t=t*t*(3-2*t)
    my=yy+t*offset[None,:];changed=(my-yy)>.001
    p=rgba.astype(np.float32)/255;p[:,:,:3]*=p[:,:,3:4]
    p=cv2.remap(p,xx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT);a=np.clip(p[:,:,3:4],0,1)
    rgb=np.divide(p[:,:,:3],a,out=np.zeros_like(p[:,:,:3]),where=a>0)
    pixels=np.rint(np.clip(np.concatenate([rgb,a],axis=2)*255,0,255)).astype(np.uint8);pixels[pixels[:,:,3]==0]=0
    out=rgba.copy();out[changed]=pixels[changed]
    return out,{'method':'body-shoulder-seam-drape','maximum_raise':float(offset.max()),'measured_columns':int(measured.sum()),'collar_center_pinned':True,'shoulder_erasure':False}


def clear_underarm_background(rgba,body):
    """Clear enclosed white negative space only inside measured underarm gaps.

    White collars, cuffs and decorations are not background seeds. A component
    must track the empty channel between a distinct body arm and torso.
    """
    h,w=rgba.shape[:2];gap=np.zeros((h,w),np.uint8)
    def runs(row):
        x=np.flatnonzero(row)
        return [r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)]
    for y in range(round(h*.40),round(h*.53)):
        rr=runs(body[y,:,3]>128)
        if len(rr)!=3 or not rr[1][0]<w/2<rr[1][-1]:continue
        gap[y,rr[0][-1]+1:rr[1][0]]=1;gap[y,rr[1][-1]+1:rr[2][0]]=1
    white=(rgba[:,:,:3].min(2)>240)&(np.ptp(rgba[:,:,:3].astype(np.int16),axis=2)<12)&(rgba[:,:,3]>0)
    n,labels,stats,_=cv2.connectedComponentsWithStats(white.astype(np.uint8),8)
    out=rgba.copy();removed=0
    for i in range(1,n):
        x,y,bw,bh,area=stats[i];mask=labels==i
        if y<h*.40 or y+bh>h*.54 or bh<max(8,h*.025) or bw>w*.045:continue
        if (mask&(gap>0)).sum()<area*.25:continue
        # Include only the antialiased white fringe, not its dark garment edge.
        fringe=cv2.dilate(mask.astype(np.uint8),np.ones((3,3),np.uint8))>0
        fringe&=(rgba[:,:,:3].min(2)>225)&(np.ptp(rgba[:,:,:3].astype(np.int16),axis=2)<18)
        out[fringe]=0;removed+=int(fringe.sum())
    return out,{'underarm_background_pixels_removed':removed}


def fit_cuff_proportions(rgba,body,prompt=''):
    """Bound excessive cuff ease around each wrist, preserving a continuous shaft.

    This is a single smooth coordinate transform, not painted replacement
    fabric. Shoulders, torso and lower garment stay pinned. Ambiguous merged
    cuffs are left for review rather than cutting a guessed sleeve rectangle.
    """
    import re
    if re.search(r'short[- ]sleeve|short sleeves|sleeveless|cap sleeves',prompt,re.I) or not re.search(r'long[- ]sleeve|long sleeves|cardigan|hoodie|sweater|jacket',prompt,re.I):
        return rgba.copy(),{'cuffs':[]}
    h,w=rgba.shape[:2];yy,xx=np.indices((h,w),dtype=np.float32)
    mx=xx.copy();my=yy.copy();reports=[];parameters=[]
    def runs(row):
        x=np.flatnonzero(row)
        return [r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)]
    geometry=[]
    for y in range(round(h*.40),round(h*.64)):
        rr=runs(rgba[y,:,3]>32);central=next((r for r in rr if r[0]<=w/2<=r[-1]),None)
        if central is None:continue
        l=[r for r in rr if r[-1]<central[0]];r=[r for r in rr if r[0]>central[-1]]
        if l and r:geometry.append([y,l[-1][0],l[-1][-1],central[0],central[-1],r[0][0],r[0][-1]])
    if len(geometry)<5:return rgba.copy(),{'cuffs':[],'method':'ambiguous-sleeve-seams','review_required':True}
    geom=np.array(geometry,np.float32)
    if np.max(np.diff(geom[:,0]))>max(6,h*.012):
        return rgba.copy(),{'cuffs':[],'method':'ambiguous-sleeve-seams','review_required':True,'reason':'Sleeves join the lower garment; automatic narrowing would distort that join.'}
    root=max(round(h*.40),int(geom[0,0])-round(h*.025))
    source_end=int(geom[-1,0])
    for side,index,cols in [('left',0,(1,2)),('right',-1,(5,6))]:
        rows=[]
        for y in range(round(h*.49),round(h*.56)):
            rr=runs(body[y,:,3]>128)
            if len(rr)==3 and rr[1][0]<w/2<rr[1][-1]:rows.append((y,rr[index]))
        if not rows:continue
        wrist,arm=min(rows,key=lambda v:len(v[1]));bw=len(arm)
        # Measure actual cuff rows near the source sleeve END, not the broad
        # balloon sleeve that happens to overlap the avatar's wrist row.
        tail=geom[geom[:,0]>=source_end-h*.022]
        sw=float(np.median(tail[:,cols[1]]-tail[:,cols[0]]+1))
        scale=float(np.clip((bw*1.25+4)/max(1,sw),.45,1.25))
        target_end=wrist+round(h*.012)
        move=float(np.clip(source_end-target_end,-h*.02,h*.065))
        parameters.append((index,cols,wrist,arm,scale,move,target_end))
        reports.append({'side':side,'fitted':True,'applied':True,'wrist_row':int(wrist),'source_width':sw,'wrist_width':bw,'scale':scale,'source_end':source_end,'target_end':target_end,'move_y':-move})
    end=min(round(h*.66),max(source_end,round(h*.56))+round(h*.035))
    for y in range(root,end):
        c0=float(np.interp(y,geom[:,0],geom[:,3]));c1=float(np.interp(y,geom[:,0],geom[:,4]))
        source_x=[0.,c0,c1,float(w-1)];target_x=source_x.copy();source_y=[float(y)]*4
        for index,cols,wrist,arm,scale,move,target_end in parameters:
            t=float(np.clip((y-root)/max(1,target_end-root),0,1));t=t*t*(3-2*t)
            sy=float(y+move*t)
            lo=float(np.interp(sy,geom[:,0],geom[:,cols[0]]));hi=float(np.interp(sy,geom[:,0],geom[:,cols[1]]))
            sc=(lo+hi)/2
            br=runs(body[min(wrist,max(root,y)),:,3]>128)
            bc=(br[index][0]+br[index][-1])/2 if len(br)==3 else (arm[0]+arm[-1])/2
            tc=sc+(bc-sc)*t;local=1+(scale-1)*t
            tl=tc-(hi-lo)*local/2;th=tc+(hi-lo)*local/2
            if index==0:th=min(th,c0-2);tl=min(tl,th-4)
            else:tl=max(tl,c1+2);th=max(th,tl+4)
            # Include the original outer sleeve boundary in the mesh domain,
            # so moving its end upward removes the old end without a patch.
            # The source sleeve is a separate layer, so its whole inverse map
            # can stay affine across the transparent gap. Interpolating Y back
            # toward the torso through that gap would expose sleeve fragments.
            domain=slice(0,int(c0)) if index==0 else slice(int(c1)+1,w)
            adjusted_scale=max(.1,(th-tl)/max(1,hi-lo));adjusted_center=(tl+th)/2
            mx[y,domain]=(xx[y,domain]-adjusted_center)/adjusted_scale+sc
            my[y,domain]=sy
    # Resample the sleeve layer alone. Sampling the full outfit at an upward
    # shifted Y can pull skirt pixels into the cuff/gap, despite pinned torso
    # knots. Explicit source-layer separation prevents that duplication.
    moving=np.zeros((h,w),bool)
    for y in range(root,min(h,source_end+3)):
        c0=int(np.interp(y,geom[:,0],geom[:,3]));c1=int(np.interp(y,geom[:,0],geom[:,4]))
        moving[y,:c0]=rgba[y,:c0,3]>0;moving[y,c1+1:]=rgba[y,c1+1:,3]>0
    layer=rgba.copy();layer[~moving]=0
    p=layer.astype(np.float32)/255;p[:,:,:3]*=p[:,:,3:4]
    p=cv2.remap(p,mx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT);a=np.clip(p[:,:,3:4],0,1)
    rgb=np.divide(p[:,:,:3],a,out=np.zeros_like(p[:,:,:3]),where=a>0)
    pixels=np.rint(np.clip(np.concatenate([rgb,a],axis=2)*255,0,255)).astype(np.uint8);pixels[pixels[:,:,3]==0]=0
    out=rgba.copy();out[moving]=0
    # Source over, leaving all static artwork byte-identical outside the moved
    # sleeve's actual silhouette. No hard mask cuts at destination boundaries.
    oa=out[:,:,3:4].astype(np.float32)/255;pa=pixels[:,:,3:4].astype(np.float32)/255
    alpha=pa+oa*(1-pa);color=pixels[:,:,:3]*pa+out[:,:,:3]*oa*(1-pa)
    color=np.divide(color,alpha,out=np.zeros_like(color),where=alpha>0)
    composite=np.rint(np.clip(np.concatenate([color,alpha*255],axis=2),0,255)).astype(np.uint8)
    affected=moving|(pixels[:,:,3]>0);out[affected]=composite[affected];out[out[:,:,3]==0]=0
    return out,{'cuffs':reports,'method':'monotonic-anatomical-mesh'}


def fit_closed_shoes(rgba, body_rgba, allow_reposition=False):
    if rgba.shape != body_rgba.shape or rgba.ndim != 3 or rgba.shape[2] != 4:
        raise ValueError('Outfit and body must be matching RGBA images')
    h,w=rgba.shape[:2];yy,xx=np.indices((h,w));result=rgba.copy();reports=[]
    for side,half in [('left',xx<w//2),('right',xx>=w//2)]:
        # Identify complete footwear components before selecting a lower ROI.
        # Cropping at 78% cut long hems into false shoe components and discarded
        # valid socks starting above that row. Never move the upper garment.
        mask=((rgba[:,:,3]>0)&half).astype(np.uint8)
        count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
        source=np.zeros((h,w),bool)
        for label in range(1,count):
            bx,by,bw,bh,area=stats[label]
            if area>=30 and by>h*.70 and by+bh>h*.90:
                source|=labels==label
        region=source
        y,x=np.where(source)
        if len(x)<30:
            reports.append({'side':side,'fitted':False,'reason':'No separate footwear found'});continue
        x0,x1,y0,y1=int(x.min()),int(x.max()+1),int(y.min()),int(y.max()+1)
        if allow_reposition:
            # Include calves beneath the sock cuff, not just toes. Ignore a few
            # opening rows so intentional exposed leg above the cuff is allowed.
            widths=source.sum(axis=1)
            cuff_rows=np.where(widths>max(8,w*.025))[0]
            cuff=int(cuff_rows[0]) if len(cuff_rows) else y0
            start=cuff+max(3,round(h*.007))
            target=(body_rgba[:,:,3]>128)&half&(yy>=start)
        else:
            start=int(h*.92)+1
            target=(body_rgba[:,:,3]>128)&half&(yy>int(h*.92))
        if not target.any():
            reports.append({'side':side,'fitted':False,'reason':'No body foot region'});continue
        source_rgba=np.zeros_like(rgba);source_rgba[region]=rgba[region]
        # Interpolate premultiplied colors to avoid black halos at transformed edges.
        premul=source_rgba.astype(np.float32)/255;premul[:,:,:3]*=premul[:,:,3:4]
        # Search only the target foot rows. Full-canvas warps for every candidate
        # were wasteful; keep the final color transform full-size and unchanged.
        target_start=int(np.where(target)[0].min())
        target_rows=target[target_start:]
        cx=(x0+x1-1)/2;best=None
        tx=np.where(target)[1];center_offset=float(np.clip((tx.min()+tx.max())/2-cx,-w*.05,w*.05))
        horizontal=sorted(set([-6,-3,0,3,6]+[round(center_offset)+v for v in [-6,-3,0,3,6]])) if allow_reposition else [-6,-3,0,3,6]
        for sx in (1.,1.04,1.08,1.12,1.16,1.20,1.24,1.32,1.40):
            for sy in (1.,1.04,1.08,1.12,1.16,1.20,1.24):
                for dy in ((0,3,6,9,12,18,24,30) if allow_reposition else (0,3,6,9,12)):
                    for dx in horizontal:
                        penalty=(sx-1)*100+(sy-1)*100+dy+abs(dx)
                        if best is not None and best[2]==0 and penalty>=best[0]:continue
                        matrix=np.array([[sx,0,cx*(1-sx)+dx],[0,sy,y0*(1-sy)+dy]],np.float32)
                        search_matrix=matrix.copy();search_matrix[1,2]-=target_start
                        alpha=cv2.warpAffine(source_rgba[:,:,3],search_matrix,(w,h-target_start))
                        missed=int((target_rows&(alpha<220)).sum());score=missed*1000+penalty
                        if best is None or score<best[0]:best=(score,matrix,missed,sx,sy,dy,dx)
        _,matrix,missed,sx,sy,dy,dx=best
        warped=cv2.warpAffine(premul,matrix,(w,h));alpha=warped[:,:,3:4]
        colors=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>0)
        fitted=np.rint(np.clip(np.concatenate([colors,alpha],axis=2)*255,0,255)).astype(np.uint8)
        unchanged=result.copy()
        result[source]=0
        # Source-over composite; clothing outside the footwear region stays intact.
        a=fitted[:,:,3:4].astype(np.float32)/255;b=result[:,:,3:4].astype(np.float32)/255
        outa=a+b*(1-a);rgb=fitted[:,:,:3]*a+result[:,:,:3]*b*(1-a)
        rgb=np.divide(rgb,outa,out=np.zeros_like(rgb),where=outa>0)
        result=np.clip(np.concatenate([rgb,outa*255],axis=2),0,255).astype(np.uint8)
        affected=region|(fitted[:,:,3]>0)
        result[~affected]=unchanged[~affected]
        before=int((target&(source_rgba[:,:,3]<220)).sum())
        reports.append({'side':side,'fitted':missed==0,'foot_pixels_exposed_before':before,'foot_pixels_exposed_after':missed,'scale_x':sx,'scale_y':sy,'move_down':dy,'move_sideways':dx,'coverage_start_row':start,'coverage_includes_sock_shaft':allow_reposition})
    result[result[:,:,3]==0]=0
    return result,{'closed_shoes_only':True,'feet':reports,'review_required':True,'automatic_save_allowed':False}

def fit_sleeve_widths(rgba,body_rgba,prompt=''):
    """Fit sleeves with a continuous deformation field and intact rigid cuffs.

    No rectangular patches, per-row image copies, cloned pixels or shoulder
    masks. The field fades through empty space and is sampled once in premul.
    """
    import re
    h,w=rgba.shape[:2];result=rgba.copy();skipped=0;changed=0;cuffs=[];natural_sleeves=0
    if re.search(r'\b(short[- ]sleeved?|short sleeves|sleeveless|cap sleeves)\b',prompt,re.I) or not re.search(r'\b(long[- ]sleeved?|long sleeves|full[- ]length sleeves|cardigan|hoodie|sweater|jacket)\b',prompt,re.I):
        return result,{'rows_resized':0,'rows_needing_review':0,'shoulder_pixels_modified':0}
    def runs(row):
        x=np.flatnonzero(row)
        return [r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)]
    body_rows=[]
    for y in range(round(h*.40),round(h*.565)):
        parts=runs(body_rgba[y,:,3]>128)
        if len(parts)>=3 and any(r[0]<=w/2<=r[-1] for r in parts):body_rows.append((y,parts))
    yy,xx=np.indices((h,w),dtype=np.float32);field_x=np.zeros((h,w),np.float32);field_y=np.zeros_like(field_x)
    for index in [0,-1]:
        candidates=[(y,parts[index]) for y,parts in body_rows if y>=h*.49]
        if not candidates:continue
        wrist,wrist_arm=min(candidates,key=lambda yr:len(yr[1]));samples=[]
        exposed=0
        for row,parts in body_rows:
            if row<=wrist:exposed+=int((rgba[row,parts[index][2:-2],3]<220).sum())
        if exposed==0:
            natural_sleeves+=1
            continue
        for y,parts in body_rows:
            if y>wrist:continue
            arm=parts[index];center=(arm[0]+arm[-1])/2
            pieces=[r for r in runs(rgba[y,:,3]>32) if r[-1]>=arm[0] and r[0]<=arm[-1] and ((r[-1]<w*.46) if index==0 else (r[0]>w*.54))]
            if not pieces:skipped+=1;continue
            piece=min(pieces,key=lambda r:abs((r[0]+r[-1])/2-center));a,b=float(piece[0]),float(piece[-1]+1)
            lo=min(a,float(arm[0])-2);hi=max(b,float(arm[-1])+3)
            if (hi-lo)/(b-a)>1.6 or max(a-lo,hi-b)>w*.03:skipped+=1;continue
            samples.append((y,a,b,lo,hi));changed+=int(lo<a or hi>b)
        if not samples:continue
        sample=np.array(samples,np.float32);first=int(sample[0,0]);join=max(round(h*.35),first-round(h*.035))
        cuff_end=wrist;cuff_rows=[]
        for y in range(max(0,wrist-round(h*.012)),min(h,wrist+max(3,round(h*.025)))):
            pieces=[r for r in runs(rgba[y,:,3]>32) if r[-1]>=wrist_arm[0] and r[0]<=wrist_arm[-1] and ((r[-1]<w*.46) if index==0 else (r[0]>w*.54))]
            if not pieces:
                if y>=wrist:break
                continue
            piece=min(pieces,key=lambda r:abs((r[0]+r[-1])/2-(wrist_arm[0]+wrist_arm[-1])/2));cuff_rows.append((y,piece));cuff_end=y
        cx=float(np.median([(r[0]+r[-1])/2 for _,r in cuff_rows])) if cuff_rows else float((wrist_arm[0]+wrist_arm[-1])/2)
        dx=float(np.clip((wrist_arm[0]+wrist_arm[-1])/2-cx,-w*.015,w*.015));dy=float(np.clip(wrist+round(h*.012)-cuff_end,-h*.012,h*.012))
        cuff_left=min((int(r[0]) for _,r in cuff_rows),default=int(wrist_arm[0]));cuff_right=max((int(r[-1]+1) for _,r in cuff_rows),default=int(wrist_arm[-1]+1))
        cuffs.append({'wrist_row':wrist,'source_end':cuff_end,'move_x':dx,'move_y':dy,'scale':1.0})
        end=min(h,max(cuff_end,round(cuff_end+dy))+round(h*.016));columns=np.arange(w,dtype=np.float32)
        for y in range(join,end):
            a,b,lo,hi=[float(np.interp(y,sample[:,0],sample[:,i])) for i in range(1,5)]
            # Affine through the sleeve, Gaussian fade OUTSIDE it. Every
            # transition is continuous; no edited rectangular cut boundary.
            inside=np.clip((columns-lo)/max(1,hi-lo),0,1);delta=(a-lo)*(1-inside)+(b-hi)*inside
            distance=np.maximum(lo-columns,columns-hi).clip(0)
            sigma=max(2,(hi-lo)*.22);fade=np.exp(-.5*(distance/sigma)**2)
            # Keep the nearby torso fixed across the transparent arm gap.
            parts=next((p for row,p in body_rows if row==min(wrist,max(first,y))),None)
            if parts is not None:
                source_parts=runs(rgba[y,:,3]>32)
                torso=next((r for r in source_parts if r[0]<=w/2<=r[-1]),None)
                if torso is None:torso=next((r for r in parts if r[0]<=w/2<=r[-1]),None)
                if torso is not None:
                    gap=max(1,float(torso[0])-hi) if index==0 else max(1,lo-float(torso[-1]))
                    inner_dist=np.maximum(columns-hi,0) if index==0 else np.maximum(lo-columns,0)
                    q=np.clip(1-inner_dist/max(1,gap*.55),0,1);fade*=q*q*(3-2*q)
            t=np.clip((y-join)/max(1,first-join),0,1);t=t*t*(3-2*t)
            shaft=delta*fade*t
            t=np.clip((y-(wrist-h*.04))/max(1,h*.03),0,1);t=t*t*(3-2*t)
            edge=np.maximum(cuff_left-4-columns,columns-cuff_right-4).clip(0)
            cuff_fade=np.exp(-.5*(edge/max(3,w*.012))**2)
            central=next((r for r in runs(rgba[y,:,3]>32) if r[0]<=w/2<=r[-1]),None)
            if central is not None:
                gap=max(1,float(central[0])-cuff_right) if index==0 else max(1,cuff_left-float(central[-1]))
                inward=np.maximum(columns-cuff_right,0) if index==0 else np.maximum(cuff_left-columns,0)
                q=np.clip(1-inward/max(1,gap*.5),0,1);cuff_fade*=q*q*(3-2*q)
            field_x[y]+=shaft*(1-t)+(-dx)*cuff_fade*t
            field_y[y]+=(-dy)*cuff_fade*t
    field_x=cv2.GaussianBlur(field_x,(1,9),1.2);field_y=cv2.GaussianBlur(field_y,(1,9),1.2)
    # Protect both destination AND sampled source of the central garment.
    # Otherwise moving a cuff can sample a skirt edge into empty space while
    # leaving its original pixels intact, producing a duplicated sliver.
    central_mask=np.zeros((h,w),np.uint8)
    for y in range(round(h*.40),round(h*.65)):
        source_parts=runs(rgba[y,:,3]>32)
        central=next((r for r in source_parts if r[0]<=w/2<=r[-1]),None)
        if central is not None and (len(source_parts)>=3 or y>=round(h*.47)):
            lo=max(0,int(central[0])-4);hi=min(w,int(central[-1])+5)
            central_mask[y,lo:hi]=1
    sampled_central=cv2.remap(central_mask,xx+field_x,yy+field_y,cv2.INTER_NEAREST,borderMode=cv2.BORDER_CONSTANT)>0
    lock=(central_mask>0)|sampled_central
    field_x[lock]=0;field_y[lock]=0
    # Explicitly lock neck/shoulders and footwear, irrespective of blur support.
    field_x[:round(h*.35)]=0;field_y[:round(h*.35)]=0
    field_x[round(h*.62):]=0;field_y[round(h*.62):]=0
    affected=(np.abs(field_x)>.001)|(np.abs(field_y)>.001)
    premul=rgba.astype(np.float32)/255;premul[:,:,:3]*=premul[:,:,3:4]
    sampled=cv2.remap(premul,xx+field_x,yy+field_y,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
    alpha=np.clip(sampled[:,:,3:4],0,1);rgb=np.divide(sampled[:,:,:3],alpha,out=np.zeros_like(sampled[:,:,:3]),where=alpha>0)
    fitted=np.rint(np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255)).astype(np.uint8);fitted[fitted[:,:,3]==0]=0
    result[affected]=fitted[affected]
    return result,{'rows_resized':changed,'rows_needing_review':skipped,'shoulder_pixels_modified':0,'maximum_width_ratio':1.6,'cuff_end_bounded':True,'resampling':'continuous-field-single-pass','cuff_fit':'rigid-translation','cuff_transforms':cuffs,'naturally_fitted_sleeves':natural_sleeves}

