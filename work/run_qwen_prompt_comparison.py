import json,os,sys,subprocess,shutil
from pathlib import Path
root=Path('exports/images/qwen-prompt-comparison-20261024').resolve();root.mkdir(exist_ok=False)
baseline=Path('exports/images/qwen-reference-comparison-20261024/full-avatar');shutil.copytree(baseline,root/'existing-prompt')
r=json.loads((baseline/'request.json').read_text(encoding='utf-8'))
r['prompt']=('Draw the same character from the reference seated comfortably reading an open book in a magical library. '
'Keep the reference face: round cheeks, large eyes, a short chin and small nose. Keep the same apparent age and compact stylized proportions, with a large head relative to the body and short limbs matching the reference. '
'Keep the exact reference hair color, eye color, hairstyle, hairclip, headset and outfit. '
'Both hands naturally support the book, eyes looking at its pages. Create a new seated pose with natural perspective. '
'One character, warm lamps, glowing magic, detailed library shelves, polished anime illustration.')
folder=root/'concise-prompt';folder.mkdir();(folder/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
code="import sys,json;from pathlib import Path;sys.path.insert(0,'work');from qwen_comparison_worker import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (folder/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(folder/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(folder/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print('concise-prompt',result.returncode,flush=True)
