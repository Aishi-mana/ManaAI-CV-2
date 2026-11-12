from pathlib import Path
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8').replace('a crown and pointed strands down to the eyebrows','a smooth rounded top edge and fringe tips just above the eyebrows').replace('with rounded crown','with a smooth rounded top edge').replace('Same crown scale for both.','Same scalp width for both. No crown, tiara, headband, horns, spikes or pointed decorations along the top edge.')
s=s.replace(' const bounds=hairBounds(data,width,height);',''' const bounds=hairBounds(data,width,height);
 // Repeated isolated points along the top are generated headgear, not a smooth hairline.
 const band=Math.max(2,Math.round(bounds.height*.10));let runs=0,inside=false;
 for(let x=bounds.x;x<bounds.x+bounds.width;x++){let count=0;for(let y=bounds.y;y<bounds.y+band;y++)if(data[(y*width+x)*4+3]>32)count++;const occupied=count>=2;if(occupied&&!inside)runs++;inside=occupied;}
 if(runs>=4)throw Error('Crown-like spikes or headgear were generated. Hair must have a smooth top edge; no review was saved.');''',1)
s=s.replace("s=targetWidth/bounds.width", "s=Math.min(targetWidth/bounds.width,slot==='front'?body.height*.225/bounds.height:Infinity)").replace('left=body.width/2-targetWidth/2','left=body.width/2-bounds.width*s/2')
p.write_text(s,encoding='utf-8')
p=Path('src/components/GeneratedHair.tsx');s=p.read_text(encoding='utf-8').replace("text, shadow',width", "text, shadow, crown, tiara, headband, horns, top spikes',width").replace("fit:'uniform-size-common-crown-v1'", "fit:'uniform-size-height-bounded-v2'");p.write_text(s,encoding='utf-8')
p=Path('src/core/generatedOutfits.ts');s=p.read_text(encoding='utf-8').replace('no body visible. White empty space', 'no body visible. Every gap and garment opening must show the same pure white background, including the waist gap, sleeve cuffs and sock tops: no peach or skin-colored inserts. White empty space');p.write_text(s,encoding='utf-8')
p=Path('scripts/garment_only.py');s=p.read_text(encoding='utf-8');a=s.index('  seed=candidate&np.isin');b=s.index(' from image_job import status',a)
s=s[:a]+'''  seed=candidate&np.isin(data['labels'],[12,13,14,15])
  near=cv2.dilate(seed.astype(np.uint8),np.ones((7,7),np.uint8))>0
  clothing=np.isin(data['labels'],[4,5,6,7,8,9,10])
  port_mask=near&~clothing&(yy>rgb.shape[0]*.5)
  # Thin skin bands in waist/sock openings can be partially mislabelled as fabric.
  # Grow only color-connected thin bands confirmed by a body-class seed, below shoulders.
  bands=skin_color&(yy>rgb.shape[0]*.38)
  n,parts,stats,_=cv2.connectedComponentsWithStats(bands.astype(np.uint8),8)
  for label in range(1,n):
   x,y,bw,bh,area=stats[label]
   if bh>rgb.shape[0]*.035 or bw<bh*2 or area<20:continue
   component=parts==label
   confirmed=int((component&np.isin(data['labels'],[11,12,13,14,15])).sum())
   if confirmed>=max(3,area*.01):port_mask|=component
'''+s[b:]
# Trigger parsing for skin-colored waist as well as legs, while opening removal stays bounded.
s=s.replace("candidate=skin_color&(yy>rgb.shape[0]*.5)","candidate=skin_color&(yy>rgb.shape[0]*.38)")
p.write_text(s,encoding='utf-8')
