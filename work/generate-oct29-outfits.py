from pathlib import Path
import json,shutil,subprocess
root=Path('exports/images/generation-validation-20261029');old=Path('exports/images/outfit-content-check-20261028');original=json.loads((old/'request.json').read_text());prompts=json.loads(Path('work/oct29-outfit-prompts.json').read_text());python='C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe'
for name,seed,prompt in zip(['mint-dress','rose-cardigan'],[529,923],prompts):
 folder=root/name;folder.mkdir(exist_ok=True)
 for f in ['avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/f,folder/f)
 r={**original,'seed':seed,'prompt':prompt,'outfitBody':str((folder/'avatar-body.png').resolve()),'outfitFrontHair':str((folder/'avatar-front-hair.png').resolve())};(folder/'request.json').write_text(json.dumps(r))
 if (folder/'outfit-report.json').exists():continue
 print('Starting',name,flush=True)
 with (folder/'test.log').open('w') as log:result=subprocess.run([python,'scripts/image_job.py',str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT)
 print('Finished',name,result.returncode,flush=True)
