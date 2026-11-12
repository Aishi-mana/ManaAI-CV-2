from pathlib import Path
from PIL import Image
import numpy as np,shutil,sys,json
sys.path.insert(0,'scripts');import garment_only
root=Path('exports/images/fresh-production-20261030');dst=root/'lavender-isolation-replay';shutil.copytree(root/'final-lavender',dst,dirs_exist_ok=True);real=garment_only.fit_sleeve_widths
checks=[]
def verify(a,b,p):
 out,r=real(a,b,p);h,w=a.shape[:2];pixels=0
 for y in range(round(h*.47),round(h*.62)):
  x=np.flatnonzero(a[y,:,3]>32)
  runs=[v for v in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(v)]
  central=next((v for v in runs if v[0]<=w/2<=v[-1]),None)
  if central is not None:
   assert np.array_equal(a[y,central],out[y,central]),y;pixels+=len(central)
 checks.append({'central_garment_pixels_unchanged':pixels});return out,r
garment_only.fit_sleeve_widths=verify;r=garment_only.prepare_garment_only(dst,dst/'avatar-body.png');(dst/'isolation-check.json').write_text(json.dumps(checks));print(checks,r['fit_warnings'])
