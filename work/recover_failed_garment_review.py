from pathlib import Path
import json,time,os
from PIL import Image
job=Path('C:/AI/ManaAI-CV-2/exports/images/image-1792995271093435300')
report=json.loads((job/'outfit-report.json').read_text(encoding='utf-8'))
assert report['fit_version']==7 and not report['shoulder_erasure'] and not report['shoulder_repainting']
assert all(f['foot_pixels_exposed_after']==0 for f in report['footwear']['feet'])
root=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion/generated-outfits')
root.mkdir(parents=True,exist_ok=True);dest=root/job.name
if dest.exists():
 print('Review item already exists; left unchanged.')
else:
 staging=root/('.incoming-'+job.name);staging.mkdir(exist_ok=False)
 request=json.loads((job/'request.json').read_text(encoding='utf-8'))
 with Image.open(job/'outfit.png') as im:w,h=im.size
 record={'id':job.name,'name':'Cloud sailor (recovered)','createdAt':int(time.time()),'status':'pending','prompt':request['prompt'],'width':w,'height':h,'outfitId':None,'fitVersion':7}
 (staging/'outfit.png').write_bytes((job/'outfit.png').read_bytes())
 (staging/'design.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
 os.replace(staging,dest)
 print('Recovered the existing generated image into a NEW For review item. No saved wardrobe files modified.')
