from pathlib import Path
from PIL import Image
import json
root=Path('exports/images/hair-landmarks-20261028');entries=json.loads((root/'inputs.json').read_text());keys={e['key'] for e in entries}
for folder in root.iterdir():
 if folder.is_dir() and (folder/'image.jpg').exists() and folder.name not in keys:
  im=Image.open(folder/'image.jpg').convert('RGBA');(root/(folder.name+'.rgba')).write_bytes(im.tobytes());entries.append({'key':folder.name,'width':im.width,'height':im.height})
(root/'inputs.json').write_text(json.dumps(entries))
