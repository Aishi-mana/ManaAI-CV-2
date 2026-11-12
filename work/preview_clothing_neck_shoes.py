from pathlib import Path
from PIL import Image,ImageDraw
root=Path('exports/images/auto-outfit-probe-20261025');assets=Path('assets/avatar');hair=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion/wardrobe/hairstyles/atelier_kimono_hair-1792834016299357500')
size=(843,1264)
def wear(outfit):
 canvas=Image.new('RGBA',size,'white')
 for p in [hair/'hair_back.png',assets/'base/body.png',outfit,assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'accessories/cross_hairclip.png',hair/'hair_front.png']:
  with Image.open(p) as im:canvas.alpha_composite(im.convert('RGBA').resize(size,Image.Resampling.LANCZOS))
 return canvas.convert('RGB')
clean=wear(root/'refined-neck-shoes-v2/clothing.png');clean.save(root/'refined-neck-shoes-v2/wear-preview.jpg',quality=94)
raw=wear(root/'refined-final/clothing.png');board=Image.new('RGB',(1000,790),'#f4eff8');draw=ImageDraw.Draw(board)
for x,title,im in [(0,'Before cleanup',raw),(500,'After cleanup',clean)]:
 draw.text((x+20,12),title,fill='black');board.paste(im.resize((500,750)),(x,35))
board.save(root/'neck-shoe-comparison.jpg',quality=94)
