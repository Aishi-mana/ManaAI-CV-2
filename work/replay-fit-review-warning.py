import sys,json,shutil,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('scripts').resolve()))
from garment_only import prepare_garment_only
original=Path('exports/images/image-1793138916489904300');target=Path('exports/images/fit-review-replay-20261028');target.mkdir(exist_ok=True)
files=['image.png','request.json','avatar-body.png','avatar-front-hair.png'];before={name:hashlib.sha256((original/name).read_bytes()).hexdigest() for name in files if (original/name).exists()}
for name in before:shutil.copy2(original/name,target/name)
if (original/'opening-parsing').exists():shutil.copytree(original/'opening-parsing',target/'opening-parsing',dirs_exist_ok=True)
r=prepare_garment_only(target,target/'avatar-body.png')
assert before=={name:hashlib.sha256((original/name).read_bytes()).hexdigest() for name in before}
print(json.dumps({'output_exists':(target/'outfit.png').exists(),'automatic_save_allowed':r['automatic_save_allowed'],'fit_warnings':r['fit_warnings'],'source_unchanged':True}))
