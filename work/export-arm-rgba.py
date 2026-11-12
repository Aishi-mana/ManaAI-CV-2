from PIL import Image
from pathlib import Path
r=Path('exports/images/arm-hair-refinement-20261029')
for name in ['sailor','purple','mint-dress','rose-cardigan']:(r/name/'outfit.rgba').write_bytes(Image.open(r/name/'outfit.png').convert('RGBA').tobytes())
