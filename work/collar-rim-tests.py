from pathlib import Path
p=Path('scripts/outfit_quality.py');s=p.read_text().replace('''    if protected is not None:remove&=~protected
    result[remove]=0
    return result,{'dark_collar_fill_pixels_removed':int(remove.sum())}''','''    # The upper dark outline belonged to the discarded back-facing insert.
    # Remove its narrow overhang; retain the lower line defining the real collar.
    for column in range(x,x+bw):
        rows=np.flatnonzero(remove[:,column])
        if not len(rows):continue
        first=int(rows[0])
        for row in range(max(top,first-3),first):
            if rgba[row,column,3]>0 and int(rgb[row,column].max())<90:remove[row,column]=True
    if protected is not None:remove&=~protected
    result[remove]=0
    return result,{'dark_collar_fill_pixels_removed':int(remove.sum())}''');p.write_text(s)
p=Path('tests/test_outfit_quality.py');s=p.read_text().replace('broader_fit_checks,clean_opening_edges','broader_fit_checks,clean_opening_edges,clean_collar_insert');at=s.index("if __name__");s=s[:at]+''' def test_dark_collar_insert_removed_but_fabric_lower_outline_and_protected_pixels_kept(self):
  a=np.zeros((100,100,4),np.uint8);a[31:35,42:58]=[65,117,102,255]
  a[35:36,42:58]=[20,30,25,255];a[36:60,40:60]=[138,227,188,255]
  a[30,42:46]=[20,30,25,255]
  protected=np.zeros((100,100),bool);protected[32,43]=True
  before=a.copy();out,r=clean_collar_insert(a,[45,10,55,30],protected)
  self.assertGreater(r['dark_collar_fill_pixels_removed'],0);self.assertEqual(out[32,50,3],0)
  self.assertTrue(np.array_equal(out[35:],a[35:]));self.assertTrue(np.array_equal(out[32,43],a[32,43]))
  self.assertTrue(np.array_equal(a,before))
 def test_dark_garment_continuing_below_collar_is_not_treated_as_insert(self):
  a=np.zeros((100,100,4),np.uint8);a[31:60,40:60]=[40,70,110,255]
  out,r=clean_collar_insert(a,[45,10,55,30]);self.assertEqual(r['dark_collar_fill_pixels_removed'],0);self.assertTrue(np.array_equal(a,out))
''' +s[at:];p.write_text(s)
