from pathlib import Path
import json,base64,subprocess
root=Path('exports/images/hair-landmarks-20261028');original=json.loads(Path('exports/images/image-1793139169395900700/request.json').read_text(encoding='utf-8'));prompt=json.loads(Path('work/hair-content-prompt.json').read_text())['prompt'];python='C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe'
for seed in [42,1729,6841]:
 folder=root/str(seed);folder.mkdir(exist_ok=True)
 if (folder/'image.jpg').exists():continue
 r={**original,'seed':seed,'prompt':prompt,'reference':'data:image/jpeg;base64,'+base64.b64encode((root/'reference.jpg').read_bytes()).decode()};r['negative']=r.get('negative','')+', pixel art, jagged outlines, crown, headband, horns';(folder/'request.json').write_text(json.dumps(r),encoding='utf-8')
 print('Starting seed',seed,flush=True)
 with (folder/'test.log').open('w',encoding='utf-8') as log:
  result=subprocess.run([python,'scripts/image_job.py',str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT)
 print('Finished seed',seed,result.returncode,flush=True)
