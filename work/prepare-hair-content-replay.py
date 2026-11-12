from PIL import Image
from pathlib import Path
p=Path('exports/images/hair-content-check-20261028');Image.open(p/'image.jpg').convert('RGBA').save(p/'raw.png');(p/'raw.rgba').write_bytes(Image.open(p/'raw.png').tobytes())
