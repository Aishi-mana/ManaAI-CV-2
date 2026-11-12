from pathlib import Path
from PIL import Image
import sys,numpy as np,json,shutil
sys.path.insert(0,'scripts');from garment_only import prepare_garment_only
root=Path('exports/images/collar-arm-20261030');root.mkdir(exist_ok=True)
for name in ['mint-dress','rose-cardigan','sailor','purple']:
 src=Path('exports/images/arm-hair-refinement-20261029')/name;dst=root/name;shutil.copytree(src,dst,dirs_exist_ok=True)
 r=prepare_garment_only(dst,dst/'avatar-body.png');print(name,r['opening_cleanup'],flush=True)
s=Path('work/refine-preview-oct29-outfits.py').read_text().replace('arm-hair-refinement-20261029','collar-arm-20261030');Path('work/preview-collar-arm.py').write_text(s)

