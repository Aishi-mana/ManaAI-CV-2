from pathlib import Path
p=Path('src/components/GeneratedHair.tsx');s=p.read_text(encoding='utf-8').replace('fitHairToLandmarks,HAIR_PROMPT','fitHairToLandmarks,hairLandmarks,HAIR_PROMPT')
a=s.index('  const fw=originalFront.');b=s.index('  const back=canvas',a)
s=s[:a]+'''  const pixelsOf=(image:HTMLImageElement)=>{const c=canvas(bodySize.width,bodySize.height),ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,c.width,c.height);return ctx.getImageData(0,0,c.width,c.height).data;};
  const feature=async(key:string)=>{const url=assets.urls.get(key);return url?pixelsOf(await loadOutfitImage(url)):undefined;};
  const [eyePixels,mouthPixels]=await Promise.all([feature('eyes/eye_neutral.png'),feature('mouth/mouth_neutral.png')]);
  const bodyPixels=pixelsOf(body),guide=hairLandmarks(bodyPixels,bodySize.width,bodySize.height,eyePixels,mouthPixels),front=canvas(originalFront.naturalWidth,originalFront.naturalHeight),fc=front.getContext('2d')!;fc.drawImage(originalFront,0,0);const fb=hairBounds(fc.getImageData(0,0,front.width,front.height).data,front.width,front.height),cropBottom=Math.min(fb.y+fb.height,guide.eyeTop+guide.headWidth*.2),frontScale=Math.min(330/fb.width,240/(cropBottom-fb.y));
  rc.drawImage(originalFront,fb.x,fb.y,fb.width,cropBottom-fb.y,256-fb.width*frontScale/2,40,fb.width*frontScale,(cropBottom-fb.y)*frontScale);
'''+s[b:]
a=s.index('  const pixelsOf=',s.index('  const panels='));b=s.index('  const fitted=',a);s=s[:a]+s[b:];s=s.replace('data:pixelsOf(body)','data:bodyPixels')
s=s.replace("title+' is ready below. Check the fit; each hair layer stays independently editable.'", "title+' is ready below. '+(fitted.report.warnings.length?fitted.report.warnings.join(' '):'Scalp and eye fit checks passed.')+' Each hair layer stays independently editable.'")
p.write_text(s,encoding='utf-8')
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8').replace('thin delicate gray linework and soft gray-lilac shading.', 'thin delicate gray linework and soft gray-lilac shading, smooth antialiased curves, no pixel art or stair-step outlines. Keep the two-panel reference layout and rounded top positions.');p.write_text(s,encoding='utf-8')
