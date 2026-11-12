"""Inspect a regenerated intact garment; no semantic shoulder/hair removal."""
from pathlib import Path
import sys,json
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from generated_outfit import remove_outer_background

root=Path('C:/AI/ManaAI-CV-2/exports/images/cloud-sailor-intact-regeneration-20261026')
assets=Path('C:/AI/ManaAI-CV-2/assets/avatar')
with Image.open(root/'image.png') as im:
    rgb=np.array(im.convert('RGB'))
rgba=remove_outer_background(rgb)
with Image.open(assets/'base/body.png') as im:size=im.size
outfit=Image.fromarray(rgba).resize(size,Image.Resampling.LANCZOS)
outfit.save(root/'outfit.png')
canvas=Image.new('RGBA',size,'white')
for f in ['hairstyles/default/hair_back.png','base/body.png',None,'mouth/mouth_neutral.png','eyes/eye_neutral.png','hairstyles/default/hair_front.png','hairstyles/default/hair_ahoge.png','accessories/cross_hairclip.png']:
    canvas.alpha_composite(outfit if f is None else Image.open(assets/f).convert('RGBA'))
canvas.convert('RGB').save(root/'on-mana.jpg',quality=95)
bg=Image.new('RGBA',size,(215,210,225));bg.alpha_composite(outfit)
bg.convert('RGB').save(root/'standalone.jpg',quality=95)
bg.crop((220,320,640,600)).resize((1050,700)).convert('RGB').save(root/'shoulders.jpg',quality=95)
(root/'extraction.json').write_text(json.dumps({'method':'outer-background-removal-only','semantic_erasure':False,'shoulder_erasure':False,'garment_repositioning':False,'wardrobe_saved':False,'new_generations':1},indent=2),encoding='utf-8')
print(root/'on-mana.jpg')
