from PIL import Image
from pathlib import Path
import json,base64,io
root=Path('exports/images/hair-landmarks-20261028');folder=Path('exports/atelier-projects');folder.mkdir(exist_ok=True)
for r in json.loads((root/'results.json').read_text()):
 if r['key'] not in ['42','1729','6841'] or 'rejected' in r:continue
 atlas=Image.new('RGBA',(r['width'],r['height']))
 for i,slot in enumerate(['front','back']):atlas.paste(Image.frombytes('RGBA',(r['width']//2,r['height']),(root/(r['key']+'-'+slot+'.rgba')).read_bytes()),(i*r['width']//2,0))
 buf=io.BytesIO();atlas.save(buf,format='PNG');source='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode();project={'name':'Hair landmark test '+r['key'],'parts':r['parts'],'activePartId':'bangs','sourceSize':{'width':r['width'],'height':r['height']},'sourceDataUrl':source,'generation':{'fitReport':r['report']}};project['history']={'past':[],'present':{'pieces':r['parts'],'activeId':'bangs'},'future':[]};(folder/('hair-landmarks-'+r['key']+'-20261028.mana-project.json')).write_text(json.dumps({'format':'mana-atelier-project','version':1,'category':'hair','depth':'top','project':project}),encoding='utf-8')
