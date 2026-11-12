from pathlib import Path
from PIL import Image
import json
r=Path('exports/images/collar-arm-20261030/mint-dress');j=json.loads((r/'outfit-report.json').read_text());print(j['fit_checks']);Image.open(r/'composite.jpg').crop((230,350,615,710)).save(r/'collar-arms-preview.jpg')
