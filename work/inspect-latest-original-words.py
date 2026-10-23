import json
from pathlib import Path
folders=sorted([p for p in Path('exports/singing').glob('original-*') if p.is_dir() and p.name[len('original-'):].isdigit()],key=lambda p:p.stat().st_mtime,reverse=True)[:10]
for p in folders:
 def read(name):
  f=p/name
  return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
 req=read('request.json');render=read('ace-request0.json');result=read('result.json')
 print(json.dumps(dict(folder=p.name,title=req.get('title'),instrumental=req.get('instrumental'),requestedSeconds=req.get('duration'),actualSeconds=result.get('seconds'),guidance=render.get('guidance_scale'),seed=req.get('seed'),lyricLines=len([l for l in render.get('lyrics','').splitlines() if l.strip() and not l.startswith('[')]),lyrics=render.get('lyrics','')[:450],caption=render.get('caption','')[:160]),ensure_ascii=True))
