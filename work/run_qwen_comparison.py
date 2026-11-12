import json,os,sys,subprocess
from pathlib import Path
from PIL import Image
root=Path('exports/images/qwen-reference-comparison-20261024').resolve()
r=json.loads((root/'baseline-request.json').read_text(encoding='utf-8'))
source=Path('exports/images/image-1792852920465819100/reference.jpg')
with Image.open(source) as im:
    # Fixed normalized head crop from this saved full-height avatar, including hair/headset.
    w,h=im.size;im.crop((int(w*.16),0,int(w*.84),int(h*.34))).save(root/'face-reference.png')
variants=['full-avatar','avatar-plus-face','turnaround']
for name in variants:
    folder=root/name;folder.mkdir(exist_ok=True)
    req=dict(r)
    if name=='avatar-plus-face':req['diagnosticFace']=str(root/'face-reference.png')
    if name=='turnaround':
        req.pop('reference',None);req['qwenReference']='C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input/Mana Turnaround Sheet.png'
    (folder/'request.json').write_text(json.dumps(req,indent=2),encoding='utf-8')
    code="import sys,json;from pathlib import Path;sys.path.insert(0,'work');from qwen_comparison_worker import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
    env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
    with (folder/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
    (folder/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8')
    print(name,result.returncode,flush=True)
    if result.returncode:break
