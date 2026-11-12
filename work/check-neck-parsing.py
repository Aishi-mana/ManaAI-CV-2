import numpy as np
p='exports/images/fresh-production-20261030/apricot-blouse/opening-parsing/parsing.npz';d=np.load(p)['labels'];print(d.shape)
for y in [365,380,390,400,410,420]:print(y,np.unique(d[y,385:465],return_counts=True))
