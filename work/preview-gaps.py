from PIL import Image,ImageDraw
from pathlib import Path
r=Path('exports/images/generation-validation-20261029');im=Image.frombytes('RGBA',(512,768),(r/'user-new-back.rgba').read_bytes());bg=Image.new('RGBA',im.size,'#44685c');bg.alpha_composite(im);bg.convert('RGB').save(r/'hair-gaps-check.jpg')
