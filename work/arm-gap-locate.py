from PIL import Image
import numpy as np,sys
sys.path.insert(0,'scripts');from outfit_quality import _runs
p='exports/images/collar-cleanup-20261030/mint-dress/'
a=np.array(Image.open(p+'outfit.png'));b=np.array(Image.open(p+'avatar-body.png'))
for y in range(460,551,10):
 print(y,'body',[(int(r[0]),int(r[-1])) for r in _runs(b[y,:,3]>128)],'cloth',[(int(r[0]),int(r[-1])) for r in _runs(a[y,:,3]>128)])
