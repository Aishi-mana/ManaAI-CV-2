from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();s=s.replace('''                torso=next((r for r in parts if r[0]<=w/2<=r[-1]),None)''','''                source_parts=runs(rgba[y,:,3]>32)
                torso=next((r for r in source_parts if r[0]<=w/2<=r[-1]),None)
                if torso is None:torso=next((r for r in parts if r[0]<=w/2<=r[-1]),None)''')
s=s.replace('''            cuff_fade=np.exp(-.5*(edge/max(3,w*.012))**2)
            field_x[y]''','''            cuff_fade=np.exp(-.5*(edge/max(3,w*.012))**2)
            central=next((r for r in runs(rgba[y,:,3]>32) if r[0]<=w/2<=r[-1]),None)
            if central is not None:
                gap=max(1,float(central[0])-cuff_right) if index==0 else max(1,cuff_left-float(central[-1]))
                inward=np.maximum(columns-cuff_right,0) if index==0 else np.maximum(cuff_left-columns,0)
                q=np.clip(1-inward/max(1,gap*.5),0,1);cuff_fade*=q*q*(3-2*q)
            field_x[y]''')
s=s.replace('''    # Explicitly lock neck/shoulders and footwear, irrespective of blur support.''','''    # Lock the central garment after vertical smoothing as a final isolation
    # guard. Cuff motion must never create a notch in a nearby skirt edge.
    for y in range(round(h*.47),round(h*.62)):
        central=next((r for r in runs(rgba[y,:,3]>32) if r[0]<=w/2<=r[-1]),None)
        if central is not None:
            lo=max(0,int(central[0])-2);hi=min(w,int(central[-1])+3)
            field_x[y,lo:hi]=0;field_y[y,lo:hi]=0
    # Explicitly lock neck/shoulders and footwear, irrespective of blur support.''');p.write_text(s)
p=Path('tests/test_clothing_fit.py');s=p.read_text();at=s.index(' def test_missing_shoes');s=s[:at]+''' def test_cuff_motion_does_not_cut_or_patch_the_nearby_skirt(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  a[140:290,66:134]=[120,85,160,255];b[140:230,80:120]=[245,210,180,255]
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255];b[225:230,x+2:x+18]=[245,210,180,255]
   a[160:235,x+3:x+19]=[160,140,190,255]
  fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  self.assertTrue(np.array_equal(fit[160:290,66:134],a[160:290,66:134]))
''' +s[at:];p.write_text(s)
