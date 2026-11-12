from pathlib import Path
from PIL import Image
import json,shutil
root=Path('exports/images/generation-validation-20261029');root.mkdir(exist_ok=True)
old=Path('exports/images/hair-landmarks-20261028')
entries=json.loads((old/'inputs.json').read_text())
for f in ['body.rgba','eyes.rgba','mouth.rgba']+[e['key']+'.rgba' for e in entries]:shutil.copy2(old/f,root/f)
im=Image.open('exports/images/image-1793225204343364800/image.jpg').convert('RGBA');(root/'user-new.rgba').write_bytes(im.tobytes());entries.append(dict(key='user-new',width=im.width,height=im.height));(root/'inputs.json').write_text(json.dumps(entries))
for name in ['replay-hair-landmarks.cjs','preview-hair-landmarks.py']:
 s=(Path('work')/name).read_text().replace('exports/images/hair-landmarks-20261028','exports/images/generation-validation-20261029');(Path('work')/('oct29-'+name)).write_text(s)
