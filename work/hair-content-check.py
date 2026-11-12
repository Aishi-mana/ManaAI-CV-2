from pathlib import Path
import json
root=Path('exports/images/hair-content-check-20261028');root.mkdir(exist_ok=True)
r=json.loads(Path('exports/images/image-1793139169395900700/request.json').read_text(encoding='utf-8'));r['prompt']=json.loads(Path('work/hair-content-prompt.json').read_text())['prompt'];r['negative']=r.get('negative','')+', crown, tiara, headband, horns, top spikes'
(root/'request.json').write_text(json.dumps(r),encoding='utf-8')
