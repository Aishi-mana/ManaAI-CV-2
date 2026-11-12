exec(open('work/check-neck-source.py').read().split('core=')[0])
seed=skin&roi&(labels==11)
n,l,s,_=cv2.connectedComponentsWithStats((skin&roi).astype('uint8'),8)
core=np.zeros((h,w),bool)
for i in range(1,n):
 m=l==i
 if (m&seed).sum()>40 and (m&seed).sum()>m.sum()*.5:core|=m
near=cv2.dilate(core.astype('uint8'),np.ones((5,5),np.uint8))>0
end=np.where(core)[0].max()
edge=near&roi&np.isin(labels,[0,11])&(rgb.max(2)<170)&(yy<end-3)
mask=core|edge
out=np.dstack([rgb,np.full((h,w),255,np.uint8)]);out[mask]=0
Image.fromarray(out).crop((350,340,500,430)).resize((750,450)).save('exports/images/opening-cleanup-20261030/neck-source-diagnostic2.png')
print('core',core.sum(),'edge',edge.sum(),'residual source skin',((skin&roi)&~mask).sum())
