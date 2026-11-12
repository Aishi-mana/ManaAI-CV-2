"""Restore the user-preferred original outfit with shoulder-only protection."""
from pathlib import Path
import json,hashlib,shutil,os
workspace=Path('C:/AI/ManaAI-CV-2').resolve()
app=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion').resolve()
original_id='image-1792972899187697700';rejected_id='image-1792974681968048100'
outfit_id='atelier_generated_'+original_id
repair=workspace/'exports/images/cloud-sailor-original-restored-20261026'
png=(repair/'outfit.png').read_bytes()
verification=json.loads((repair/'verification.json').read_text(encoding='utf-8'))
assert verification['changes_only_beneath_opaque_front_hair_at_shoulders']
assert verification['neck_sleeves_skirt_footwear_byte_identical']
expected=(workspace/'exports/images'/rejected_id/'outfit.png').read_bytes()
original=app/'generated-outfits'/original_id;rejected=app/'generated-outfits'/rejected_id
wardrobe=app/'wardrobe/outfits'/outfit_id
for target in [original/'outfit.png',wardrobe/'outfit.png']:
    assert target.resolve().is_relative_to(app)
    assert target.read_bytes()==expected,'Saved outfit was edited; refusing overwrite'
def publish(target,data):
    backup=target.with_name(target.name+'.before-original-restoration.bak')
    assert not backup.exists()
    shutil.copyfile(target,backup)
    temp=target.with_name(target.name+'.original-restoration.tmp');temp.write_bytes(data);os.replace(temp,target)
for target in [original/'outfit.png',wardrobe/'outfit.png']:publish(target,png)
record=json.loads((original/'design.json').read_text(encoding='utf-8'))
record.pop('replacementGeneration',None);record['fitVersion']=3
record['shoulderOnlyRestoration']=verification
publish(original/'design.json',json.dumps(record,indent=2,ensure_ascii=False).encode('utf-8'))
selection=json.loads((wardrobe/'selection.json.before-anatomical-fit.bak').read_text(encoding='utf-8'))
selection.pop('replacementGeneration',None);selection.pop('fitReport',None)
selection['fitVersion']=3;selection['shoulderOnlyRestoration']=verification
publish(wardrobe/'selection.json',json.dumps(selection,indent=2,ensure_ascii=False).encode('utf-8'))
old_review=json.loads((rejected/'design.json').read_text(encoding='utf-8'))
old_review['status']='dismissed';old_review['outfitId']=None;old_review['supersededReason']='User prefers the original Mana-generated design; regenerated variant rejected.'
publish(rejected/'design.json',json.dumps(old_review,indent=2,ensure_ascii=False).encode('utf-8'))
assert (wardrobe/'outfit.png').read_bytes()==png
(workspace/'exports/images'/original_id/'outfit.png').write_bytes(png)
(repair/'applied.json').write_text(json.dumps({'outfitId':outfit_id,'restoredOriginalDesign':True,'changedFromOriginalPixels':verification['changed_pixels'],'regeneratedVariantDismissed':rejected_id,'backupsRetained':True,'sha256':hashlib.sha256(png).hexdigest()},indent=2),encoding='utf-8')
print('Restored original Cloud sailor; only 757 shoulder pixels beneath front hair differ from the original.')
