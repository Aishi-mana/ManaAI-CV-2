import sys
sys.path.insert(0,'scripts')
import numpy as np,cv2
from PIL import Image
r=np.array(Image.open('exports/images/image-1793138916489904300/image.png').convert('RGB'));p=np.load('exports/images/image-1793138916489904300/opening-parsing/parsing.npz')['labels'];hsv=cv2.cvtColor(r,cv2.COLOR_RGB2HSV);skin=(hsv[:,:,0]<25)&(hsv[:,:,1]>30)&(hsv[:,:,2]>100);yy=np.indices(skin.shape)[0];n,lab,stats,_=cv2.connectedComponentsWithStats((skin&(yy>r.shape[0]*.38)).astype('uint8'),8)
for i in range(1,n):
 x,y,w,h,a=stats[i];seed=int(((lab==i)&np.isin(p,[11,12,13,14,15])).sum())
 if a>30:print(x,y,w,h,a,seed,'band',h<r.shape[0]*.035 and w>=h*2)
