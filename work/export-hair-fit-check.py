from PIL import Image
from pathlib import Path
import json,base64,io
p=Path('exports/images/hair-content-check-20261028');atlas=Image.new('RGBA',(1024,768))
for i,slot in enumerate(['front','back']):atlas.paste(Image.frombytes('RGBA',(512,768),(p/(slot+'.rgba')).read_bytes()),(i*512,0))
buf=io.BytesIO();atlas.save(buf,format='PNG');source='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode();parts=[r['piece'] for r in json.loads((p/'fit.json').read_text())];project={'name':'Hair fit check - smooth top','parts':parts,'activePartId':'bangs','sourceSize':{'width':1024,'height':768},'sourceDataUrl':source}
project['history']={'past':[],'present':{'pieces':parts,'activeId':'bangs'},'future':[]}
folder=Path('exports/atelier-projects');folder.mkdir(exist_ok=True);file=folder/'hair-fit-check-20261028.mana-project.json';file.write_text(json.dumps({'format':'mana-atelier-project','version':1,'category':'hair','depth':'top','project':project}),encoding='utf-8');print(file)
