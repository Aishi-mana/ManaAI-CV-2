from pathlib import Path
p=Path('tests/test_clothing_fit.py');s=p.read_text();i=s.index(' def test_missing_shoes')
s=s[:i]+''' def test_long_hem_does_not_hide_separate_high_socks(self):
  outfit=np.zeros((200,200,4),np.uint8);body=np.zeros_like(outfit)
  outfit[50:160,75:125]=[80,40,130,255]
  for x in (40,140):
   outfit[148:194,x:x+16]=[220,225,240,255]
   body[156:199,x:x+16]=[245,210,180,255]
  original=outfit.copy();fitted,r=fit_closed_shoes(outfit,body,allow_reposition=True)
  self.assertTrue(all(f['fitted'] for f in r['feet']))
  self.assertTrue(np.array_equal(fitted[50:160,75:125],original[50:160,75:125]))
  self.assertTrue(np.array_equal(outfit,original))
''' +s[i:];p.write_text(s)
