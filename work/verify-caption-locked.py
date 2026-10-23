import json
from pathlib import Path
import soundfile as sf
import numpy as np
p=Path('exports/singing/original-caption-locked-preview-2026-10-18');r=json.loads((p/'result.json').read_text());assert not r.get('error'),r
req=json.loads((p/'ace-request.json').read_text());raw=json.loads((p/'ace-planner-original.json').read_text());plan=json.loads((p/'ace-request0.json').read_text())
x,sr=sf.read(r['mix'],always_2d=True)
checks={'seconds':len(x)/sr,'planner_caption_locked':raw['caption']==req['caption'],'render_caption_matches':plan['caption']==req['caption'],'bpm':plan['bpm'],'lyrics_preserved':plan['lyrics']==req['lyrics'],'finite':bool(np.isfinite(x).all()),'non_silent':bool(np.max(np.abs(x))>0)}
print(json.dumps(checks));assert checks['planner_caption_locked'] and checks['render_caption_matches'] and checks['lyrics_preserved'] and checks['seconds']<=15 and checks['finite'] and checks['non_silent']
