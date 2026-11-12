from PIL import Image
import numpy as np
for f in ['base/body.png','eyes/eye_neutral.png','mouth/mouth_neutral.png','hairstyles/default/hair_front.png','hairstyles/default/hair_back.png']:
 a=np.array(Image.open('assets/avatar/'+f).convert('RGBA'));y,x=np.where(a[:,:,3]>128);print(f,(x.min(),y.min(),x.max()+1,y.max()+1))
a=np.array(Image.open('assets/avatar/base/body.png'));print([(y,int((a[y,:,3]>128).sum())) for y in [50,70,100,150,200,250,280,300,320,350,380,400]])
