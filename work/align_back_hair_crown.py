from pathlib import Path
from PIL import Image
import numpy as np,json
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027/both-uniform-1p2';out=source/'crown-aligned';out.mkdir(exist_ok=True)
front=Image.open(source/'hair_front.png').convert('RGBA');back=Image.open(source/'hair_back.png').convert('RGBA');f=np.array(front);b=np.array(back)
# Match the top opaque pixel rows of the two crowns; translate the entire back.
fy=int(np.where(f[:,:,3]>200)[0].min());by=int(np.where(b[:,:,3]>200)[0].min());dy=fy-by
shifted=Image.new('RGBA',back.size);shifted.alpha_composite(back,(0,dy));shifted.save(out/'hair_back.png');front.save(out/'hair_front.png')
s=np.array(shifted);assert dy>0 and np.array_equal(b[:-dy],s[dy:]);assert np.array_equal(np.array(Image.open(out/'hair_front.png')),f)
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.crop((100,0,750,750)).convert('RGB').save(out/'head-preview.jpg',quality=95);bg.convert('RGB').save(out/'on-mana.jpg',quality=95)
(out/'fit-report.json').write_text(json.dumps({'backTranslation':[0,dy],'scaleChanged':False,'warp':False,'frontUnchanged':True,'translationPixelEqualityVerified':True,'newGenerations':0,'wardrobeChanged':False},indent=2),encoding='utf-8');print(dy)
