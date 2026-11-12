from PIL import Image
from pathlib import Path
import json
p=Path('exports/images/hair-content-check-20261028');report=json.loads((p/'fit.json').read_text());result=Image.new('RGBA',(843,1264))
for r in report:
 t=r['piece']['transform'];s=max(843/1024,1264/768)*t['scale'];b=r['bounds'];im=Image.frombytes('RGBA',(512,768),(p/(r['slot']+'.rgba')).read_bytes()).crop((b['x'],b['y'],b['x']+b['width'],b['y']+b['height']));x=(843-1024*s)/2+t['x']+(b['x']+(512 if r['slot']=='back' else 0))*s;y=(1264-768*s)/2+t['y']+b['y']*s
 layer=Image.new('RGBA',(843,1264));layer.alpha_composite(im.resize((round(b['width']*s),round(b['height']*s)),Image.Resampling.LANCZOS),(round(x),round(y)));layer.save(p/('hair_'+r['slot']+'.png'))
for file in [p/'hair_back.png',Path('assets/avatar/base/body.png'),Path('assets/avatar/outfits/default/outfit.png'),Path('assets/avatar/eyes/eye_neutral.png'),Path('assets/avatar/mouth/mouth_neutral.png'),p/'hair_front.png']:
 if file.exists():result.alpha_composite(Image.open(file).convert('RGBA'))
bg=Image.new('RGBA',result.size,'#f4eff8');bg.alpha_composite(result);bg.convert('RGB').save(p/'preview.jpg')
