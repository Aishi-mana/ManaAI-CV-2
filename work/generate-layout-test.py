from pathlib import Path
import json,shutil,subprocess
root=Path('exports/images/fresh-production-20261030');p=root/'blue-coat-layout';p.mkdir(exist_ok=True);old=root/'blue-coat';r=json.loads((old/'request.json').read_text());prompts=json.loads(Path('work/fresh-clean-prompts.json').read_text())
for f in ['avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/f,p/f)
r.update(seed=18041,prompt=prompts[0],outfitBody=str((p/'avatar-body.png').resolve()),outfitFrontHair=str((p/'avatar-front-hair.png').resolve()));(p/'request.json').write_text(json.dumps(r))
print('Generating layout test',flush=True)
with (p/'test.log').open('w') as log:result=subprocess.run(['C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe','scripts/image_job.py',str(p/'request.json')],stdout=log,stderr=subprocess.STDOUT)
print('Finished',result.returncode,flush=True)
