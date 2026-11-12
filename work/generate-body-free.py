from pathlib import Path
import json,shutil,subprocess,hashlib
root=Path('exports/images/fresh-production-20261030');p=Path('exports/images/clothing-only-20261030/body-free-blue');p.parent.mkdir(parents=True,exist_ok=True);p.mkdir(exist_ok=True);old=root/'blue-coat-layout';r=json.loads((old/'request.json').read_text())
for f in ['avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/f,p/f)
r.update(seed=18212,prompt=json.loads(Path('work/worn-blouse-prompt.json').read_text())['prompt'],outfitBody=str((p/'avatar-body.png').resolve()),outfitFrontHair=str((p/'avatar-front-hair.png').resolve()));(p/'request.json').write_text(json.dumps(r))
files=['scripts/image_job.py','scripts/garment_only.py','scripts/clothing_fit.py','scripts/outfit_quality.py','src/core/generatedOutfits.ts'];hashes={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in files};(p/'pipeline-hashes.json').write_text(json.dumps(hashes,indent=2))
print('Generating final fresh lavender',flush=True)
with (p/'test.log').open('w') as log:result=subprocess.run(['C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe','scripts/image_job.py',str(p/'request.json')],stdout=log,stderr=subprocess.STDOUT)
print('Finished',result.returncode,'pipeline unchanged',all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==v for f,v in hashes.items()),flush=True)

