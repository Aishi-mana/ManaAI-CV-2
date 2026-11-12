from pathlib import Path
from PIL import Image
import json,numpy as np,base64
root=Path('exports/images/arm-hair-refinement-20261029');reports=[]
for entry in json.loads((root/'editable-layers.json').read_text()):
 name=entry['name'];im=Image.open(root/name/'outfit.png').convert('RGBA');a=np.array(im);h,w=a.shape[:2];yy,xx=np.indices((h,w));count=np.zeros((h,w),int)
 for part in entry['parts']:
  mask=np.zeros((h,w),bool)
  for region in part['regions']:
   p,q=region['points'][0],region['points'][2];rect=(xx>=p['x'])&(xx<q['x'])&(yy>=p['y'])&(yy<q['y'])
   mask=mask&~rect if region['erase'] else mask|rect
  count+=mask
 good=bool((count[a[:,:,3]>0]==1).all());reports.append(dict(name=name,all_visible_pixels_in_exactly_one_layer=good,layers=[p['name'] for p in entry['parts']]))
 assert good,name
 project=dict(name=name,sourceSize=dict(width=w,height=h),sourceDataUrl='data:image/png;base64,'+base64.b64encode((root/name/'outfit.png').read_bytes()).decode(),parts=entry['parts'],activePartId=entry['parts'][0]['id'])
 out=Path('exports/atelier-projects')/('separate-footwear-'+name+'-20261029.mana-project.json');out.write_text(json.dumps(dict(format='mana-atelier-project',version=1,category='outfit',depth='front',project=project)))
(root/'layer-coverage.json').write_text(json.dumps(reports,indent=2));print(reports)
