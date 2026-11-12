from PIL import Image
import numpy as np,sys
sys.path.insert(0,'scripts');from outfit_quality import _runs
p='exports/images/collar-arm-20261030/mint-dress/';a=np.array(Image.open(p+'outfit.png'));b=np.array(Image.open(p+'avatar-body.png'));h,w=a.shape[:2]
for side,index,wrist in [('left',0,679),('right',-1,675)]:
 target=np.zeros((h,w),bool)
 for y in range(round(h*.4),wrist+1):
  r=_runs(b[y,:,3]>128)
  if len(r)>=3:target[y,r[index][2:-2]]=True
 print(side,list(zip(*np.where(target&(a[:,:,3]<220))))[:15])
