from pathlib import Path
from PIL import Image
import numpy as np
old=Path('exports/images/arm-hair-refinement-20261029');new=Path('exports/images/collar-cleanup-20261030')
for name in ['mint-dress','rose-cardigan','sailor','purple']:
 a=np.array(Image.open(old/name/'outfit.png'));b=np.array(Image.open(new/name/'outfit.png'));d=np.any(a!=b,2);print(name,int(d.sum()))
 if name not in ['mint-dress','purple']:assert not d.any()
 else:
  yy,xx=np.where(d);assert yy.min()>340 and yy.max()<435 and xx.min()>350 and xx.max()<493
Image.open(new/'mint-dress/composite.jpg').crop((330,340,515,460)).resize((555,360),Image.Resampling.LANCZOS).save(new/'collar-preview.jpg')
note='''## 2026-10-30 — Dark fill inside round collar cleanup

User clarified the dark green insert inside the mint-dress collar in the assistant preview must be erased. Added production outfit_quality.clean_collar_insert and wired garment_only final cleanup. It requires opening adjacency, a bounded broad/shallow similar-color component below the measured neck opening, moderate dark value and brighter fabric below. Removes fill and narrow upper dark outline overhang; retains lower collar outline, decorated collar, protected hair-covered pixels. No global dark-color deletion; navy bib continuing below opening is preserved. Model-generated arbitrary collar shapes still require review.

Cached production replays: mint removes1557pixels in collar only; purple also removes a similar shaded collar insert; rose/sailor unchanged byte-for-byte versus prior outputs. No regeneration or saved-item replacement. Artifacts exports/images/collar-cleanup-20261030/mint-dress/{composite.jpg,collar-preview.jpg}, all4 reports. Two new quality tests cover insert/upper-outline removal, lower fabric/outline/protected/source preservation, dark garment negative case.6 quality+6 garment tests pass. Python-only change: installed both updated scripts into src-tauri/target/debug/scripts, verified hashes match; no executable rebuild/closure required. Next generation/retry fitting uses update; existing saved PNG untouched.\n\n'''
for name in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md']:
 p=Path(name);p.write_text(note+p.read_text(encoding='utf-8'),encoding='utf-8')
p=Path('docs/GENERATED_OUTFITS.md');p.write_text(p.read_text(encoding='utf-8')+'\n\n'+note,encoding='utf-8')
