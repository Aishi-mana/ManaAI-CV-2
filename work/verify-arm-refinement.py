from PIL import Image
from pathlib import Path
import numpy as np,json
old=Path('exports/images/generation-validation-20261029');root=Path('exports/images/arm-hair-refinement-20261029');report=[]
for name in ['sailor','purple','mint-dress','rose-cardigan']:
 a=np.array(Image.open(old/name/'outfit.png'));b=np.array(Image.open(root/name/'outfit.png'));h=a.shape[0]
 r=json.loads((root/name/'outfit-report.json').read_text());report.append(dict(name=name,upper_40_percent_unchanged=bool(np.array_equal(a[:round(h*.4)],b[:round(h*.4)])),footwear_unchanged=bool(np.array_equal(a[round(h*.7):],b[round(h*.7):])),warnings=r['fit_warnings'],fit_checks=r['fit_checks']))
print([(r['name'],r['upper_40_percent_unchanged'],r['footwear_unchanged'],r['warnings']) for r in report]);(root/'verification.json').write_text(json.dumps(report,indent=2))
for folder,label in [(old,'before'),(root,'after')]:
 im=Image.frombytes('RGBA',(512,768),(folder/'user-new-back.rgba').read_bytes());bg=Image.new('RGBA',im.size,'#44685c');bg.alpha_composite(im);bg.convert('RGB').save(root/('hair-edge-'+label+'.jpg'))
