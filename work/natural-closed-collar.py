from pathlib import Path
p=Path('scripts/outfit_quality.py');s=p.read_text().replace("    if not (remove&near).any():return result,empty", "    # A real generated neck hole can be enclosed by its dark collar outline.\n    # The bounded bowl/contrast checks above still apply; retain the outline\n    # itself rather than requiring an artificial cut to reach the fill.");p.write_text(s)
p=Path('tests/test_outfit_quality.py');s=p.read_text();at=s.index(' def test_dark_garment_continuing');s=s[:at]+''' def test_enclosed_collar_fill_uses_original_curved_outline(self):
  a=np.zeros((100,100,4),np.uint8);a[28:60,35:65]=[138,227,188,255]
  a[30:38,37:63]=[20,30,25,255];a[31:37,38:62]=[65,117,102,255]
  out,r=clean_collar_insert(a,[40,10,60,30]);self.assertGreater(r['dark_collar_fill_pixels_removed'],0)
  self.assertEqual(out[34,50,3],0);self.assertTrue(np.array_equal(out[30,45],a[30,45]))
''' +s[at:];p.write_text(s)
