from pathlib import Path
from PIL import Image
root=Path('exports/images/fresh-production-20261030')
for name in ['blue-coat','apricot-blouse','blue-coat-layout','final-lavender']:
 p=root/name
 if not (p/'outfit.png').exists():continue
 outfit=Image.open(p/'outfit.png').convert('RGBA');im=Image.new('RGBA',outfit.size,'#e8e2f0')
 for f in ['assets/avatar/hairstyles/default/hair_back.png',str(p/'avatar-body.png')]:im.alpha_composite(Image.open(f).convert('RGBA'))
 im.alpha_composite(outfit)
 for f in ['eyes/eye_neutral.png','mouth/mouth_neutral.png','hairstyles/default/hair_front.png']:im.alpha_composite(Image.open('assets/avatar/'+f).convert('RGBA'))
 im.convert('RGB').save(p/'composite.jpg');im.crop((210,340,635,740)).convert('RGB').save(p/'collar-arms.jpg')

