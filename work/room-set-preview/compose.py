from pathlib import Path
from PIL import Image
base=Path('work/room-set-preview')
assets=Path('public/companion-room')
room=Image.open(base/'shell'/'image.jpg').convert('RGBA').resize((799,698),Image.Resampling.LANCZOS)
# Preserve the reference room boundary while evaluating the new art in context.
room.putalpha(Image.open(assets/'roombg.png').convert('RGBA').getchannel('A').resize(room.size,Image.Resampling.LANCZOS))
for name,file,x,y,width in [
 ('rug','rug.png',307,384,307),('window','window.png',159,75,153),
 ('sign','mana_sign.png',337,53,56),('shelf','top_shelf.png',406,55,113),
 ('board','photo_frame.png',539,132,63),('desk','desk.png',334,151,189),
 ('table','coffee_table.png',403,415,124),('beanbag','beanie_bag.png',576,295,113),
 ('bot','pet_bot.png',186,497,49),('plant','plant.png',428,565,65),
 ('bed','bed.png',18,310,244),('bookshelf','bookshelf.png',690,207,100)]:
 original=Image.open(assets/file).convert('RGBA')
 height=round(width*original.height/original.width)
 generated=base/name/'cleaned.png'
 if generated.exists():
  sprite=Image.open(generated).convert('RGBA')
  ratio=min(width/sprite.width,height/sprite.height)
  sprite=sprite.resize((round(sprite.width*ratio),round(sprite.height*ratio)),Image.Resampling.LANCZOS)
  room.alpha_composite(sprite,(x+(width-sprite.width)//2,y+height-sprite.height))
 else:
  room.alpha_composite(original.resize((width,height),Image.Resampling.LANCZOS),(x,y))
room.save(base/'furnished-preview.png')
