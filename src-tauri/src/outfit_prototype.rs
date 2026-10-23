use std::{fs,io::Write,path::{Path,PathBuf}};
fn png_dimensions(bytes:&[u8])->Result<(u32,u32),String>{
 if bytes.len()<33||bytes.len()>16_000_000||!bytes.starts_with(b"\x89PNG\r\n\x1a\n")||&bytes[12..16]!=b"IHDR"||bytes[24]!=8||bytes[25]!=6{return Err("Use an RGBA PNG under 16 MB.".into());}
 let w=u32::from_be_bytes(bytes[16..20].try_into().unwrap());let h=u32::from_be_bytes(bytes[20..24].try_into().unwrap());if w<128||h<128||w>2048||h>2048{return Err("Outfit canvas must be 128–2048 pixels per side.".into());}Ok((w,h))
}
fn validate_output(bytes:&[u8],metadata:&str)->Result<(),String>{
 let (w,h)=png_dimensions(bytes)?;if metadata.len()>16_000_000{return Err("Outfit selection is too large.".into());}let data:serde_json::Value=serde_json::from_str(metadata).map_err(|_|"Invalid outfit selection")?;if data["width"].as_u64()!=Some(w as u64)||data["height"].as_u64()!=Some(h as u64)||data["prototype"]!=true{return Err("Outfit dimensions do not match selection details.".into());}
 Ok(())
}
fn write(dir:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{write_named(dir,bytes,metadata,"prototype")}
fn write_named(dir:&Path,bytes:&[u8],metadata:&str,prefix:&str)->Result<PathBuf,String>{
 validate_output(bytes,metadata)?;
 fs::create_dir_all(dir).map_err(|e|e.to_string())?;let target=dir.join(format!("{prefix}-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()));fs::create_dir(&target).map_err(|e|e.to_string())?;
 let result=(||{let mut file=fs::OpenOptions::new().write(true).create_new(true).open(target.join("outfit.png")).map_err(|e|e.to_string())?;file.write_all(bytes).map_err(|e|e.to_string())?;file.sync_all().map_err(|e|e.to_string())?;fs::write(target.join("selection.json"),metadata).map_err(|e|e.to_string())?;Ok(target.clone())})();
 if result.is_err(){let _=fs::remove_file(target.join("outfit.png"));let _=fs::remove_file(target.join("selection.json"));let _=fs::remove_dir(&target);}result
}
#[tauri::command]pub fn outfit_prototype_export(bytes:Vec<u8>,metadata:String)->Result<String,String>{write(Path::new(r"C:\AI\ManaAI-CV-2\exports\outfits"),&bytes,&metadata).map(|p|p.to_string_lossy().to_string())}
#[cfg(test)]mod tests{use super::*;#[test]fn validates_rgba_dimensions_and_metadata_before_writes(){assert!(png_dimensions(b"not png").is_err());let mut png=vec![0;33];png[..8].copy_from_slice(b"\x89PNG\r\n\x1a\n");png[12..16].copy_from_slice(b"IHDR");png[16..20].copy_from_slice(&843u32.to_be_bytes());png[20..24].copy_from_slice(&1264u32.to_be_bytes());png[24]=8;png[25]=6;assert_eq!(png_dimensions(&png).unwrap(),(843,1264));assert!(write(Path::new("must-not-create-outfit-test"),&png,r#"{"width":1,"height":1264,"prototype":true}"#).is_err());png[25]=2;assert!(png_dimensions(&png).is_err());}}

#[cfg(test)]mod export_tests{
 use super::*;
 #[test]fn exports_real_png_and_selection_to_new_folders(){
  let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");
  let root=std::env::temp_dir().join(format!("mana-outfit-test-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
  let metadata=r#"{"width":128,"height":128,"prototype":true,"name":"Test"}"#;
  let first=write(&root,bytes,metadata).unwrap();let second=write(&root,bytes,metadata).unwrap();assert_ne!(first,second);
  for folder in [first,second]{assert_eq!(fs::read(folder.join("outfit.png")).unwrap(),bytes);assert_eq!(fs::read_to_string(folder.join("selection.json")).unwrap(),metadata);fs::remove_file(folder.join("outfit.png")).unwrap();fs::remove_file(folder.join("selection.json")).unwrap();fs::remove_dir(folder).unwrap();}fs::remove_dir(root).unwrap();
 }
}

/// Durable user outfits are separate from bundled avatar resources.
pub fn library_root(app:&tauri::AppHandle)->Result<PathBuf,String>{use tauri::Manager;app.path().app_data_dir().map(|p|p.join("wardrobe")).map_err(|e|e.to_string())}
fn install(root:&Path,bytes:&[u8],metadata:&str)->Result<PathBuf,String>{
 validate_output(bytes,metadata)?;
 let value:serde_json::Value=serde_json::from_str(metadata).map_err(|_|"Invalid outfit details")?;
 let label=value["name"].as_str().unwrap_or("outfit");
 let slug:String=label.chars().take(50).map(|c|if c.is_ascii_alphanumeric(){c.to_ascii_lowercase()}else{'_'}).collect();
 let prefix=format!("atelier_{}",if slug.trim_matches('_').is_empty(){"outfit"}else{slug.trim_matches('_')});
 fs::create_dir_all(root).map_err(|e|e.to_string())?;let base=root.canonicalize().map_err(|e|e.to_string())?;let outfits=base.join("outfits");fs::create_dir_all(&outfits).map_err(|e|e.to_string())?;
 if !outfits.canonicalize().map_err(|e|e.to_string())?.starts_with(&base){return Err("Wardrobe folder resolves outside its library.".into());}
 write_named(&outfits,bytes,metadata,&prefix)
}
#[tauri::command]pub fn outfit_wardrobe_save(app:tauri::AppHandle,bytes:Vec<u8>,metadata:String)->Result<String,String>{install(&library_root(&app)?,&bytes,&metadata).map(|p|p.to_string_lossy().to_string())}
#[cfg(test)]mod wardrobe_tests{use super::*;#[test]fn saves_new_wearable_item_without_overwriting(){let root=std::env::temp_dir().join(format!("mana-wardrobe-import-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");let metadata=r#"{"width":128,"height":128,"prototype":true,"name":"Blue dress / test"}"#;let a=install(&root,bytes,metadata).unwrap();let b=install(&root,bytes,metadata).unwrap();assert_ne!(a,b);assert!(a.starts_with(root.canonicalize().unwrap().join("outfits")));assert!(a.file_name().unwrap().to_string_lossy().starts_with("atelier_blue_dress___test-"));let files=crate::avatar_files::scan(&root).unwrap();assert_eq!(files.len(),2);assert_eq!(crate::avatar_files::read(&root,&files[0]).unwrap(),bytes);for folder in [a,b]{assert_eq!(fs::read(folder.join("outfit.png")).unwrap(),bytes);fs::remove_file(folder.join("outfit.png")).unwrap();fs::remove_file(folder.join("selection.json")).unwrap();fs::remove_dir(folder).unwrap();}fs::remove_dir(root.join("outfits")).unwrap();fs::remove_dir(root).unwrap();}}

#[cfg(test)]mod wardrobe_rejection_tests{use super::*;#[test]fn invalid_install_does_not_create_library(){let root=std::env::temp_dir().join(format!("mana-wardrobe-reject-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");assert!(install(&root,bytes,r#"{"width":1,"height":128,"prototype":true}"#).is_err());assert!(!root.exists());assert!(install(&root,b"invalid",r#"{}"#).is_err());assert!(!root.exists());}}

#[cfg(test)]mod large_history_tests{use super::*;#[test]fn exports_history_larger_than_old_cap(){let root=std::env::temp_dir().join(format!("mana-outfit-large-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");let metadata=serde_json::json!({"width":128,"height":128,"prototype":true,"history": "x".repeat(250_000)}).to_string();let folder=write(&root,bytes,&metadata).unwrap();assert_eq!(fs::read_to_string(folder.join("selection.json")).unwrap(),metadata);fs::remove_file(folder.join("outfit.png")).unwrap();fs::remove_file(folder.join("selection.json")).unwrap();fs::remove_dir(folder).unwrap();fs::remove_dir(root).unwrap();}#[test]fn rejects_oversized_metadata(){let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");assert!(validate_output(bytes,&"x".repeat(16_000_001)).is_err());}}
