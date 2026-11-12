from pathlib import Path
import json
for p in sorted(Path('exports/images').glob('image-*'),key=lambda p:p.stat().st_mtime,reverse=True)[:5]:
 try:
  request=json.loads((p/'request.json').read_text(encoding='utf-8'));progress=json.loads((p/'progress.json').read_text(encoding='utf-8'))
  print(p.name,request.get('outfitExtraction'),progress.get('stage'),progress.get('error','')[:180])
 except (OSError,ValueError):pass
