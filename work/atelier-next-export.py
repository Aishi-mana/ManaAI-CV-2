from pathlib import Path
p=Path('src-tauri/src/generated_outfits.rs');s=p.read_text(encoding='utf-8').replace('fn validate_project(', 'pub(crate) fn validate_project(',1);p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/outfit_prototype.rs');s=p.read_text(encoding='utf-8');s+='''
fn write_project_backup(dir:&Path,data:&str)->Result<PathBuf,String>{
 if data.len()>48_000_000{return Err("Editable project exceeds 48 MB".into())}let v:serde_json::Value=serde_json::from_str(data).map_err(|e|e.to_string())?;
 if v["format"]!="mana-atelier-project"||v["version"]!=1||!matches!(v["category"].as_str(),Some("outfit"|"hair"|"accessory")){return Err("Invalid editable project backup".into())}crate::generated_outfits::validate_project(&v["project"])?;
 fs::create_dir_all(dir).map_err(|e|e.to_string())?;let path=dir.join(format!("project-{}.mana-project.json",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()));let mut file=fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e|e.to_string())?;file.write_all(data.as_bytes()).map_err(|e|e.to_string())?;file.sync_all().map_err(|e|e.to_string())?;Ok(path)
}
#[tauri::command]pub fn atelier_project_export(data:String)->Result<String,String>{write_project_backup(Path::new(r"C:\\AI\\ManaAI-CV-2\\exports\\atelier-projects"),&data).map(|p|p.to_string_lossy().to_string())}
''';p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8').replace('outfit_prototype::atelier_item_export,','outfit_prototype::atelier_item_export,\n            outfit_prototype::atelier_project_export,');p.write_text(s,encoding='utf-8')
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8');a=s.index("const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));");b=s.index("}catch(e){setError(String(e));}}",a);s=s[:a]+"const path=await invoke<string>('atelier_project_export',{data});setMessage('Editable project backup exported to '+path);"+s[b:]
# Lock deletes/regions/transforms; guard rotation and core split/reorder separately
s=s.replace('if(box&&(rotateOnly||e.altKey||rotationHandle', 'if(editableLayer(pieces,activeId)&&box&&(rotateOnly||e.altKey||rotationHandle',1)
# test mocks need actual new core module rather than IPC-only fallback
p.write_text(s,encoding='utf-8')
p=Path('src/core/outfitPrototype.ts');s=p.read_text(encoding='utf-8').replace("if(pieces.length>=12||pieces.some(p=>p.id===id)||!validRegion", "if(pieces.find(p=>p.id===activeId)?.locked||pieces.length>=12||pieces.some(p=>p.id===id)||!validRegion",1).replace('if(a<0||b<0||a===b)return pieces;', 'if(a<0||b<0||a===b||pieces[a].locked)return pieces;',1);p.write_text(s,encoding='utf-8')
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');lines=s.splitlines();lines=[line.replace(":id.includes('outfitPrototype')?",":id.includes('atelierTools')?loader()('src/core/atelierTools.ts'):id.includes('outfitPrototype')?") if "fs.readFileSync('src/components/OutfitPrototype.tsx'" in line else line for line in lines];p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
