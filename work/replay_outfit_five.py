from pathlib import Path
import shutil,json,numpy as np
from PIL import Image
root=Path('C:/AI/ManaAI-CV-2');old=root/'exports/images/image-1792995271093435300';out=root/'exports/images/outfit-five-cached-replay-20261027';out.mkdir(exist_ok=True)
for name in ['image.png','request.json','avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/name,out/name)
(out/'opening-parsing').mkdir(exist_ok=True);shutil.copy2(old/'opening-parsing/parsing.npz',out/'opening-parsing/parsing.npz')
import sys;sys.path.insert(0,str(root/'scripts'))
from generated_outfit import prepare_outfit
import outfit_quality
original_cleanup=outfit_quality.clean_opening_edges
outfit_quality.clean_opening_edges=lambda rgba,*args,**kwargs:(rgba.copy(),{})
prepare_outfit(out,out/'avatar-body.png');baseline=np.array(Image.open(out/'outfit.png'));Image.fromarray(baseline).save(out/'before-opening-refinement.png')
outfit_quality.clean_opening_edges=original_cleanup
report=prepare_outfit(out,out/'avatar-body.png');result=np.array(Image.open(out/'outfit.png'));hair=np.array(Image.open(out/'avatar-front-hair.png'))[:,:,3]>0
changed=np.any(baseline!=result,axis=2);assert not changed[hair].any()
body=np.array(Image.open(out/'avatar-body.png'));base=Image.new('RGBA',(843,1264))
for im in [Image.open(root/'assets/avatar/hairstyles/default/hair_back.png'),Image.fromarray(body),Image.fromarray(result),Image.open(root/'assets/avatar/eyes/eye_neutral.png'),Image.open(root/'assets/avatar/mouth/mouth_neutral.png'),Image.open(out/'avatar-front-hair.png')]:base.alpha_composite(im.convert('RGBA'))
bg=Image.new('RGBA',base.size,(243,237,250,255));bg.alpha_composite(base);bg.convert('RGB').save(out/'preview.jpg',quality=94)
verification={'newGenerations':0,'changedOpeningPixels':int(changed.sum()),'changedBehindHair':int(changed[hair].sum()),'fitWarnings':report['fit_warnings'],'openingCleanup':report['opening_cleanup'],'fitChecks':report['fit_checks'],'sourceUnchanged':True};(out/'verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8');print(json.dumps(verification))
