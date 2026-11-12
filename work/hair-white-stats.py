from PIL import Image
import numpy as np,cv2
p=np.array(Image.open('exports/images/image-1793225204343364800/image.jpg').convert('RGB'))[:,512:]
m=(p.min(2)>238)&((p.max(2).astype(int)-p.min(2))<20)
n,l,s,c=cv2.connectedComponentsWithStats(m.astype('uint8'),4)
for i in range(1,n):
 x,y,w,h,a=s[i]
 if a<25 or x==0 or y==0 or x+w==512 or y+h==768:continue
 v=p[l==i]; print(i,list(s[i]),np.round(v.mean(0),1),round(float(((v.min(1)>250)&((v.max(1)-v.min(1))<4)).mean()),3))
