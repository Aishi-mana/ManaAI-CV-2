import json,os,sys,subprocess
from pathlib import Path
folder=Path('exports/images/qwen-user-running-recheck-20261024').resolve()
code="import sys,json;from pathlib import Path;sys.path.insert(0,'scripts');from qwen_image import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (folder/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(folder/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print('running-recheck',result.returncode,flush=True)
