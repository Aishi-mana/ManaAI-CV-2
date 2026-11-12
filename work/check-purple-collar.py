from PIL import Image
from pathlib import Path
import json
for root in ['arm-hair-refinement-20261029','collar-cleanup-20261030']:
 p=Path('exports/images')/root/'purple';print(root,json.load(open(p/'outfit-report.json'))['opening_cleanup']);Image.open(p/'outfit.png').crop((330,340,515,460)).resize((555,360)).save('work/'+root+'-purple-collar.png')
