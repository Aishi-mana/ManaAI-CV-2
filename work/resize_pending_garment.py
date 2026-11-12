from pathlib import Path
import json,os
job=Path('C:/AI/ManaAI-CV-2/exports/images/image-1792995271093435300')
pending=Path('C:/Users/Admin/AppData/Roaming/com.mana.companion/generated-outfits')/job.name
record=json.loads((pending/'design.json').read_text(encoding='utf-8'))
if record['status']!='pending':
 print('Design already saved or dismissed; left unchanged. Use Retry fitting on a pending design.')
else:
 temp=pending/'outfit-resize.tmp';temp.write_bytes((job/'outfit.png').read_bytes());os.replace(temp,pending/'outfit.png')
 print('Updated only the pending recovered design with body-based resizing. Saved outfits unchanged.')
