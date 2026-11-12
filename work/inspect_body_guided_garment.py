from pathlib import Path
import sys,json
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
from generated_outfit import remove_outer_background
p=Path('exports/images/body-guided-garment-test-20261026')
a=remove_outer_background(np.array(Image.open(p/'image.png').convert('RGB')))
out=Image.fromarray(a).resize((843,1264),Image.Resampling.LANCZOS)
out.save(p/'clothing.png')
assets=Path('assets/avatar');bg=Image.new('RGBA',out.size,'#ddd9e5')
for f in ['hairstyles/default/hair_back.png','base/body.png',None,'mouth/mouth_neutral.png','eyes/eye_neutral.png','hairstyles/default/hair_front.png','hairstyles/default/hair_ahoge.png']:
 bg.alpha_composite(out if f is None else Image.open(assets/f).convert('RGBA'))
bg.convert('RGB').save(p/'on-mana.jpg',quality=95)
stand=Image.new('RGBA',out.size,'#ddd9e5');stand.alpha_composite(out);stand.convert('RGB').save(p/'standalone.jpg',quality=95)
