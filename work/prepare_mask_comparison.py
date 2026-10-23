import json,time,base64,io
from pathlib import Path
from PIL import Image,ImageFilter,ImageChops
root=Path('C:/AI/ManaAI-CV-2')
r=json.loads((root/'exports/images/image-1792616476092891700/request.json').read_text())
m=Image.open(io.BytesIO(base64.b64decode(r['referenceMask'].split(',')[1]))).convert('L')
a=Image.open(root/'assets/avatar/base/body.png').convert('RGBA').getchannel('A').resize(m.size)
# Diagnostic: keep the edit near the actual body, allowing room for a skirt.
a=a.filter(ImageFilter.MaxFilter(81))
m=ImageChops.multiply(m,a)
b=io.BytesIO();m.save(b,format='JPEG',quality=95)
r['referenceMask']='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
p=root/'exports/images'/('mask-quality-check-'+str(time.time_ns()));p.mkdir()
(p/'request.json').write_text(json.dumps(r))
(root/'work/mask-quality-path.txt').write_text(str(p))
print(p)
