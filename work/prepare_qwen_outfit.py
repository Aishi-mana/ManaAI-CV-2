import json,time
from pathlib import Path
root=Path('C:/AI/ManaAI-CV-2');r=json.loads((root/'exports/images/qwen-integrated-check-1792633478346280000/request.json').read_text())
r.pop('qwenReference',None);r.pop('reference',None);r.update(json.loads((root/'work/outfit-qwen-prompt.json').read_text()));r.update(characterReference=False,seed=874191)
p=root/'exports/images'/('qwen-outfit-set-'+str(time.time_ns()));p.mkdir();(p/'request.json').write_text(json.dumps(r,indent=2));(root/'work/qwen-outfit-path.txt').write_text(str(p))
