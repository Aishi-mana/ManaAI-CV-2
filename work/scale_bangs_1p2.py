from pathlib import Path
from PIL import Image
import json
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027';out=source/'bangs-uniform-1p2';out.mkdir(exist_ok=True)
# Scale original fitted (unwarped) bangs by 1.2 around its center at the latest +10px position.
piece=Image.open(source/'front-cutout.png').convert('RGBA').resize((338,234),Image.Resampling.LANCZOS)
w,h=round(338*1.2),round(234*1.2);piece=piece.resize((w,h),Image.Resampling.LANCZOS);front=Image.new('RGBA',(843,1264));x=round(421-w/2);y=round(70+234/2-h/2);front.alpha_composite(piece,(x,y));front.save(out/'hair_front.png');Image.open(source/'hair_back.png').save(out/'hair_back.png')
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95);bg.convert('RGB').save(out/'on-mana.jpg',quality=95)
(out/'fit-report.json').write_text(json.dumps({'scale':1.2,'uniform':True,'source':'original unwarped fitted bangs','center':[421,187],'targetBounds':[x,y,w,h],'newGenerations':0,'wardrobeChanged':False},indent=2),encoding='utf-8')
