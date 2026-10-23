from pathlib import Path
p=Path('src-tauri/src/outfit_prototype.rs');s=p.read_text(encoding='utf-8');s=s.replace('fn write(dir:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{','fn write(dir:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{write_named(dir,bytes,metadata,"prototype")}\nfn write_named(dir:&Path,bytes:&[u8],metadata:&str,prefix:&str)->Result<PathBuf,String>{',1).replace('format!("prototype-{}",','format!("{prefix}-{}",',1)
s+='''
/// Durable user outfits are separate from bundled avatar resources.
pub fn library_root(app:&tauri::AppHandle)->Result<PathBuf,String>{use tauri::Manager;app.path().app_data_dir().map(|p|p.join("wardrobe")).map_err(|e|e.to_string())}
fn install(root:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{
 let value:serde_json::Value=serde_json::from_str(metadata).map_err(|_|"Invalid outfit details")?;
 let label=value["name"].as_str().unwrap_or("outfit");
 let slug:String=label.chars().take(50).map(|c|if c.is_ascii_alphanumeric(){c.to_ascii_lowercase()}else{'_'}).collect();
 let prefix=format!("atelier_{}",if slug.trim_matches('_').is_empty(){"outfit"}else{slug.trim_matches('_')});
 // Validate before creating any library directories.
 png_dimensions(bytes)?;if metadata.len()>200_000{return Err("Outfit selection is too large.".into());}
 fs::create_dir_all(root).map_err(|e|e.to_string())?;let base=root.canonicalize().map_err(|e|e.to_string())?;let outfits=base.join("outfits");fs::create_dir_all(&outfits).map_err(|e|e.to_string())?;
 if !outfits.canonicalize().map_err(|e|e.to_string())?.starts_with(&base){return Err("Wardrobe folder resolves outside its library.".into());}
 write_named(&outfits,bytes,metadata,&prefix)
}
#[tauri::command]pub fn outfit_wardrobe_save(app:tauri::AppHandle,bytes:Vec<u8>,metadata:String)->Result<String,String>{install(&library_root(&app)?,&bytes,&metadata).map(|p|p.to_string_lossy().to_string())}
#[cfg(test)]mod wardrobe_tests{use super::*;#[test]fn saves_new_wearable_item_without_overwriting(){let root=std::env::temp_dir().join(format!("mana-wardrobe-import-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");let metadata=r#"{"width":128,"height":128,"prototype":true,"name":"Blue dress / test"}"#;let a=install(&root,bytes,metadata).unwrap();let b=install(&root,bytes,metadata).unwrap();assert_ne!(a,b);assert!(a.starts_with(root.join("outfits")));assert!(a.file_name().unwrap().to_string_lossy().starts_with("atelier_blue_dress___test-"));let files=crate::avatar_files::scan(&root).unwrap();assert_eq!(files.len(),2);for folder in [a,b]{assert_eq!(fs::read(folder.join("outfit.png")).unwrap(),bytes);fs::remove_file(folder.join("outfit.png")).unwrap();fs::remove_file(folder.join("selection.json")).unwrap();fs::remove_dir(folder).unwrap();}fs::remove_dir(root.join("outfits")).unwrap();fs::remove_dir(root).unwrap();}}
''';p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8').replace('    avatar_files::scan(&avatar_dir(&app, &dir)?)','''    let mut files=avatar_files::scan(&avatar_dir(&app,&dir)?)?;
    let library=outfit_prototype::library_root(&app)?;
    if library.is_dir(){files.extend(avatar_files::scan(&library)?.into_iter().filter(|p|p.starts_with("outfits/atelier_")&&p.ends_with("/outfit.png")));}
    files.sort();files.dedup();Ok(files)''',1)
s=s.replace('    let bytes = avatar_files::read(&avatar_dir(&app, &dir)?, &rel)?;','''    let library=outfit_prototype::library_root(&app)?;
    let bytes=if rel.starts_with("outfits/atelier_")&&library.join(&rel).is_file(){avatar_files::read(&library,&rel)?}else{avatar_files::read(&avatar_dir(&app,&dir)?,&rel)?};''',1)
s=s.replace('            outfit_prototype::outfit_prototype_export,','            outfit_prototype::outfit_prototype_export,\n            outfit_prototype::outfit_wardrobe_save,',1);p.write_text(s,encoding='utf-8')
p=Path('src/core/wardrobe.ts');s=p.read_text(encoding='utf-8').replace('const pretty = (s: string) => s.replace(/_/g, " ");','const pretty = (s: string) => s.replace(/^atelier_(.+)-\\d+$/, "$1").replace(/_/g, " ").replace(/\\s+/g," ").trim();',1);p.write_text(s,encoding='utf-8')
