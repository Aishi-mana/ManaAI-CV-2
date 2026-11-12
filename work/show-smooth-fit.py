from PIL import Image
from pathlib import Path
import json
p=Path('exports/images/smooth-fit-20261030/mint-dress');im=Image.open(p/'composite.jpg');im.crop((220,350,625,735)).save(p/'collar-arms-preview.jpg');print(json.loads((p/'outfit-report.json').read_text())['fit_checks'])
