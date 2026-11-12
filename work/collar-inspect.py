from PIL import Image
import json
p='exports/images/arm-hair-refinement-20261029/mint-dress/'
r=json.load(open(p+'outfit-report.json'));print(r['neck_bounds'])
Image.open(p+'outfit.png').crop((340,350,505,440)).resize((660,360)).save('work/collar-detail.png')
