from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text().replace("'cuff_fit':'rigid-translation'","'cuff_fit':'rigid-translation','cuff_transforms':[{'wrist_row':int(c[0]),'source_end':int(c[1]),'move_x':float(c[3]),'move_y':float(c[4]),'scale':1.0} for c in cuffs]");p.write_text(s)
p=Path('tests/test_clothing_fit.py');s=p.read_text().replace("  self.assertGreater(r['rows_resized'],0)","  self.assertGreater(r['rows_resized'],0)\n  self.assertTrue(all(c['scale']==1.0 for c in r['cuff_transforms']))");p.write_text(s)
p=Path('tests/test_outfit_quality.py');s=p.read_text().replace("  self.assertTrue(np.array_equal(out[30,43],a[30,43]));", "  self.assertTrue(((out[:,:,3]>0)&(out[:,:,3]<255)).any());self.assertTrue(np.array_equal(out[30,43],a[30,43]));");p.write_text(s)
