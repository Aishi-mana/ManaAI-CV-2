import json
from pathlib import Path
p=json.loads(Path('exports/singing/original-plain-vocal-preview-2026-10-18/request.json').read_text(encoding='utf-8'))
out=Path('exports/singing/original-caption-locked-preview-2026-10-18').resolve();out.mkdir(exist_ok=True)
if (out/'result.json').exists():raise SystemExit('Existing preview: reuse it')
p.update(output=str(out),result=str(out/'result.json'),title='Quiet evening · caption locked test')
(out/'request.json').write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding='utf-8')
