import json,os,sys,subprocess
from pathlib import Path
root=Path('exports/images/qwen-concise-validation-20261024').resolve();root.mkdir(exist_ok=False)
base=json.loads(Path('exports/images/qwen-prompt-comparison-20261024/concise-prompt/request.json').read_text(encoding='utf-8'))
identity=('Keep the reference face: round cheeks, large eyes, a short chin and small nose. Keep the same apparent age and compact stylized proportions, with a large head relative to the body and short limbs matching the reference. '
'Keep the exact reference hair color, eye color, hairstyle, hairclip, headset and outfit. ')
variants=[('reading-second-seed',{**base,'seed':858457731}),('running-full-body',{**base,'seed':3039363804,'prompt':'Draw the same character from the reference running along a sunny beach. '+identity+'Show a balanced running stride with bent elbows and opposite arm and leg movement, hair and fabric following the motion. Her complete figure, both hands and both shoes are visible with space around her head and below her feet. One character, ocean waves and sand, polished anime illustration.'})]
code="import sys,json;from pathlib import Path;sys.path.insert(0,'work');from qwen_comparison_worker import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
for name,r in variants:
 folder=root/name;folder.mkdir();(folder/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
 with (folder/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
 (folder/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print(name,result.returncode,flush=True)
 if result.returncode:break
