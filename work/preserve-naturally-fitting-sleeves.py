from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text().replace('h,w=rgba.shape[:2];result=rgba.copy();skipped=0;changed=0;cuffs=[]','h,w=rgba.shape[:2];result=rgba.copy();skipped=0;changed=0;cuffs=[];natural_sleeves=0');s=s.replace('''        wrist,wrist_arm=min(candidates,key=lambda yr:len(yr[1]));samples=[]
        for y,parts in body_rows:''','''        wrist,wrist_arm=min(candidates,key=lambda yr:len(yr[1]));samples=[]
        exposed=0
        for row,parts in body_rows:
            if row<=wrist:exposed+=int((rgba[row,parts[index][2:-2],3]<220).sum())
        if exposed==0:
            natural_sleeves+=1
            continue
        for y,parts in body_rows:''');s=s.replace("'cuff_transforms':cuffs}","'cuff_transforms':cuffs,'naturally_fitted_sleeves':natural_sleeves}");p.write_text(s)
p=Path('tests/test_clothing_fit.py');s=p.read_text();a=s.index(' def test_missing_shoes');s=s[:a]+''' def test_already_fitted_sleeves_and_cuffs_remain_pixel_identical(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255]
   b[225:230,x+2:x+18]=[245,210,180,255]
   a[155:236,x-4:x+24]=[160,140,190,255]
   a[215:236,x-4:x+24,:3]=np.random.default_rng(x).integers(50,220,(21,28,3),dtype=np.uint8)
  b[140:230,80:120]=[245,210,180,255];a[140:270,70:130]=[120,85,160,255]
  fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  self.assertTrue(np.array_equal(a,fit));self.assertEqual(r['naturally_fitted_sleeves'],2)
''' +s[a:];p.write_text(s)
