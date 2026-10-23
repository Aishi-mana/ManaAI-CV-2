import json,time,base64
from pathlib import Path
root=Path('C:/AI/ManaAI-CV-2')
r=json.loads((root/'exports/images/image-1792616476092891700/request.json').read_text())
r.pop('referenceMask',None)
r['reference']='data:image/jpeg;base64,'+base64.b64encode((root/'exports/images/image-1792616476092891700/reference.jpg').read_bytes()).decode()
p=root/'exports/images'/('unmasked-quality-check-'+str(time.time_ns()));p.mkdir();(p/'request.json').write_text(json.dumps(r));(root/'work/unmasked-quality-path.txt').write_text(str(p));print(p)
