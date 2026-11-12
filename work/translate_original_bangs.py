from pathlib import Path
import json
import numpy as np
from PIL import Image
root=Path('C:/AI/ManaAI-CV-2');source=root/'exports/images/bangs-back-trial-20261027';out=source/'translated-original-bangs';out.mkdir(exist_ok=True)
original=Image.open(source/'hair_front.png').convert('RGBA');front=Image.new('RGBA',original.size)
# Translate the complete original fitted bangs. No warp or new scaling.
dy=85;front.alpha_composite(original,(0,dy));front.save(out/'hair_front.png');Image.open(source/'hair_back.png').save(out/'hair_back.png')
a=np.array(original);b=np.array(front);assert np.array_equal(a[:-dy],b[dy:]);assert not b[:dy,:,3].any()
base=Image.new('RGBA',(843,1264))
for p in [out/'hair_back.png',root/'assets/avatar/base/body.png',root/'assets/avatar/outfits/default/outfit.png',root/'assets/avatar/eyes/eye_neutral.png',root/'assets/avatar/mouth/mouth_neutral.png',out/'hair_front.png']:base.alpha_composite(Image.open(p).convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'on-mana.jpg',quality=95);bg.crop((140,20,710,650)).convert('RGB').save(out/'head-preview.jpg',quality=95)
(out/'fit-report.json').write_text(json.dumps({'source':str(source/'hair_front.png'),'translation':[0,dy],'warping':False,'additionalScaling':False,'preservedPixelsVerified':True,'newGenerations':0,'wardrobeChanged':False},indent=2),encoding='utf-8')
