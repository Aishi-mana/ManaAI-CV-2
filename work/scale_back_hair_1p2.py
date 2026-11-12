from pathlib import Path
from PIL import Image
import json
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027';out=source/'both-uniform-1p2';out.mkdir(exist_ok=True)
Image.open(source/'bangs-uniform-1p2/hair_front.png').save(out/'hair_front.png')
back=Image.open(source/'hair_back.png').convert('RGBA');box=back.getbbox();piece=back.crop(box);w,h=round(piece.width*1.2),round(piece.height*1.2);piece=piece.resize((w,h),Image.Resampling.LANCZOS);cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2;x=round(cx-w/2);y=round(cy-h/2);layer=Image.new('RGBA',back.size);layer.alpha_composite(piece,(x,y));layer.save(out/'hair_back.png')
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.crop((100,0,750,750)).convert('RGB').save(out/'head-preview.jpg',quality=95);bg.convert('RGB').save(out/'on-mana.jpg',quality=95)
(out/'fit-report.json').write_text(json.dumps({'backScale':1.2,'uniform':True,'anchor':'original back hair bounding-box center','backBounds':[x,y,w,h],'bangs':'unchanged accepted 1.2x version','newGenerations':0,'wardrobeChanged':False},indent=2),encoding='utf-8')
