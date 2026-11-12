from pathlib import Path
from PIL import Image
import sys,numpy as np,shutil
sys.path.insert(0,'scripts');import garment_only
root=Path('exports/images/smooth-fit-20261030');root.mkdir(exist_ok=True);src=Path('exports/images/collar-arm-20261030/mint-dress');dst=root/'mint-dress';shutil.copytree(src,dst,dirs_exist_ok=True)
original=garment_only.fit_sleeve_widths
def capture(a,b,prompt):
 Image.fromarray(a).save(dst/'before-sleeves.png');return original(a,b,prompt)
garment_only.fit_sleeve_widths=capture;garment_only.prepare_garment_only(dst,dst/'avatar-body.png')
