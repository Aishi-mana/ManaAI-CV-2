from pathlib import Path
p=Path('src/core/wardrobe.ts');s=p.read_text(encoding='utf-8').replace('import { VIEWS, listAccessories, listOptions }','import { VIEWS, EMOTION_MAP, buildLayers, listAccessories, listOptions }',1)
s+='''
/** Inventory thumbnails use actual selected item layers; skin previews stay dressed. */
export function wardrobePreviewLayers(a:AvatarAssets,cfg:AvatarConfig,category:'outfit'|'hair'|'skin'|'accessories',name:string){
 const next={...cfg,accessories:[...cfg.accessories]};
 if(category==='outfit')next.outfit=name;else if(category==='hair')next.hairstyle=name;else if(category==='skin')next.skin=name;else next.accessories=[name];
 const neutral=EMOTION_MAP.neutral;
 return buildLayers(a,next).filter(layer=>category==='skin'?(layer.slot==='static'||layer.variant===(layer.slot==='eyes'?neutral.eyes:neutral.mouth)):layer.key.toLowerCase().startsWith(category==='outfit'?'outfits/':category==='hair'?'hairstyles/':'accessories/'));
}
''';p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8').replace('<Wardrobe\n','<Wardrobe assets={avatar.assets??undefined}\n',1);p.write_text(s,encoding='utf-8')
