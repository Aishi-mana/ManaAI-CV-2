from pathlib import Path
p=Path('src/components/GeneratedHair.tsx');s=p.read_text(encoding='utf-8').replace('hairPiece,HAIR_PROMPT','fitHairToLandmarks,HAIR_PROMPT')
a=s.index("  const parts=(['front','back']");b=s.index('  const sourceDataUrl=',a)
s=s[:a]+'''  const panels=(['front','back'] as const).map((slot,i)=>{const x=i*half,clean=cleanHairPanel(sc.getImageData(x,0,half,source.height).data,half,source.height,slot),pixels=sc.createImageData(half,source.height);pixels.data.set(clean.data);sc.putImageData(pixels,x,0);return {...clean,width:half,height:source.height,bounds:{...clean.bounds,x:clean.bounds.x+x}};});
  const pixelsOf=(image:HTMLImageElement)=>{const c=canvas(bodySize.width,bodySize.height),ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,c.width,c.height);return ctx.getImageData(0,0,c.width,c.height).data;};
  const feature=async(key:string)=>{const url=assets.urls.get(key);return url?pixelsOf(await loadOutfitImage(url)):undefined;};
  const [eyePixels,mouthPixels]=await Promise.all([feature('eyes/eye_neutral.png'),feature('mouth/mouth_neutral.png')]);
  const fitted=fitHairToLandmarks(panels[0],panels[1],{width:source.width,height:source.height},{...bodySize,data:pixelsOf(body)},eyePixels,mouthPixels),parts=fitted.parts;
'''+s[b:]
s=s.replace("fit:'uniform-size-height-bounded-v2'","fit:fitted.report.fitVersion,fitReport:fitted.report")
s=s.replace("Check the fit; each hair layer can be moved or uniformly resized in Atelier.","Check the fit; each hair layer stays independently editable.")
s=s.replace("aligns the crowns. Always", "fits the scalp and eye landmarks. Always")
p.write_text(s,encoding='utf-8')
