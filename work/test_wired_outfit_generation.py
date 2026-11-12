import json,sys,subprocess,os
from pathlib import Path
root=Path('exports/images/wired-outfit-generation-20261025').resolve();root.mkdir(exist_ok=False)
r=json.loads(Path('exports/images/fresh-outfit-extraction-20261025/request.json').read_text(encoding='utf-8'))
r.pop('reference',None);r['characterReference']=False;r['seed']=251025842;r['outfitBody']=str(Path('assets/avatar/base/body.png').resolve())
r['prompt']='Create a complete front-facing anime outfit ONLY for a compact stylized 2D avatar. A sky-blue sailor blouse with navy collar and white piping, white necktie, pleated blue knee-length skirt, white ankle socks and navy Mary Jane shoes with gold buckles. Draw complete shoulders and sleeves with no hair-shaped gaps. Include matching closed-toe shoes and socks below. Keep garment pieces in a wearable arrangement: blouse and skirt together above, paired shoes below with a large gap. Plain pure white background. Ghost mannequin clothing with no visible mannequin, person, head, face, neck, skin, body, hands, legs, feet, hair, headset, scenery, labels or text. Complete shoe silhouettes, buckles, lining and soles. Clean anime outlines and fabric shading.'
r['negative']='person, face, hair, skin, mannequin, text, watermark, low quality'
(root/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (root/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-B',str(Path('scripts/image_job.py').resolve()),str(root/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(root/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print(result.returncode)
