from pathlib import Path
import shutil,sys
sys.path.insert(0,'scripts')
from garment_only import prepare_garment_only
p=Path('exports/images/wear-cleanup-20261030/body-free-blue');p.mkdir(parents=True,exist_ok=True);src=Path('exports/images/clothing-only-20261030/body-free-blue')
for f in ['image.png','generation.json','request.json','avatar-body.png','avatar-front-hair.png']:shutil.copy2(src/f,p/f)
if not (p/'opening-parsing').exists():shutil.copytree(src/'opening-parsing',p/'opening-parsing')
r=prepare_garment_only(p,p/'avatar-body.png');print(r['sleeve_resize']['proportions']);print(r['fit_warnings'])
