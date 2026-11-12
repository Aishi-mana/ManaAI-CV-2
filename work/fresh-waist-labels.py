import numpy as np,cv2
from PIL import Image
p='exports/images/outfit-content-check-20261028/';r=np.array(Image.open(p+'image.png').convert('RGB'));a=np.load(p+'opening-parsing/parsing.npz')['labels'];hsv=cv2.cvtColor(r,cv2.COLOR_RGB2HSV);mask=(hsv[:,:,0]<25)&(hsv[:,:,1]>30)&(hsv[:,:,2]>100);n,l,s,_=cv2.connectedComponentsWithStats(mask.astype('uint8'),8)
for i in range(1,n):
 x,y,w,h,area=s[i]
 if y>500 and y<570 and w>50:
  print(x,y,w,h,area,np.unique(a[l==i],return_counts=True));print('above',np.unique(a[max(0,y-8):y,x:x+w],return_counts=True));print('below',np.unique(a[y+h:y+h+14,x:x+w],return_counts=True))
