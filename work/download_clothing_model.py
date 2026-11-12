import urllib.request,json,hashlib,os
from pathlib import Path
repo='mattmdjaga/segformer_b2_clothes';base='https://huggingface.co/'
metadata=json.load(urllib.request.urlopen(base+'api/models/'+repo+'?blobs=true',timeout=60));revision=metadata['sha']
root=Path('models/clothing-segformer-b2');root.mkdir(parents=True,exist_ok=True)
manifest={'repository':repo,'revision':revision,'files':[]}
for filename in ['config.json','preprocessor_config.json','model.safetensors']:
 item=next(v for v in metadata['siblings'] if v['rfilename']==filename)
 target=root/filename;part=root/(filename+'.part');url=base+repo+'/resolve/'+revision+'/'+filename
 digest=hashlib.sha256();size=0
 with urllib.request.urlopen(url,timeout=90) as source,part.open('wb') as out:
  while True:
   block=source.read(1024*1024)
   if not block:break
   out.write(block);digest.update(block);size+=len(block)
 expected=item.get('lfs',{}).get('sha256')
 if expected and digest.hexdigest()!=expected:raise RuntimeError('SHA256 mismatch for '+filename)
 if size!=item['size']:raise RuntimeError('Size mismatch for '+filename)
 os.replace(part,target);manifest['files'].append({'name':filename,'bytes':size,'sha256':digest.hexdigest(),'publisher_sha256':expected});print(filename,size,flush=True)
(root/'download-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');print('download complete',revision,flush=True)
