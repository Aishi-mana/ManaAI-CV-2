from PIL import Image
import numpy as np,sys
sys.path.insert(0,'scripts');from outfit_quality import _runs
p='exports/images/fresh-production-20261030/lavender-isolation-replay/';a=np.array(Image.open(p+'before-sleeves.png'));b=np.array(Image.open(p+'avatar-body.png'));h,w=a.shape[:2]
for index,wrist in [(0,679),(-1,675)]:
 miss=0;total=0
 for y in range(round(h*.4),wrist+1):
  r=_runs(b[y,:,3]>128)
  if len(r)>=3:
   target=r[index][2:-2];miss+=int((a[y,target,3]<220).sum());total+=len(target)
 print(index,miss,total)
