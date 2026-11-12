import json,base64,io,os,sys,subprocess
from pathlib import Path
from PIL import Image
root=Path('exports/images/auto-outfit-probe-20261025').resolve();root.mkdir(exist_ok=False)
assets=Path('assets/avatar');lib=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion/wardrobe')
outfit=lib/'outfits/atelier_kimono_png-1792842034587803500/outfit.png';hair=lib/'hairstyles/atelier_kimono_hair-1792834016299357500'
body=Image.open(assets/'base/body.png').convert('RGBA');size=body.size
layers=[hair/'hair_back.png',assets/'base/body.png',outfit,assets/'mouth/mouth_neutral.png',assets/'eyes/eye_neutral.png',assets/'accessories/cross_hairclip.png',hair/'hair_front.png']
ref=Image.new('RGBA',size,'white')
for path in layers:
 with Image.open(path) as im:ref.alpha_composite(im.convert('RGBA').resize(size))
ref.convert('RGB').save(root/'reference.jpg',quality=92)
Image.open(outfit).save(root/'template.png')
r=json.loads(Path('exports/images/qwen-concise-integrated-20261024/request.json').read_text(encoding='utf-8'));r['reference']='data:image/jpeg;base64,'+base64.b64encode((root/'reference.jpg').read_bytes()).decode();r['width']=848;r['height']=1264;r['seed']=50125678
r['prompt']='Edit this avatar in place. Keep the exact same standing front-facing pose, body size, head position, hands, hair, face and plain white background. Preserve every garment boundary, sleeve shape, hemline, neckline and shoe position. Change only the kimono fabric to lavender with small pale blue star motifs, a deep blue waist sash, and matching lavender sandal straps. Same fitted short kimono silhouette. Do not move, resize or redraw the body. No scene, no text. The character must occupy exactly the same location and scale in the canvas.'
(root/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
code="import sys,json;from pathlib import Path;sys.path.insert(0,'scripts');from qwen_image import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (root/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(root/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(root/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print('outfit-probe',result.returncode,flush=True)
if result.returncode==0:
 generated=Image.open(root/'image.png').convert('RGBA').resize(size,Image.Resampling.LANCZOS);mask=Image.open(outfit).convert('RGBA').getchannel('A');generated.putalpha(mask);generated.save(root/'extracted-outfit.png')
 preview=Image.new('RGBA',size,'white')
 for path in layers:
  if path==outfit:preview.alpha_composite(generated)
  else:
   with Image.open(path) as im:preview.alpha_composite(im.convert('RGBA').resize(size))
 preview.save(root/'wear-preview.png')
