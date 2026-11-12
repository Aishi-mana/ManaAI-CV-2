from pathlib import Path
import shutil,sys,json
sys.path.insert(0,'scripts')
from garment_only import prepare_garment_only
root=Path('exports/images/generation-validation-20261029')
for key,original in [('sailor','image-1792995271093435300'),('purple','outfit-content-check-20261028')]:
 src=Path('exports/images')/original;dst=root/key;dst.mkdir(exist_ok=True)
 for name in ['image.png','avatar-body.png','avatar-front-hair.png','request.json']:
  if (src/name).exists():shutil.copy2(src/name,dst/name)
 if (src/'opening-parsing').exists():shutil.copytree(src/'opening-parsing',dst/'opening-parsing',dirs_exist_ok=True)
 report=prepare_garment_only(dst,dst/'avatar-body.png');print(key,json.dumps({k:report[k] for k in ['fit_warnings','footwear','torso_pixels_exposed']}))
