from pathlib import Path
from PIL import Image
import json
root=Path('exports/images/hair-landmarks-20261028');entries=[]
for key,folder in [('accepted','bangs-back-trial-20261027'),('eightbit','hair-content-check-20261028'),('spikes','image-1793139169395900700'),('style','hairstyle-style-reference-trial-20261027')]:
 p=Path('exports/images')/folder/'image.jpg'
 if not p.exists():continue
 im=Image.open(p).convert('RGBA');(root/(key+'.rgba')).write_bytes(im.tobytes());entries.append({'key':key,'width':im.width,'height':im.height})
(root/'inputs.json').write_text(json.dumps(entries))
