from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8');old='if(previewLayers.length){for(const layer of previewLayers){p.drawImage(layer.image,0,0,out.width,out.height);if(/^base\\//i.test(layer.key)){p.globalAlpha=previewOpacity;p.drawImage(out,0,0);p.globalAlpha=1;}}}'
new='if(previewLayers.length){const lastBody=previewLayers.reduce((last,layer,index)=>/^base\\//i.test(layer.key)?index:last,-1);previewLayers.forEach((layer,index)=>{p.drawImage(layer.image,0,0,out.width,out.height);if(index===lastBody){p.globalAlpha=previewOpacity;p.drawImage(out,0,0);p.globalAlpha=1;}});}'
assert old in s;s=s.replace(old,new,1);p.write_text(s,encoding='utf-8')
