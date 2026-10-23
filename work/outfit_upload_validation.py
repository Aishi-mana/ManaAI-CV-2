from pathlib import Path
p=Path('src-tauri/src/outfit_prototype.rs');s=p.read_text(encoding='utf-8').replace('fn install(root:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{\n let value:', 'fn install(root:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{\n validate_output(bytes,metadata)?;\n let value:',1).replace(' // Validate before creating any library directories.\n validate_output(bytes,metadata)?;\n','',1)
s=s.replace('assert_eq!(files.len(),2);for folder', 'assert_eq!(files.len(),2);assert_eq!(crate::avatar_files::read(&root,&files[0]).unwrap(),bytes);for folder',1)
s+='''
#[cfg(test)]mod wardrobe_rejection_tests{use super::*;#[test]fn invalid_install_does_not_create_library(){let root=std::env::temp_dir().join(format!("mana-wardrobe-reject-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");assert!(install(&root,bytes,r#"{"width":1,"height":128,"prototype":true}"#).is_err());assert!(!root.exists());assert!(install(&root,b"invalid",r#"{}"#).is_err());assert!(!root.exists());}}
''';p.write_text(s,encoding='utf-8')
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');needle="const key=editor.key;\n for(const step";assert needle in s;s=s.replace(needle,"const key=editor.key;let picked=0;editor.props.uploadInputRef.current={click(){picked++;}};all.find(n=>n.type==='button'&&n.props.children==='Upload your own outfit image').props.onClick();assert.equal(picked,1);\n for(const step",1)
s+='''

test('saved Atelier outfits are wearable inventory entries with friendly names',()=>{
 const load=loader(),avatar=load('src/core/avatar.ts'),w=load('src/core/wardrobe.ts'),name='atelier_blue_summer_dress-1792634559305369900',a=assets(['base/body.png','outfits/default/outfit.png','hairstyles/default/hair_front.png','outfits/'+name+'/outfit.png']);
 const items=w.buildWardrobe(a,{days:[],messages:0,skill:0,milestones:{}},new Date(),'Mana'),saved=items.outfits.find(e=>e.name===name);assert.ok(saved);assert.equal(saved.label,'blue summer dress');assert.equal(saved.unlocked,true);const cfg=w.resolveLoadout({...avatar.DEFAULT_AVATAR,outfit:name},items);assert.equal(cfg.outfit,name);assert.ok(avatar.buildLayers(a,cfg).some(l=>l.key==='outfits/'+name+'/outfit.png'));assert.ok(!avatar.buildLayers(a,cfg).some(l=>l.key==='outfits/default/outfit.png'));
});
''';p.write_text(s,encoding='utf-8')
