from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();a=s.index('    # Lock the central garment after');b=s.index('    # Explicitly lock neck/shoulders',a);s=s[:a]+'''    # Protect both destination AND sampled source of the central garment.
    # Otherwise moving a cuff can sample a skirt edge into empty space while
    # leaving its original pixels intact, producing a duplicated sliver.
    central_mask=np.zeros((h,w),np.uint8)
    for y in range(round(h*.40),round(h*.65)):
        source_parts=runs(rgba[y,:,3]>32)
        central=next((r for r in source_parts if r[0]<=w/2<=r[-1]),None)
        if central is not None and len(source_parts)>=3:
            lo=max(0,int(central[0])-4);hi=min(w,int(central[-1])+5)
            central_mask[y,lo:hi]=1
    sampled_central=cv2.remap(central_mask,xx+field_x,yy+field_y,cv2.INTER_NEAREST,borderMode=cv2.BORDER_CONSTANT)>0
    lock=(central_mask>0)|sampled_central
    field_x[lock]=0;field_y[lock]=0
''' +s[b:];p.write_text(s)
p=Path('scripts/garment_only.py');s=p.read_text();a=s.index('def warp_garment_rgba');s=s[:a]+'''def refine_outfit_matte(rgba,rgb):
 # Recover partial coverage from a white matte only along the outer contour.
 # Preserve dark outline cores and all interior fabric / decorations.
 out=rgba.copy();near=cv2.dilate((rgba[:,:,3]==0).astype(np.uint8),np.ones((3,3),np.uint8))>0
 color=rgb.astype(np.float32);foreground=cv2.erode(color,np.ones((3,3),np.uint8))
 light=color.min(2);dark=foreground.min(2)
 edge=(rgba[:,:,3]>0)&near&(light>140)&(dark<190)&(light-dark>20)
 fraction=np.clip(np.max((255-color)/np.maximum(1,255-foreground),axis=2),.05,1)
 restored=np.clip((color-255*(1-fraction[:,:,None]))/fraction[:,:,None],0,255)
 out[:,:,:3][edge]=np.rint(restored[edge]).astype(np.uint8)
 out[:,:,3][edge]=np.rint(rgba[:,:,3][edge]*fraction[edge]).astype(np.uint8)
 out[out[:,:,3]==0]=0
 return out,int(edge.sum())

''' +s[a:];s=s.replace(''' rgba=np.array(Image.fromarray(source).resize''',''' source,matte_edge_pixels=refine_outfit_matte(source,rgb)
 rgba=np.array(Image.fromarray(source).resize''');s=s.replace("'fit_version':9,","'fit_version':9,'matte_edge_pixels_refined':matte_edge_pixels,");p.write_text(s)
