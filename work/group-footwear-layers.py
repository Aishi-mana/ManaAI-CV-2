from pathlib import Path
p=Path('src/core/outfitPrototype.ts');s=p.read_text();a=s.index(' parts.sort((a,b)=>a.top-b.top||a.left-b.left);',s.index('export function preparedOutfitPieces'));b=s.index('\n}',a)
s=s[:a]+''' // Keep detached sock rims, buckles and antialias fragments with their foot.
 // Clothing is one editable group; left/right footwear remain independent.
 const groups=new Map<string,Part>();
 for(const p of parts){const key=p.top>height*.70&&p.bottom>height*.90?(p.left+p.right<width?'Left footwear':'Right footwear'):'Main clothing';groups.set(key,groups.has(key)?merge(groups.get(key)!,p):p);}
 const ordered=['Main clothing','Left footwear','Right footwear'].filter(key=>groups.has(key));
 const rect=(p:Part,erase=false):CutRegion=>({points:[{x:p.left,y:p.top},{x:p.right,y:p.top},{x:p.right,y:p.bottom},{x:p.left,y:p.bottom}],erase});
 return ordered.map((name,i)=>{const p=groups.get(name)!;const regions=[rect(p)];if(name==='Main clothing')for(const key of ['Left footwear','Right footwear']){const foot=groups.get(key);if(foot&&p.left<foot.right&&foot.left<p.right&&p.top<foot.bottom&&foot.top<p.bottom)regions.push(rect(foot,true));}return {id:'prepared-'+(i+1),name,regions,transform:{x:0,y:0,scale:1,frame:1}};});''' +s[b:];p.write_text(s)
