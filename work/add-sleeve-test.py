from pathlib import Path
p=Path('tests/test_clothing_fit.py');s=p.read_text().replace('from clothing_fit import fit_closed_shoes','from clothing_fit import fit_closed_shoes,fit_sleeve_widths');i=s.index(' def test_missing_shoes');s=s[:i]+''' def test_sleeve_resize_improves_arms_without_touching_shoulders_or_hands(self):
  a=np.zeros((400,200,4),np.uint8);b=np.zeros_like(a)
  b[140:230,80:120]=[245,210,180,255];a[140:230,75:125]=[30,90,150,255]
  for x in (40,140):
   b[160:225,x:x+20]=[245,210,180,255]
   b[225:230,x+2:x+18]=[245,210,180,255]
   a[160:235,x+4:x+16]=[30,90,150,255]
  original=a.copy();fit,r=fit_sleeve_widths(a,b,'long-sleeved dress')
  target=b[:,:,3]>0
  self.assertLess(int((target&(fit[:,:,3]<220)).sum()),int((target&(a[:,:,3]<220)).sum()))
  self.assertGreater(r['rows_resized'],0)
  self.assertTrue(np.array_equal(fit[:160],a[:160]))
  self.assertTrue(np.array_equal(fit[226:],a[226:]))
  self.assertTrue(np.array_equal(a,original))
  short,_=fit_sleeve_widths(a,b,'short-sleeved dress');self.assertTrue(np.array_equal(short,a))
''' +s[i:];p.write_text(s)
p=Path('tests/test_garment_only.py');s=p.read_text().replace("r['fit_version'],7","r['fit_version'],8");p.write_text(s)
