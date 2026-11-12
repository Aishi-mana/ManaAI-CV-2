from pathlib import Path
from PIL import Image,ImageDraw
root=Path('exports/images/collar-arm-20261030')
for name in ['sailor','purple','mint-dress','rose-cardigan']:
 p=root/name
 if not (p/'outfit.png').exists():continue
 outfit=Image.open(p/'outfit.png').convert('RGBA');im=Image.new('RGBA',outfit.size,'#d8e8df');im.alpha_composite(Image.open('assets/avatar/hairstyles/default/hair_back.png').convert('RGBA'));im.alpha_composite(Image.open(p/'avatar-body.png').convert('RGBA'));im.alpha_composite(outfit)
 for f in ['eyes/eye_neutral.png','mouth/mouth_neutral.png','hairstyles/default/hair_front.png']:
  path=Path('assets/avatar')/f
  if path.exists():im.alpha_composite(Image.open(path).convert('RGBA'))
 im.convert('RGB').save(p/'composite.jpg')
