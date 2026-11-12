import sys,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts')
from clothing_edges import polish_edges
from clothing_fit import fit_closed_shoes
r=Path('exports/images/fresh-outfit-extraction-20261025');out=r/'edge-polish';out.mkdir(exist_ok=False)
source=np.array(Image.open(r/'foot-fit-v3/clothing.png').convert('RGBA'));body=np.array(Image.open('assets/avatar/base/body.png').convert('RGBA'))
clean,edges=polish_edges(source)
# Recheck coverage after smoothing; fitting is retained or minimally corrected.
clean,fit=fit_closed_shoes(clean,body)
Image.fromarray(clean).save(out/'clothing.png');(out/'report.json').write_text(json.dumps({'edges':edges,'fit':fit,'wardrobe_saved':False},indent=2),encoding='utf-8')
assets=Path('assets/avatar');canvas=Image.new('RGBA',(843,1264),'white')
for p in [assets/'hairstyles/default/hair_back.png',assets/'base/body.png',out/'clothing.png',assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'hairstyles/default/hair_front.png',assets/'hairstyles/default/hair_ahoge.png',assets/'accessories/cross_hairclip.png',assets/'accessories/cat_ear_headset.png']:
 with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA'))
canvas.convert('RGB').save(out/'wear-preview.jpg',quality=95)
canvas.crop((230,380,625,865)).resize((553,679)).convert('RGB').save(out/'edges.jpg',quality=95)
board=Image.new('RGB',(1000,790),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,path in [(0,'Before edge cleanup',r/'foot-fit-v3/wear-preview.jpg'),(500,'After edge cleanup',out/'wear-preview.jpg')]:
 draw.text((x+15,12),title,fill='black')
 with Image.open(path) as im:board.paste(im.resize((500,750)),(x,35))
board.save(out/'comparison.jpg',quality=95);print(json.dumps({'edges':edges,'fit':fit},indent=2))
