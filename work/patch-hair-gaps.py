from pathlib import Path
p=Path('src/core/generatedHair.ts')
s=p.read_text();s=s.replace('let background=0;','let background=0;\n const enclosed:{pixels:number[];x:number;y:number;neutral:number}[]=[];')
s=s.replace('if(edge){for(let k=0;k<tail;k++)data[queue[k]*4+3]=0;if(edge)background+=tail;}','''if(edge){for(let k=0;k<tail;k++)data[queue[k]*4+3]=0;background+=tail;}
  else if(slot==='back'&&tail>=24){let neutral=0;for(let k=0;k<tail;k++){const p=queue[k]*4,r=data[p],g=data[p+1],b=data[p+2];if(Math.min(r,g,b)>250&&Math.max(r,g,b)-Math.min(r,g,b)<4)neutral++;}enclosed.push({pixels:Array.from(queue.slice(0,tail)),x:(x0+x1)/2,y:(y0+y1)/2,neutral:neutral/tail});}''')
s=s.replace('const bounds=hairBounds(data,width,height);','''const bounds=hairBounds(data,width,height);
 // A white curl gap is near the lower outer silhouette, unlike crown highlights.
 // Require a strongly neutral matte core; tinted silver shading stays untouched.
 let enclosedBackgroundRemoved=0;
 for(const gap of enclosed)if(gap.neutral>=.60&&gap.y>bounds.y+bounds.height*.42&&Math.abs(gap.x-(bounds.x+bounds.width/2))>bounds.width*.25){for(const i of gap.pixels){data[i*4+3]=0;enclosedBackgroundRemoved++;}}''',1)
s=s.replace('return {data,bounds};','return {data,bounds,enclosedBackgroundRemoved};',1);p.write_text(s)
