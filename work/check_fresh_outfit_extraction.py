import json,sys,subprocess,os
from pathlib import Path
from PIL import Image,ImageDraw
root=Path('exports/images/fresh-outfit-extraction-20261025').resolve()
if not (root/'image.png').is_file():raise RuntimeError('Fresh generation not complete')
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1')
for args in [['scripts/clothing_extract.py',str(root/'image.png'),'models/clothing-segformer-b2',str(root/'parsed')],['scripts/clothing_refine.py',str(root/'image.png'),str(root/'parsed/parsing.npz'),str(root/'refined'),'--reference-labels','exports/images/auto-outfit-probe-20261025/refine-hoodie/labels.png']]:
 result=subprocess.run([sys.executable,'-B',*args],env=env)
 if result.returncode:raise RuntimeError('Extraction stage failed')
assets=Path('assets/avatar');size=(843,1264)
canvas=Image.new('RGBA',size,'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',root/'refined/clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 if not p.is_file():continue
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA').resize(size,Image.Resampling.LANCZOS))
canvas.convert('RGB').save(root/'wear-preview.jpg',quality=94)
board=Image.new('RGB',(1350,710),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,path in [(0,'Fresh unedited generation',root/'image.png'),(450,'Extracted clothing',root/'refined/edge-preview.jpg'),(900,'On original body',root/'wear-preview.jpg')]:
 draw.text((x+12,12),title,fill='black')
 with Image.open(path) as im:board.paste(im.convert('RGB').resize((450,671)),(x,35))
board.save(root/'comparison.jpg',quality=94)
(root/'provenance.json').write_text(json.dumps({'source':'fresh Qwen generation','seed':251025318,'reference':'default Mana avatar, not user fitted kimono','existing_wardrobe_mask_used':False,'manual_edits_to_source':False,'original_body_changed':False,'wardrobe_saved':False,'purpose':'Evaluate extraction and fit of a new unedited garment; not a recolor validation'},indent=2),encoding='utf-8')
