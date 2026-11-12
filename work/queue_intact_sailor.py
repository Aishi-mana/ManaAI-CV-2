"""Publish the inspected regenerated garment as a new review, never overwrite."""
from pathlib import Path
import json,time,os,shutil
workspace=Path('C:/AI/ManaAI-CV-2').resolve()
info=json.loads((workspace/'exports/images/cloud-sailor-intact-regeneration-20261026/registered-job.json').read_text(encoding='utf-8'))
job=(workspace/info['directory']).resolve()
assert job.is_relative_to(workspace/'exports/images')
design_id=info['id'];assert design_id.startswith('image-') and design_id[6:].isdigit()
report=json.loads((job/'outfit-report.json').read_text(encoding='utf-8'))
assert report['fit_version']==4 and not report['shoulder_erasure'] and not report['semantic_cleanup']
app=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion').resolve()
root=app/'generated-outfits';target=root/design_id;staging=root/('.incoming-'+design_id)
assert not target.exists() and not staging.exists()
staging.mkdir()
shutil.copyfile(job/'outfit.png',staging/'outfit.png')
request=json.loads((job/'request.json').read_text(encoding='utf-8'))
record={'id':design_id,'name':'Cloud sailor — intact shoulders','createdAt':int(time.time()),'status':'pending','prompt':request['prompt'],'width':report['width'],'height':report['height'],'outfitId':None,'fitVersion':4}
(staging/'design.json').write_text(json.dumps(record,indent=2,ensure_ascii=False),encoding='utf-8')
os.replace(staging,target)
assert (target/'outfit.png').read_bytes()==(job/'outfit.png').read_bytes()
(job/'review-publication.json').write_text(json.dumps({'id':design_id,'status':'pending','existing_saved_outfit_unchanged':True},indent=2),encoding='utf-8')
print('Added regenerated intact sailor outfit as a new For review item.')
