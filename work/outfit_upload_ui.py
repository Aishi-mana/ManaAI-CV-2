from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8').replace('interface Props{embedded?', 'interface Props{onWardrobeSaved?:()=>void;embedded?',1).replace('embedded=false,stage}:Props','embedded=false,stage,onWardrobeSaved}:Props',1)
s=s.replace('async function save(){','async function save(toWardrobe=false){',1)
s=s.replace('transform),source:source.src});','transform),source:source.src,destination:toWardrobe?"wardrobe":"files"});',1)
s=s.replace("invoke<string>('outfit_prototype_export',", "invoke<string>(toWardrobe?'outfit_wardrobe_save':'outfit_prototype_export',",1)
s=s.replace("setMessage('Exported outfit.png and editable selection details to '+path);", "if(toWardrobe){onWardrobeSaved?.();setMessage('Saved to Wardrobe. Open Wardrobe and select this outfit to wear it. Files: '+path);}else setMessage('Exported outfit.png and editable selection details to '+path);",1)
s=s.replace('Choose outfit picture','Upload your outfit image')
s=s.replace("{saving?'Saving…':embedded?'Save outfit files':'Export transparent outfit PNG'}</button>","{saving?'Saving…':embedded?'Save outfit files':'Export transparent outfit PNG'}</button>{onWardrobeSaved&&<button className=\"btn primary outfit-save-action\" disabled={saving||!hasOutfit||points.length>0||!!stroke} onClick={()=>void save(true)}>Save to Wardrobe</button>}",1)
# Uploaded images are independent artwork, not framed avatar-reference renders.
a=s.index('async function openFile(');b=s.index('async function importSelection(',a);s=s[:a]+s[a:b].replace('frame:.92','frame:1')+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('src/components/Atelier.tsx');s=p.read_text(encoding='utf-8').replace('interface Props{assets:', 'interface Props{onWardrobeSaved?:()=>void;assets:',1).replace('onSaveImage,onClose}:Props','onSaveImage,onClose,onWardrobeSaved}:Props',1)
s=s.replace('<nav className="atelier-stages"', '<div className="atelier-upload-entry"><button className="btn" onClick={()=>setStage(\'make\')}>Upload your own outfit image</button><span className="hint-soft">PNG, JPEG or WebP · up to 10 MB · clean, fit and save it for her to wear</span></div><nav className="atelier-stages"',1)
s=s.replace('Save writes outfit.png and editable selection.json to disk.','Save to Wardrobe to make it wearable, or save outfit.png and selection.json files.',1)
s=s.replace('initial={picture} onClose={onClose}', 'initial={picture} onClose={onClose} onWardrobeSaved={onWardrobeSaved}',1)
p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8').replace('<Atelier assets={avatar.assets}', '<Atelier onWardrobeSaved={()=>avatar.reload()} assets={avatar.assets}',1);p.write_text(s,encoding='utf-8')
