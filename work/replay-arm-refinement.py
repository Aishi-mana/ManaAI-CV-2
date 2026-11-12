from pathlib import Path
import shutil,sys,json
sys.path.insert(0,'scripts');from garment_only import prepare_garment_only
root=Path('exports/images/arm-hair-refinement-20261029');root.mkdir(exist_ok=True);old=Path('exports/images/generation-validation-20261029')
for key in ['mint-dress','rose-cardigan','sailor','purple']:
 shutil.copytree(old/key,root/key,dirs_exist_ok=True)
 r=prepare_garment_only(root/key,root/key/'avatar-body.png');print(key,r['fit_warnings'],flush=True)
for f in old.iterdir():
 if f.is_file() and f.suffix in ['.rgba','.json']:shutil.copy2(f,root/f.name)
for name in ['oct29-replay-hair-landmarks.cjs','oct29-preview-hair-landmarks.py','preview-oct29-outfits.py']:
 (Path('work')/('refine-'+name)).write_text((Path('work')/name).read_text().replace('generation-validation-20261029','arm-hair-refinement-20261029'))
