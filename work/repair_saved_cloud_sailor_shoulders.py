"""Apply the reviewed shoulder-only repair, keeping recoverable original PNGs."""
from pathlib import Path
import json
import shutil
import os
import hashlib

workspace=Path('C:/AI/ManaAI-CV-2').resolve()
app=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion').resolve()
design_id='image-1792972899187697700'
source=workspace/'exports/images'/design_id
repair=workspace/'exports/images/shoulder-protection-replay-20261026'
record=app/'generated-outfits'/design_id/'design.json'
design=json.loads(record.read_text(encoding='utf-8'))
assert design['id']==design_id and design['status']=='saved'
assert design['outfitId']=='atelier_generated_'+design_id
targets=[app/'generated-outfits'/design_id/'outfit.png',app/'wardrobe/outfits'/design['outfitId']/'outfit.png']
original=(source/'outfit.png').read_bytes()
replacement=(repair/'outfit.png').read_bytes()
verification=json.loads((repair/'repair-verification.json').read_text(encoding='utf-8'))
assert verification['skirt_and_footwear_unchanged'] and verification['exposed_neck_unchanged']
for target in targets:
    assert target.resolve().is_relative_to(app)
    assert target.read_bytes()==original, 'Saved outfit changed since review; refusing to overwrite edits'
for target in targets:
    backup=target.with_name('outfit-before-shoulder-repair.png.bak')
    if backup.exists():
        assert backup.read_bytes()==original
    else:
        shutil.copyfile(target,backup)
    temporary=target.with_name('outfit-shoulder-repair.tmp')
    temporary.write_bytes(replacement)
    os.replace(temporary,target)
    assert target.read_bytes()==replacement
# Preserve the source's original output while adding the missing layer snapshot.
backup=source/'outfit-before-shoulder-repair.png.bak'
if not backup.exists():shutil.copyfile(source/'outfit.png',backup)
shutil.copyfile(repair/'avatar-front-hair.png',source/'avatar-front-hair.png')
shutil.copyfile(repair/'outfit-report.json',source/'outfit-shoulder-repair-report.json')
(source/'outfit.png').write_bytes(replacement)
(repair/'applied-repair.json').write_text(json.dumps({'design':design_id,'outfitId':design['outfitId'],'before_sha256':hashlib.sha256(original).hexdigest(),'after_sha256':hashlib.sha256(replacement).hexdigest(),'backup_name':'outfit-before-shoulder-repair.png.bak','targets':[str(p) for p in targets]},indent=2),encoding='utf-8')
print('Repaired saved Cloud sailor and its design copy; original PNGs retained.')
