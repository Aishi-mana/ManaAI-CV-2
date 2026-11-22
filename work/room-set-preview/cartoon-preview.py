from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess,json
base=Path('work/room-set-preview')
assets=Path('public/companion-room')
js="""const fs=require('fs'),ts=require('typescript'),vm=require('vm'),e={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/generatedAccessories.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:e,Uint8ClampedArray});const [f,w,h]=process.argv.slice(1);let a=e.cleanAccessory(new Uint8ClampedArray(fs.readFileSync(f)),+w,+h);fs.writeFileSync(f,a.data);console.log(JSON.stringify(a.bounds));"""
shell=Image.open(base/'shop-style-shell'/'image.jpg').convert('RGBA')
mask=Image.new('L',shell.size)
ImageDraw.Draw(mask).polygon([(400,37),(769,211),(770,439),(421,673),(387,673),(30,440),(29,212)],fill=255)
shell.putalpha(mask)
room=shell.crop(mask.getbbox()).resize((799,698),Image.Resampling.LANCZOS)
room.save(base/'cartoon-empty-room.png')
missing=[]
for name,file,x,y,width in [
 ('rug','rug.png',307,384,307),('window','window.png',159,75,153),('sign','mana_sign.png',337,53,56),('shelf','top_shelf.png',406,55,113),('board','photo_frame.png',539,132,63),('desk','desk.png',334,151,189),('table','coffee_table.png',403,415,124),('beanbag','beanie_bag.png',576,295,113),('bot','pet_bot.png',186,497,49),('plant','plant.png',428,565,65),('bed','bed.png',18,310,244),('bookshelf','bookshelf.png',690,207,100)]:
 source=base/('shop-style-'+name)/'image.jpg'
 original=Image.open(assets/file).convert('RGBA')
 height=round(width*original.height/original.width)
 sprite=original
 if source.exists():
  output=Image.open(source).convert('RGBA')
  output.thumbnail((512,512),Image.Resampling.LANCZOS)
  raw=source.parent/'cleanup.rgba';raw.write_bytes(output.tobytes())
  try:
   run=subprocess.run(['node','-e',js,str(raw),str(output.width),str(output.height)],capture_output=True,text=True)
   if run.returncode: missing.append(name+' (cleanup rejected)')
   else:
    b=json.loads(run.stdout)
    sprite=Image.frombytes('RGBA',output.size,raw.read_bytes()).crop((b['x'],b['y'],b['x']+b['width'],b['y']+b['height']))
    sprite.save(source.parent/'cleaned.png')
  finally:raw.unlink(missing_ok=True)
 else:missing.append(name+' (pending)')
 if name=='sign':
  # Compose the lettering separately so the name stays exact and legible.
  emblem=sprite.crop((0,0,sprite.width,169))
  emblem.thumbnail((42,57),Image.Resampling.LANCZOS)
  sprite=Image.new('RGBA',(68,94))
  sprite.alpha_composite(emblem,((68-emblem.width)//2,0))
  lettering=Image.new('RGBA',(136,37))
  font=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',27)
  ImageDraw.Draw(lettering).text((68,16),'MANA AI',font=font,anchor='mm',fill='#dbfaff',stroke_width=2,stroke_fill='#15354c')
  lettering=lettering.resize((68,19),Image.Resampling.LANCZOS)
  lettering=lettering.transform((68,48),Image.Transform.AFFINE,(1,0,0,.48,1,-32),Image.Resampling.BICUBIC)
  sprite.alpha_composite(lettering,(0,46))
  sprite.save(base/'cartoon-mana-sign.png')
  room.alpha_composite(sprite,(326,54))
  continue
 if name=='board':
  # The generated board edge slopes about .17. Match the right wall's .48.
  sprite=sprite.resize((width,112),Image.Resampling.LANCZOS)
  sprite=sprite.transform((width,134),Image.Transform.AFFINE,(1,0,0,-.38,1,0),Image.Resampling.BICUBIC)
  sprite.save(base/'cartoon-photo-board.png')
  room.alpha_composite(sprite,(539,137))
  continue
 ratio=min(width/sprite.width,height/sprite.height)
 sprite=sprite.resize((round(sprite.width*ratio),round(sprite.height*ratio)),Image.Resampling.LANCZOS)
 room.alpha_composite(sprite,(x+(width-sprite.width)//2,y+height-sprite.height))
mana=Image.open(assets/'mana_idle_1.png').convert('RGBA').resize((152,152),Image.Resampling.LANCZOS)
room.alpha_composite(mana,(282,343))
preview=Image.new('RGB',room.size,'#faf5f9');preview.paste(room,(0,0),room)
preview.save(base/'cartoon-furnished-room.png')
print('Original art still used for:', ', '.join(missing) or 'none')
