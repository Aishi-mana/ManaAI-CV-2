from pathlib import Path
from PIL import Image
import sys,numpy as np
sys.path.insert(0,'scripts')
from clothing_fit import clear_underarm_background,fit_cuff_proportions
p=Path('exports/images/worn-fit-20261030/cached-diagnostic');old=Path('exports/images/fresh-production-20261030/final-clean-confirmation')
a=np.array(Image.open(old/'outfit.png').convert('RGBA'));b=np.array(Image.open(p/'avatar-body.png').convert('RGBA'))
a,r=clear_underarm_background(a,b);a,r=fit_cuff_proportions(a,b,'long-sleeved dress');print(r)
Image.fromarray(a).save(p/'mesh.png')
im=Image.new('RGBA',(843,1264),'#e8e2f0')
for f in ['assets/avatar/hairstyles/default/hair_back.png',str(p/'avatar-body.png')]:im.alpha_composite(Image.open(f).convert('RGBA'))
im.alpha_composite(Image.fromarray(a))
for f in ['eyes/eye_neutral.png','mouth/mouth_neutral.png','hairstyles/default/hair_front.png']:im.alpha_composite(Image.open('assets/avatar/'+f).convert('RGBA'))
im.convert('RGB').save(p/'mesh-composite.jpg');im.crop((210,340,635,780)).convert('RGB').save(p/'mesh-arms.jpg')
