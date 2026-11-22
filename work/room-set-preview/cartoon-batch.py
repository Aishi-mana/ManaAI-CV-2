import base64,io,json,pathlib,subprocess
from PIL import Image
root=pathlib.Path.cwd();base=root/'work'/'room-set-preview'
request=json.loads((base/'shop-style-bed'/'request.json').read_text())
style=Image.open(base/'shop-style-bed'/'image.jpg').convert('RGB').crop((180,145,575,480))
for name,asset,label in [('table','coffee_table.png','coffee table'),('plant','plant.png','potted plant'),('beanbag','beanie_bag.png','beanbag'),('desk','desk.png','computer desk and chair'),('bookshelf','bookshelf.png','bookshelf'),('rug','rug.png','rug'),('window','window.png','window and curtains'),('shelf','top_shelf.png','wall shelves'),('board','photo_frame.png','photo board'),('bot','pet_bot.png','robot pet'),('sign','mana_sign.png','wall emblem')]:
 out=base/('shop-style-'+name);out.mkdir(exist_ok=True)
 im=Image.open(root/'public'/'companion-room'/asset).convert('RGBA')
 scale=385/max(im.size);im=im.resize(tuple(round(v*scale) for v in im.size),Image.Resampling.LANCZOS)
 canvas=Image.new('RGB',(1024,576),'white')
 canvas.paste(im,((560-im.width)//2,(576-im.height)//2),im)
 sample=style.copy();sample.thumbnail((315,315),Image.Resampling.LANCZOS);canvas.paste(sample,(655,(576-sample.height)//2))
 buf=io.BytesIO();canvas.save(buf,format='JPEG',quality=92)
 request.update(prompt=f'Redraw the {label} from the left panel in the bold illustrated game sprite art style of the bed on the right. Use clean dark ink contours, broad flat fills, crisp two-step cel shadows, restrained cool blue and lavender accents, minimal texture. Match the left object silhouette, isometric camera and proportions. Keep its recognizable details. Output only the complete {label}, centered on pure white with margins. No reference panels, no bed, no room, no cast shadow.',reference='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode(),width=768,height=640,seed=7401)
 (out/'request.json').write_text(json.dumps(request))
 with (out/'job.log').open('w') as log:
  r=subprocess.run([str(pathlib.Path(request['comfy'])/'.venv'/'Scripts'/'python.exe'),str(root/'scripts'/'image_job.py'),str(out/'request.json')],cwd=out,stdout=log,stderr=subprocess.STDOUT)
 print(name,r.returncode,flush=True)
