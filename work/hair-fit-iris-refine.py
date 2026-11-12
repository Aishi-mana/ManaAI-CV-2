from pathlib import Path
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8');s=s.replace('opaque=(x:number,y:number,s:number)=>','opaque=(x:number,y:number,s:number,topY=top)=>').replace('(y-top)/s+front.bounds.y','(y-topY)/s+front.bounds.y')
s=s.replace("if(eyes)for(let y=0;y<body.height*.32;y+=2)for(let x=0;x<body.width;x+=2)if(eyes[(y*body.width+x)*4+3]>128)eyePoints.push({x,y});", "if(eyes)for(let y=0;y<body.height*.32;y+=2)for(let x=0;x<body.width;x+=2){const i=(y*body.width+x)*4;if(eyes[i+3]>128&&Math.max(eyes[i],eyes[i+1],eyes[i+2])-Math.min(eyes[i],eyes[i+1],eyes[i+2])>35)eyePoints.push({x,y});}")
s=s.replace('scale:number;scalpMiss:number;eyeCovered:number;score:number','scale:number;top:number;scalpMiss:number;eyeCovered:number;score:number')
a=s.index(' for(let ratio=1.08;');b=s.index(' const make=',a)
s=s[:a]+''' for(let ratio=1.08;ratio<=1.46;ratio+=.025)for(let shift=-.06;shift<=.021;shift+=.02){const y=top+guide.headWidth*shift,scale=Math.min(guide.headWidth*ratio/front.bounds.width,cap/front.bounds.height),scalpMiss=scalp.length?scalp.filter(p=>!opaque(p.x,p.y,scale,y)).length/scalp.length:0,eyeCovered=eyePoints.length?eyePoints.filter(p=>opaque(p.x,p.y,scale,y)).length/eyePoints.length:0,score=scalpMiss*12+Math.max(0,eyeCovered-.08)*8+Math.abs(ratio-1.24)*.08+Math.abs(shift)*.1;if(!best||score<best.score)best={scale,top:y,scalpMiss,eyeCovered,score};}
'''+s[b:]
s=s.replace('y:top-bounds.y*s-', 'y:best!.top-bounds.y*s-')
s=s.replace('eyesCovered:best!.eyeCovered,warnings', "eyesCovered:best!.eyeCovered,eyeProtection:'colored-iris',verticalShift:best!.top-top,warnings")
p.write_text(s,encoding='utf-8')
