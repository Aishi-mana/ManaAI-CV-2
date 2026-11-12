import json,os,sys,subprocess,shutil
from pathlib import Path
root=Path('exports/images/qwen-style-comparison-20261024').resolve();root.mkdir(exist_ok=False)
baseline=Path('exports/images/qwen-reference-comparison-20261024/full-avatar')
shutil.copytree(baseline,root/'style-on')
r=json.loads((baseline/'request.json').read_text(encoding='utf-8'));r['diagnosticLoraStrength']=0
folder=root/'style-off';folder.mkdir();(folder/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
code="import sys,json;from pathlib import Path;sys.path.insert(0,'work');from qwen_style_comparison_worker import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (folder/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(folder/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print('style-off',result.returncode,flush=True)
