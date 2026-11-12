from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text().replace(''' rgba=np.array(Image.fromarray(source).resize((w,h),Image.Resampling.LANCZOS))
 if''',''' rgba=np.array(Image.fromarray(source).resize((w,h),Image.Resampling.LANCZOS))
 # A parsed bare-leg fill may be gone while its thin black contour still
 # joins skirt to sock. Clear only narrow rows WITH confirmed removed body.
 leg_outline_pixels=0
 if port_mask is not None:
  removed=np.array(Image.fromarray(port_mask.astype(np.uint8)*255).resize((w,h),Image.Resampling.NEAREST))>0
  thin=[]
  for row in range(round(h*.65),round(h*.90)):
   count=int((rgba[row,:,3]>32).sum())
   if 0<count<=max(12,w*.02) and removed[row].sum()>w*.025:thin.append(row)
  for band in np.split(np.array(thin,dtype=int),np.where(np.diff(thin)>1)[0]+1) if thin else []:
   if len(band)>=max(3,round(h*.004)):
    leg_outline_pixels+=int((rgba[band,:,3]>0).sum());rgba[band]=0
 if''');s=s.replace("'fit_version':9,","'fit_version':9,'leg_outline_pixels_removed':leg_outline_pixels,");p.write_text(s)
p=Path('scripts/clothing_fit.py');s=p.read_text();a=s.index('        cx=(x0+x1-1)/2;best=None');b=s.index('          ',a) if False else a
s=s.replace('''        cx=(x0+x1-1)/2;best=None
        for sx in (1.,1.04,1.08,1.12,1.16,1.20,1.24):
            for sy in (1.,1.04,1.08,1.12):''','''        cx=(x0+x1-1)/2;best=None
        tx=np.where(target)[1];center_offset=float(np.clip((tx.min()+tx.max())/2-cx,-w*.05,w*.05))
        horizontal=sorted(set([-6,-3,0,3,6]+[round(center_offset)+v for v in [-6,-3,0,3,6]])) if allow_reposition else [-6,-3,0,3,6]
        for sx in (1.,1.04,1.08,1.12,1.16,1.20,1.24,1.32,1.40):
            for sy in (1.,1.04,1.08,1.12,1.16,1.20,1.24):''').replace('for dx in (-6,-3,0,3,6):','for dx in horizontal:');p.write_text(s)
