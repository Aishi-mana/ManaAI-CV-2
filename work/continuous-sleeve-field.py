from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();s=s[:s.index('def fit_sleeve_widths')]+'''def fit_sleeve_widths(rgba,body_rgba,prompt=''):
    """Fit sleeves with a continuous deformation field and intact rigid cuffs.

    No rectangular patches, per-row image copies, cloned pixels or shoulder
    masks. The field fades through empty space and is sampled once in premul.
    """
    import re
    h,w=rgba.shape[:2];result=rgba.copy();skipped=0;changed=0;cuffs=[]
    if re.search(r'\\b(short[- ]sleeved?|short sleeves|sleeveless|cap sleeves)\\b',prompt,re.I) or not re.search(r'\\b(long[- ]sleeved?|long sleeves|full[- ]length sleeves|cardigan|hoodie|sweater|jacket)\\b',prompt,re.I):
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
                torso=next((r for r in parts if r[0]<=w/2<=r[-1]),None)
                if torso is not None:
                    gap=max(1,float(torso[0])-hi) if index==0 else max(1,lo-float(torso[-1]))
                    inner_dist=np.maximum(columns-hi,0) if index==0 else np.maximum(lo-columns,0)
                    fade*=np.exp(-.5*(inner_dist/max(.75,gap*.3))**2)
            t=np.clip((y-join)/max(1,first-join),0,1);t=t*t*(3-2*t)
            shaft=delta*fade*t
            t=np.clip((y-(wrist-h*.04))/max(1,h*.03),0,1);t=t*t*(3-2*t)
            edge=np.maximum(cuff_left-4-columns,columns-cuff_right-4).clip(0)
            cuff_fade=np.exp(-.5*(edge/max(3,w*.012))**2)
            field_x[y]+=shaft*(1-t)+(-dx)*cuff_fade*t
            field_y[y]+=(-dy)*cuff_fade*t
    field_x=cv2.GaussianBlur(field_x,(1,9),1.2);field_y=cv2.GaussianBlur(field_y,(1,9),1.2)
    # Explicitly lock neck/shoulders and footwear, irrespective of blur support.
    field_x[:round(h*.35)]=0;field_y[:round(h*.35)]=0
    field_x[round(h*.62):]=0;field_y[round(h*.62):]=0
    affected=(np.abs(field_x)>.001)|(np.abs(field_y)>.001)
    premul=rgba.astype(np.float32)/255;premul[:,:,:3]*=premul[:,:,3:4]
    sampled=cv2.remap(premul,xx+field_x,yy+field_y,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
    alpha=np.clip(sampled[:,:,3:4],0,1);rgb=np.divide(sampled[:,:,:3],alpha,out=np.zeros_like(sampled[:,:,:3]),where=alpha>0)
    fitted=np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255).astype(np.uint8);fitted[fitted[:,:,3]==0]=0
    result[affected]=fitted[affected]
    return result,{'rows_resized':changed,'rows_needing_review':skipped,'shoulder_pixels_modified':0,'maximum_width_ratio':1.6,'cuff_end_bounded':True,'resampling':'continuous-field-single-pass','cuff_fit':'rigid-translation','cuff_transforms':cuffs}
''';p.write_text(s)
