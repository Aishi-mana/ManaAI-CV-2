"""Keep the original saved outfit; retain source pixels only under shoulder hair."""
from pathlib import Path
import hashlib,json,os,shutil
workspace=Path('C:/AI/ManaAI-CV-2').resolve()
app=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion').resolve()
out=workspace/'exports/images/front-hair-exclusion-20261026'
previous=json.loads((workspace/'exports/images/cloud-sailor-original-restored-20261026/applied.json').read_text(encoding='utf-8'))
id='image-1792972899187697700';png=(out/'saved-outfit.png').read_bytes()
targets=[app/'wardrobe/outfits'/('atelier_generated_'+id)/'outfit.png',app/'generated-outfits'/id/'outfit.png']
for target in targets:
    assert target.resolve().is_relative_to(app)
    assert hashlib.sha256(target.read_bytes()).hexdigest()==previous['sha256'],'Current outfit changed; refusing overwrite'
for target in targets:
    backup=target.with_name(target.name+'.before-cleanup-exclusion.bak')
    assert not backup.exists();shutil.copyfile(target,backup)
    temporary=target.with_name(target.name+'.cleanup-exclusion.tmp');temporary.write_bytes(png);os.replace(temporary,target)
    assert target.read_bytes()==png
(out/'applied.json').write_text(json.dumps({'savedOutfit':'atelier_generated_'+id,'cleanupRule':'retain source pixels under selected front hair','outside_shoulder_exclusion_unchanged':True,'sha256':hashlib.sha256(png).hexdigest(),'backups_retained':True},indent=2),encoding='utf-8')
print('Applied source-pixel protection only beneath front hair at shoulders; rest of saved outfit unchanged.')
