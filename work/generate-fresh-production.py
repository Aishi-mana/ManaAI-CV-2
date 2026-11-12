from pathlib import Path
import json,shutil,subprocess
root=Path('exports/images/fresh-production-20261030');root.mkdir(exist_ok=True);old=Path('exports/images/outfit-content-check-20261028');base=json.loads((old/'request.json').read_text());prompts=json.loads(Path('work/fresh-clean-prompts.json').read_text());python='C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe'
for name,seed,prompt in zip(['blue-coat','apricot-blouse'],[18031,18032],prompts):
 p=root/name;p.mkdir(exist_ok=True)
 for f in ['avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/f,p/f)
 r={**base,'seed':seed,'prompt':prompt,'outfitBody':str((p/'avatar-body.png').resolve()),'outfitFrontHair':str((p/'avatar-front-hair.png').resolve())};(p/'request.json').write_text(json.dumps(r))
 if (p/'image.png').exists():continue
 print('Generating',name,flush=True)
 with (p/'test.log').open('w') as log:result=subprocess.run([python,'scripts/image_job.py',str(p/'request.json')],stdout=log,stderr=subprocess.STDOUT)
 print('Finished',name,result.returncode,flush=True)
