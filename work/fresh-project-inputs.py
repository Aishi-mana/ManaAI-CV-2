from pathlib import Path
from PIL import Image
import json
root=Path('exports/images/fresh-production-20261030')
for name in ['blue-coat-layout','final-lavender']:
 p=root/name
 if not (p/'outfit.png').exists():continue
 im=Image.open(p/'outfit.png').convert('RGBA');(p/'outfit.rgba').write_bytes(im.tobytes())
