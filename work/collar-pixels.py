from PIL import Image
import numpy as np
p=np.array(Image.open('exports/images/arm-hair-refinement-20261029/mint-dress/outfit.png'))
for y in [397,400,405,410,412,416,420,425,430]:print(y,p[y,422].tolist())
