from PIL import Image
from pathlib import Path
im=Image.open('exports/images/image-1793139169395900700/image.jpg').convert('RGBA');Path('work/rejected-hair-original.rgba').write_bytes(im.tobytes())
