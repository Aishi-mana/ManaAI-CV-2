from pathlib import Path
import json,shutil
p=Path('exports/images/outfit-content-check-20261028');p.mkdir(exist_ok=True);old=Path('exports/images/image-1793138916489904300');r=json.loads((old/'request.json').read_text(encoding='utf-8'))
for file in ['avatar-body.png','avatar-front-hair.png']:shutil.copy2(old/file,p/file)
r['outfitBody']=str((p/'avatar-body.png').resolve());r['prompt']=r['prompt'].replace('no body visible. White empty space','no body visible. Every gap and garment opening must show the same pure white background, including the waist gap, sleeve cuffs and sock tops: no peach or skin-colored inserts. White empty space');(p/'request.json').write_text(json.dumps(r),encoding='utf-8')
