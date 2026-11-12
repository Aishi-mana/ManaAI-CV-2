import json,base64,os,sys,subprocess
from pathlib import Path
root=Path('exports/images/fresh-outfit-extraction-20261025').resolve();root.mkdir(exist_ok=False)
reference=Path('exports/images/qwen-reference-comparison-20261024/full-avatar/reference.jpg')
(root/'reference.jpg').write_bytes(reference.read_bytes())
r=json.loads(Path('exports/images/auto-outfit-probe-20261025/request.json').read_text(encoding='utf-8'))
r.update(reference='data:image/jpeg;base64,'+base64.b64encode(reference.read_bytes()).decode(),seed=251025318,width=848,height=1264)
r['prompt']='Draw the same Mana character wearing a completely new outfit: a sky-blue sailor dress with a navy collar, white bow, short puff sleeves and a gently flared knee-length skirt, white ankle socks and navy closed-toe Mary Jane shoes. Replace the hoodie and shorts entirely. Keep the reference face: round cheeks, large blue eyes, short chin and small nose. Keep the same apparent age and compact stylized proportions, large head relative to body and short limbs. Keep silver hair, hairclip and cat-ear headphones. Standing straight front view, arms relaxed slightly away from the dress, legs straight, both shoes fully visible. Plain white background, no text, polished anime illustration.'
(root/'request.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
code="import sys,json;from pathlib import Path;sys.path.insert(0,'scripts');from qwen_image import generate_qwen;p=Path(sys.argv[1]);r=json.loads(p.read_text(encoding='utf-8'));generate_qwen(r,p.parent,lambda d,**kw:(d/'progress.json').write_text(json.dumps(kw),encoding='utf-8'))"
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
with (root/'job.log').open('w',encoding='utf-8') as log:result=subprocess.run([sys.executable,'-c',code,str(root/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
(root/'exit.json').write_text(json.dumps({'exit_code':result.returncode}),encoding='utf-8');print(result.returncode)
