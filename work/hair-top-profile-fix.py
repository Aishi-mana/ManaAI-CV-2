from pathlib import Path
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8');anchor=' if(runs>=4)';idx=s.index(anchor);s=s[:idx]+''' const profile=Array.from({length:bounds.width},(_,dx)=>{for(let y=bounds.y;y<bounds.y+bounds.height;y++)if(data[(y*width+bounds.x+dx)*4+3]>128)return y;return height;});
 const radius=Math.max(4,Math.round(bounds.width*.06));let peaks=0,inPeak=false;
 for(let x=radius;x<profile.length-radius;x++){const neighbors=profile.slice(x-radius,x+radius+1).sort((a,b)=>a-b),median=neighbors[Math.floor(neighbors.length/2)],peak=median-profile[x]>Math.max(4,bounds.height*.03);if(peak&&!inPeak)peaks++;inPeak=peak;}
 runs=Math.max(runs,peaks);
'''+s[idx:];p.write_text(s,encoding='utf-8')
