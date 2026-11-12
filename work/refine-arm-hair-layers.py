from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();s=s.replace('''        first=body_rows[0][0]
        for y,parts in body_rows:
            if y>wrist:continue
            arm=parts[index];center=(arm[0]+arm[-1])/2''','''        first=body_rows[0][0]
        wrist_arm=next(parts[index] for y,parts in body_rows if y==wrist)
        # Hold wrist coverage through the cuff, then ease back to its original
        # edge below the wrist. The previous taper ended AT the wrist and
        # deliberately undid the correction where it was most needed.
        cuff_end=wrist
        for y in range(wrist,min(h,wrist+max(3,round(h*.025)))):
            matching=[r for r in runs(rgba[y,:,3]>32) if r[-1]>=wrist_arm[0] and r[0]<=wrist_arm[-1] and ((r[-1]<w*.46) if index==0 else (r[0]>w*.54))]
            if not matching:break
            cuff_end=y
        rows=[(y,parts[index]) for y,parts in body_rows if y<=wrist]
        rows.extend((y,wrist_arm) for y in range(wrist+1,cuff_end+1))
        for y,arm in rows:
            center=(arm[0]+arm[-1])/2''');s=s.replace('max(0.,(wrist-y)/max(1,h*.012))','(max(0.,(cuff_end-y)/max(1,cuff_end-wrist)) if y>wrist else 1.)');s=s.replace("'hands_preserved':True","'cuff_end_bounded':True");p.write_text(s)
p=Path('src/core/outfitPrototype.ts');s=p.read_text();start=s.index("  if(parts.length>128)return");end=s.index('\n',start);s=s[:start]+s[end:];s=s.replace('p.top>height*.75?', 'p.top>height*.70&&p.bottom>height*.90?');p.write_text(s)
p=Path('src/core/generatedHair.ts');s=p.read_text();at=s.index(' return {data,bounds,enclosedBackgroundRemoved};');s=s[:at]+''' // Unmix only the light matte fringe next to transparency. Dark outline cores
 // and interior hair/highlights are unchanged; this is not a global blur.
 const edgeSource=new Uint8ClampedArray(data);let edgePixelsRefined=0;
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
  const i=y*width+x,p=i*4;if(edgeSource[p+3]===0||Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2])<140)continue;
  if(!neighbors(i).some(j=>j>=0&&edgeSource[j*4+3]===0))continue;
  let best=p,bestLight=Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2]);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const q=((y+dy)*width+x+dx)*4;if(edgeSource[q+3]<250)continue;
   const light=Math.min(edgeSource[q],edgeSource[q+1],edgeSource[q+2]);if(light<bestLight){best=q;bestLight=light;}
  }
  if(bestLight>=190||Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2])-bestLight<20)continue;
  let alpha=0;for(let c=0;c<3;c++)alpha=Math.max(alpha,(255-edgeSource[p+c])/Math.max(1,255-edgeSource[best+c]));alpha=Math.min(1,Math.max(.05,alpha));
  for(let c=0;c<3;c++)data[p+c]=Math.round(Math.max(0,Math.min(255,(edgeSource[p+c]-255*(1-alpha))/alpha)));
  data[p+3]=Math.round(edgeSource[p+3]*alpha);edgePixelsRefined++;
 }
''' +s[at:];s=s.replace('return {data,bounds,enclosedBackgroundRemoved};','return {data,bounds,enclosedBackgroundRemoved,edgePixelsRefined};');p.write_text(s)
