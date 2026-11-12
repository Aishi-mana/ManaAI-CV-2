import json,sys,subprocess,os,time
from pathlib import Path
root=Path('exports/images/outfit-progress-retry-20261026').resolve();root.mkdir(exist_ok=False)
failed=Path('exports/images/image-1792950923892418300');request=json.loads((failed/'request.json').read_text(encoding='utf-8'));(root/'avatar-body.png').write_bytes((failed/'avatar-body.png').read_bytes());request['outfitBody']=str(root/'avatar-body.png')
(root/'request.json').write_text(json.dumps(request,indent=2),encoding='utf-8')
env=dict(os.environ,HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1');reads=0
with (root/'job.log').open('w',encoding='utf-8') as log:
 process=subprocess.Popen([sys.executable,'-B',str(Path('scripts/image_job.py').resolve()),str(root/'request.json')],stdout=log,stderr=subprocess.STDOUT,env=env)
 while process.poll() is None:
  try:
   with (root/'progress.json').open('r',encoding='utf-8') as reader:
    reader.read();reads+=1;time.sleep(.004)
  except (OSError,ValueError):pass
  time.sleep(.003)
 result=process.wait()
(root/'exit.json').write_text(json.dumps({'exit_code':result,'concurrent_progress_reads':reads}),encoding='utf-8');print(result,reads)
