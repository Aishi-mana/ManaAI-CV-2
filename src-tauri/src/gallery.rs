use std::{fs,io::Write,path::{Path,PathBuf}};
use tauri::Manager;
static WRITE_LOCK:std::sync::Mutex<()>=std::sync::Mutex::new(());

fn root(app:&tauri::AppHandle)->Result<PathBuf,String>{
 let dir=app.path().app_data_dir().map_err(|e|e.to_string())?.join("gallery");
 fs::create_dir_all(&dir).map_err(|e|e.to_string())?;
 if fs::symlink_metadata(&dir).map_err(|e|e.to_string())?.file_type().is_symlink(){return Err("Gallery folder cannot be a symbolic link.".into());}Ok(dir)
}
fn image_path(dir:&Path,id:&str)->Result<PathBuf,String>{
 if id.is_empty()||id.len()>64||!id.bytes().all(|b|b.is_ascii_alphanumeric()||b"-_".contains(&b)){return Err("Invalid gallery image ID.".into());}
 let path=dir.join(format!("{id}.jpg"));
 if fs::symlink_metadata(&path).is_ok_and(|m|m.file_type().is_symlink()){return Err("Gallery image cannot be a symbolic link.".into());}Ok(path)
}
fn write_image(dir:&Path,id:&str,bytes:&[u8])->Result<(),String>{
 let _guard=WRITE_LOCK.lock().map_err(|e|e.to_string())?;
 if bytes.len()<5||bytes.len()>2_250_000||!bytes.starts_with(&[255,216,255]){return Err("Use a prepared JPEG under 2.25 MB.".into());}
 let path=image_path(dir,id)?;
 if path.exists(){if fs::read(&path).map_err(|e|e.to_string())?==bytes{return Ok(());}return Err("Gallery ID already contains a different picture.".into());}
 let temp=dir.join(format!("pending-{id}-{}.part",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()));
 let result=(||{let mut file=fs::OpenOptions::new().write(true).create_new(true).open(&temp).map_err(|e|e.to_string())?;file.write_all(bytes).map_err(|e|e.to_string())?;file.sync_all().map_err(|e|e.to_string())?;drop(file);if fs::read(&temp).map_err(|e|e.to_string())?!=bytes{return Err("Gallery image verification failed.".into());}fs::rename(&temp,&path).map_err(|e|e.to_string())?;Ok(())})();
 if result.is_err(){let _=fs::remove_file(temp);}result
}
#[tauri::command]pub fn gallery_write(app:tauri::AppHandle,id:String,bytes:Vec<u8>)->Result<(),String>{write_image(&root(&app)?,&id,&bytes)}
#[tauri::command]pub fn gallery_read(app:tauri::AppHandle,id:String)->Result<tauri::ipc::Response,String>{let path=image_path(&root(&app)?,&id)?;if fs::metadata(&path).map_err(|_|"The gallery file is missing. Restore the gallery folder from your disk backup.".to_string())?.len()>2_250_000{return Err("Gallery image is too large.".into());}Ok(tauri::ipc::Response::new(fs::read(path).map_err(|e|e.to_string())?))}
#[tauri::command]pub fn gallery_remove(app:tauri::AppHandle,id:String)->Result<(),String>{let path=image_path(&root(&app)?,&id)?;if path.exists(){fs::remove_file(path).map_err(|e|e.to_string())?;}Ok(())}
#[tauri::command]pub fn gallery_folder(app:tauri::AppHandle)->Result<String,String>{Ok(root(&app)?.to_string_lossy().to_string())}
#[tauri::command]pub fn gallery_preserve_legacy(app:tauri::AppHandle,content:String)->Result<(),String>{
 if content.len()>8_200_000||!serde_json::from_str::<serde_json::Value>(&content).map_err(|e|e.to_string())?.is_array(){return Err("Invalid legacy gallery backup.".into());}
 let dir=root(&app)?;let first=dir.join("legacy-images-v1.json");if fs::read_to_string(&first).ok().as_deref()==Some(&content){return Ok(());}
 let path=if first.exists(){dir.join(format!("legacy-images-{}.json",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()))}else{first};
 let mut file=fs::OpenOptions::new().write(true).create_new(true).open(path).map_err(|e|e.to_string())?;file.write_all(content.as_bytes()).map_err(|e|e.to_string())?;file.sync_all().map_err(|e|e.to_string())
}
#[cfg(test)]mod tests{use super::*;#[test]fn scoped_immutable_verified_files(){
 let dir=std::env::temp_dir().join(format!("mana-gallery-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));fs::create_dir_all(&dir).unwrap();
 for id in ["../secret","x/y","x\\y",".",""]{assert!(image_path(&dir,id).is_err());}
 let jpeg=[255,216,255,0,255,217];write_image(&dir,"old-id",&jpeg).unwrap();write_image(&dir,"old-id",&jpeg).unwrap();assert!(write_image(&dir,"old-id",&[255,216,255,1,255,217]).is_err());assert_eq!(fs::read(image_path(&dir,"old-id").unwrap()).unwrap(),jpeg);assert!(write_image(&dir,"bad",b"not jpeg").is_err());fs::remove_file(dir.join("old-id.jpg")).unwrap();fs::remove_dir(dir).unwrap();
}}
