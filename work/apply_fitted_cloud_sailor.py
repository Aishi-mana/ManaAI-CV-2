"""Replace the saved sailor with the inspected fit; retain original artwork."""
from pathlib import Path
import json,hashlib,shutil,os

workspace=Path('C:/AI/ManaAI-CV-2').resolve()
app=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion').resolve()
original_id='image-1792972899187697700';new_id='image-1792974681968048100'
outfit_id='atelier_generated_'+original_id
source=workspace/'exports/images'/new_id
verification=json.loads((workspace/'exports/images/cloud-sailor-anatomical-fit-20261026/verification.json').read_text(encoding='utf-8'))
assert verification['shoulder_pixels_byte_identical'] and verification['foot_pixels_exposed']==[0,0]
png=(source/'outfit.png').read_bytes()
original=app/'generated-outfits'/original_id
review=app/'generated-outfits'/new_id
wardrobe=app/'wardrobe/outfits'/outfit_id
old_design=json.loads((original/'design.json').read_text(encoding='utf-8'))
new_design=json.loads((review/'design.json').read_text(encoding='utf-8'))
assert old_design['status']=='saved' and old_design['outfitId']==outfit_id
assert new_design['status']=='pending'
targets=[original/'outfit.png',wardrobe/'outfit.png',review/'outfit.png']
for target,expected in [(targets[0],'052c91239b6cb5d85979397bcaf3e396d91b575edef0b1957eec226a6995ff33'),(targets[1],'052c91239b6cb5d85979397bcaf3e396d91b575edef0b1957eec226a6995ff33'),(targets[2],'4ef64112131e928c0ce53dad47f1da1ba077ee0fbb0396aeb678f08ae19a6991')]:
    assert target.resolve().is_relative_to(app)
    assert hashlib.sha256(target.read_bytes()).hexdigest()==expected,'Artwork changed; refusing overwrite'
def publish(target,data):
    backup=target.with_name(target.name+'.before-anatomical-fit.bak')
    assert not backup.exists()
    shutil.copyfile(target,backup)
    temp=target.with_name(target.name+'.anatomical-fit.tmp');temp.write_bytes(data);os.replace(temp,target)
for target in targets:publish(target,png)
old_design['replacementGeneration']=new_id;old_design['fitVersion']=4
new_design['status']='saved';new_design['outfitId']=outfit_id;new_design['name']=old_design['name']
for folder,record in [(original,old_design),(review,new_design)]:
    publish(folder/'design.json',json.dumps(record,indent=2,ensure_ascii=False).encode('utf-8'))
selection=json.loads((wardrobe/'selection.json').read_text(encoding='utf-8'))
selection['replacementGeneration']=new_id;selection['fitVersion']=4
selection['fitReport']=json.loads((source/'outfit-report.json').read_text(encoding='utf-8'))
publish(wardrobe/'selection.json',json.dumps(selection,indent=2,ensure_ascii=False).encode('utf-8'))
for target in targets:assert target.read_bytes()==png
(workspace/'exports/images/cloud-sailor-anatomical-fit-20261026/applied.json').write_text(json.dumps({'savedOutfit':outfit_id,'name':old_design['name'],'newGenerationUsed':False,'backupsRetained':True,'reviewConsumed':new_id,'sha256':hashlib.sha256(png).hexdigest()},indent=2),encoding='utf-8')
print('Updated saved Cloud sailor with the inspected neckline and footwear fit; backups retained.')
