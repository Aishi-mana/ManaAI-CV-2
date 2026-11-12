from PIL import Image,ImageDraw
from pathlib import Path
import json
root=Path('exports/images/arm-hair-refinement-20261029');results=json.loads((root/'results.json').read_text());cards=[]
for r in results:
 if 'rejected' in r:continue
 w,h=r['width'],r['height'];layers={}
 for i,p in enumerate(r['parts']):
  slot=p['depth'];bounds=p['regions'][0]['points'];x0,y0=bounds[0]['x'],bounds[0]['y'];x1,y1=bounds[2]['x'],bounds[2]['y'];localx=x0-(w//2 if i else 0);im=Image.frombytes('RGBA',(w//2,h),(root/(r['key']+'-'+slot+'.rgba')).read_bytes()).crop((round(localx),round(y0),round(localx+x1-x0),round(y1)));t=p['transform'];s=max(843/w,1264/h)*t['scale'];x=(843-w*s)/2+t['x']+x0*s;y=(1264-h*s)/2+t['y']+y0*s;layer=Image.new('RGBA',(843,1264));layer.alpha_composite(im.resize((round((x1-x0)*s),round((y1-y0)*s)),Image.Resampling.LANCZOS),(round(x),round(y)));layers[slot]=layer
 result=Image.new('RGBA',(843,1264),'#f4eff8');result.alpha_composite(layers['back'])
 for f in ['base/body.png','outfits/default/outfit.png','eyes/eye_neutral.png','mouth/mouth_neutral.png']:result.alpha_composite(Image.open('assets/avatar/'+f).convert('RGBA'))
 result.alpha_composite(layers['front']);result.convert('RGB').save(root/(r['key']+'-preview.jpg'))
 card=Image.new('RGB',(420,550),'white');card.paste(result.crop((140,0,705,650)).convert('RGB').resize((420,483)),(0,35));d=ImageDraw.Draw(card);d.text((12,10),r['key']+' | scalp '+str(round(r['report']['scalpUncovered']*100,1))+'% | iris '+str(round(r['report']['eyesCovered']*100,1))+'%',fill='black');cards.append(card)
contact=Image.new('RGB',(840,550*((len(cards)+1)//2)),'#ddd')
for i,card in enumerate(cards):contact.paste(card,((i%2)*420,(i//2)*550))
contact.save(root/'contact.jpg')
