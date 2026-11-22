from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import subprocess,json
base=Path('work/room-set-preview')
assets=Path('public/companion-room')
js="""const fs=require('fs'),ts=require('typescript'),vm=require('vm'),e={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/generatedAccessories.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:e,Uint8ClampedArray});const [f,w,h]=process.argv.slice(1);let a=e.cleanAccessory(new Uint8ClampedArray(fs.readFileSync(f)),+w,+h);fs.writeFileSync(f,a.data);console.log(JSON.stringify(a.bounds));"""
rows=[('shell','roombg.png'),('table','coffee_table.png'),('plant','plant.png'),('beanbag','beanie_bag.png'),('bed','bed.png'),('desk','desk.png'),('bookshelf','bookshelf.png'),('rug','rug.png'),('window','window.png'),('shelf','top_shelf.png'),('board','photo_frame.png'),('bot','pet_bot.png')]
ready=[(n,a) for n,a in rows if (base/n/'image.jpg').exists()]
if not ready: raise SystemExit()
sheet=Image.new('RGB',(820,300*len(ready)), '#faf5f9')
draw=ImageDraw.Draw(sheet)
for i,(name,asset) in enumerate(ready):
 original=Image.open(assets/asset).convert('RGBA')
 output=Image.open(base/name/'image.jpg').convert('RGBA')
 if name!='shell':
  output.thumbnail((512,512),Image.Resampling.LANCZOS)
  raw=base/name/'cleanup.rgba';raw.write_bytes(output.tobytes())
  try:
   run=subprocess.run(['node','-e',js,str(raw),str(output.width),str(output.height)],capture_output=True,text=True)
   if run.returncode: print(name,'cleanup rejected')
   else:
    b=json.loads(run.stdout)
    output=Image.frombytes('RGBA',output.size,raw.read_bytes()).crop((b['x'],b['y'],b['x']+b['width'],b['y']+b['height']))
    output.save(base/name/'cleaned.png')
    print(name,'cleanup passed')
  finally:raw.unlink(missing_ok=True)
 for j,im in enumerate([original,output]):
  im.thumbnail((388,258),Image.Resampling.LANCZOS)
  sheet.paste(im,(410*j+(410-im.width)//2,300*i+32+(258-im.height)//2),im)
 draw.text((15,300*i+10),'Existing '+name,fill='#30253a')
 draw.text((425,300*i+10),'Generated '+name,fill='#30253a')
sheet.save(base/'comparison.png')
