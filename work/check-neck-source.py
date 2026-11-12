from pathlib import Path
import numpy as np,cv2
from PIL import Image
p=Path('exports/images/worn-fit-20261030/final-blue-confirmation');rgb=np.array(Image.open(p/'image.png').convert('RGB'));d=np.load(p/'opening-parsing/parsing.npz');labels=d['labels'];prob=d['probabilities'];h,w=labels.shape;yy,xx=np.indices(labels.shape)
hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV);skin=(hsv[:,:,0]<25)&(hsv[:,:,1]>30)&(hsv[:,:,2]>100)
roi=(yy>h*.265)&(yy<h*.335)&(xx>w*.4)&(xx<w*.6)
core=skin&roi&(labels==11)
near=cv2.dilate(core.astype(np.uint8),np.ones((3,3),np.uint8))>0
edge=near&roi&(labels==11)&(rgb.max(2)<110)&(prob[11]>.65)&(prob[[4,5,6,7,8,9,10]].sum(0)<.2)
mask=core|edge
out=np.dstack([rgb,np.full((h,w),255,np.uint8)]);out[mask]=0
q=Path('exports/images/opening-cleanup-20261030');q.mkdir(exist_ok=True)
Image.fromarray(out).crop((350,340,500,430)).resize((750,450)).save(q/'neck-source-diagnostic.png')
print('core',core.sum(),'edge',edge.sum(),'remaining face',((labels==11)&roi&~mask).sum())
