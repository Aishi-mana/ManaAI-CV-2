from pathlib import Path
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8');a=s.index(' const band=Math.max');b=s.index(' if(runs>=4)',a);s=s[:a]+''' let runs=0;
 for(const fraction of [.10,.15,.20]){const band=Math.max(2,Math.round(bounds.height*fraction));let countRuns=0,inside=false;
  for(let x=bounds.x;x<bounds.x+bounds.width;x++){let count=0;for(let y=bounds.y;y<bounds.y+band;y++)if(data[(y*width+x)*4+3]>32)count++;const occupied=count>=2;if(occupied&&!inside)countRuns++;inside=occupied;}
  runs=Math.max(runs,countRuns);
 }
'''+s[b:];p.write_text(s,encoding='utf-8')
