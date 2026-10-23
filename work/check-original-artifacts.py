import json
import numpy as np
import soundfile as sf
from pathlib import Path
p=Path('exports/singing/original-direction-preview-2026-10-18')
x,sr=sf.read(p/'original-song.wav',always_2d=True)
plan=json.loads((p/'ace-request0.json').read_text())
print(json.dumps({'seconds':len(x)/sr,'samples_near_full_scale_percent':100*float(np.mean(np.abs(x)>=.999)),'code_count':len(plan['audio_codes'].split(',')),'requested_duration':plan['duration'],'planner_bpm':plan['bpm'],'vocal_instructions':plan['caption']},indent=2))
