from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();s=s.replace("result=rgba.copy();h,w=rgba.shape[:2];changed=0;skipped=0","result=rgba.copy();h,w=rgba.shape[:2];changed=0;skipped=0\n    map_y,map_x=np.indices((h,w),dtype=np.float32);affected=np.zeros((h,w),bool);cuffs=[]")
s=s.replace('''        rows=[(y,parts[index]) for y,parts in body_rows if y<=wrist]''','''        cuff_rows=[]
        for cy in range(max(0,wrist-round(h*.012)),cuff_end+1):
            pieces=[r for r in runs(rgba[cy,:,3]>32) if r[-1]>=wrist_arm[0] and r[0]<=wrist_arm[-1] and ((r[-1]<w*.46) if index==0 else (r[0]>w*.54))]
            if pieces:cuff_rows.append((cy,min(pieces,key=lambda r:abs((r[0]+r[-1])/2-(wrist_arm[0]+wrist_arm[-1])/2))))
        if cuff_rows:
            centers=[(r[0]+r[-1])/2 for _,r in cuff_rows];cx=float(np.median(centers))
            dx=float(np.clip((wrist_arm[0]+wrist_arm[-1])/2-cx,-w*.015,w*.015))
            dy=float(np.clip(wrist+round(h*.012)-cuff_end,-h*.012,h*.012))
            cuffs.append((wrist,cuff_end,cx,dx,dy,min(int(r[0]) for _,r in cuff_rows),max(int(r[-1])+1 for _,r in cuff_rows)))
        rows=[(y,parts[index]) for y,parts in body_rows if y<=wrist]''')
a=s.index('            # Extend only narrow edge bands.');b=s.index("    return result,{'rows_resized':changed",a)
s=s[:a]+'''            # Store coordinates, then resample the complete sleeve only once.
            band=min((x1-x0)/3,max(3,w*.015))
            positions=np.arange(lo,hi,dtype=np.float32)+.5
            map_x[y,lo:hi]=np.interp(positions,[lo,x0+band,x1-band,hi],[x0,x0+band,x1-band,x1]).astype(np.float32)-.5
            affected[y,lo:hi]=True;changed+=1
    for wrist,end,cx,dx,dy,left,right in cuffs:
        start=wrist-round(h*.025);join=max(round(h*.40),start-round(h*.015))
        x0=max(0,int(min(left,left+dx))-4);x1=min(w,int(max(right,right+dx))+5)
        for y in range(join,min(h,max(end,round(end+dy))+3)):
            t=min(1.,max(0.,(y-join)/max(1,start-join)));t=t*t*(3-2*t)
            # The decorated cuff translates as a rigid unit: no row-wise taper,
            # scaling, or changes to its embroidery and tilted end silhouette.
            map_x[y,x0:x1]=(1-t)*map_x[y,x0:x1]+t*(np.arange(x0,x1,dtype=np.float32)-dx)
            map_y[y,x0:x1]=y-dy*t
            affected[y,x0:x1]=True
    # Smooth coordinate changes along the arm, not the artwork itself.
    map_x=cv2.GaussianBlur(map_x,(1,5),.75)
    map_y=cv2.GaussianBlur(map_y,(1,5),.75)
    premul=rgba.astype(np.float32)/255;premul[:,:,:3]*=premul[:,:,3:4]
    sampled=cv2.remap(premul,map_x,map_y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    alpha=sampled[:,:,3:4];rgb=np.divide(sampled[:,:,:3],alpha,out=np.zeros_like(sampled[:,:,:3]),where=alpha>0)
    fitted=np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255).astype(np.uint8)
    result[affected]=fitted[affected]
''' +s[b:];s=s.replace("'cuff_end_bounded':True","'cuff_end_bounded':True,'resampling':'single-smooth-map','cuff_fit':'rigid-translation'")
p.write_text(s)
p=Path('scripts/outfit_quality.py');s=p.read_text().replace('''    result[remove]=0
    return result,{'dark_collar_fill_pixels_removed':int(remove.sum())}''','''    # Feather only the removed side of the boundary. The surrounding collar
    # and preserved back rim remain byte-identical, without a blurred outline.
    soft=cv2.GaussianBlur(remove.astype(np.float32),(3,3),.65)
    result[:,:,3][remove]=np.round(rgba[:,:,3][remove]*(1-soft[remove])).astype(np.uint8)
    result[result[:,:,3]==0]=0
    return result,{'dark_collar_fill_pixels_removed':int(remove.sum()),'collar_edge_refinement':'subpixel-interior'}''');p.write_text(s)
