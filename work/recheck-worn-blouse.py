from pathlib import Path
import sys,hashlib,json
sys.path.insert(0,'scripts')
from garment_only import prepare_garment_only
p=Path('exports/images/worn-fit-20261030/fresh-blue-blouse')
r=prepare_garment_only(p,p/'avatar-body.png');print(r['sleeve_resize']['shoulder_drape']);print(r['fit_warnings'])
