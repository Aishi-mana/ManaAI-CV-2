import numpy as np
p=np.load('exports/images/image-1793138916489904300/opening-parsing/parsing.npz')
a=p['labels'];print(a.shape);print([(pos,int(a[pos])) for pos in [(550,420),(975,350),(685,550)]]);print(np.unique(a[535:560,350:480],return_counts=True))
