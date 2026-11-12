use std::{fs,path::{Path,PathBuf},sync::Mutex};
use serde::{Serialize,Deserialize};
use tauri::Manager;
use crate::outfit_prototype::{AtelierLayer,png_dimensions,validate_output};
static LOCK:Mutex<()>=Mutex::new(());
#[derive(Clone,Serialize,Deserialize)]
#[serde(rename_all="camelCase")]
pub struct Review{pub id:String,pub name:String,pub category:String,pub depth:String,pub revision:u32,pub status:String,pub item_id:Option<String>,pub width:u32,pub height:u32,#[serde(default)]pub fit_warnings:Vec<String>,#[serde(default)]pub review_notes:String,#[serde(default)]pub needs_edits:bool}
fn valid(id:&str)->bool{id.starts_with("review-")&&id.len()>7&&id.len()<80&&id[7..].bytes().all(|v|v.is_ascii_digit())}
fn root(app:&tauri::AppHandle)->Result<PathBuf,String>{app.path().app_data_dir().map(|p|p.join("wearable-reviews")).map_err(|e|e.to_string())}
fn folder(root:&Path,id:&str)->Result<PathBuf,String>{if !valid(id){return Err("Invalid review ID".into())}let base=root.canonicalize().map_err(|e|e.to_string())?;let p=base.join(id).canonicalize().map_err(|e|e.to_string())?;if !p.starts_with(base){return Err("Review escapes library".into())}Ok(p)}
fn read(root:&Path,id:&str)->Result<Review,String>{
 let r:Review=serde_json::from_slice(&fs::read(folder(root,id)?.join("review.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
 if r.id!=id||!matches!(r.category.as_str(),"hair"|"accessory")||!matches!(r.depth.as_str(),"top"|"back"|"behind-body"|"behind-front-hair"){return Err("Invalid review record".into())}Ok(r)
}
fn write(dir:&Path,r:&Review)->Result<(),String>{let tmp=dir.join("review.tmp");fs::write(&tmp,serde_json::to_vec_pretty(r).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;fs::rename(tmp,dir.join("review.json")).map_err(|e|e.to_string())}
fn version(root:&Path,r:&Review)->Result<PathBuf,String>{let base=folder(root,&r.id)?;let path=base.join(format!("revision-{}",r.revision)).canonicalize().map_err(|e|e.to_string())?;if !path.starts_with(base){return Err("Review revision escapes its folder".into())}Ok(path)}
fn save(root:&Path,id:Option<String>,expected:Option<u32>,category:String,depth:String,name:String,layers:Vec<AtelierLayer>,mut project:serde_json::Value)->Result<Review,String>{
 if !matches!(category.as_str(),"hair"|"accessory")||!matches!(depth.as_str(),"top"|"back"|"behind-body"|"behind-front-hair")||name.trim().is_empty()||name.chars().count()>80{return Err("Invalid wearable category, depth or name".into())}
 if layers.len()!=if category=="hair"{2}else{1}{return Err("Hair needs front and back layers; accessories need one layer".into())}
 let mut slots=std::collections::HashSet::new();let mut size=None;
 for layer in &layers{if !matches!(layer.slot.as_str(),"front"|"back")||!slots.insert(layer.slot.clone()){return Err("Invalid or duplicate wearable layer".into())}let dims=png_dimensions(&layer.bytes)?;if size.is_some()&&size!=Some(dims){return Err("Layer canvases differ".into())}size=Some(dims);}
 if !slots.contains("front")||category=="accessory"&&slots.contains("back"){return Err("Missing front layer".into())}
 if project.get("generation").is_none(){if let Some(id)=id.as_ref(){let previous=read(root,id)?;let old:serde_json::Value=serde_json::from_slice(&fs::read(version(root,&previous)?.join("project.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;if let Some(generation)=old.get("generation"){project["generation"]=generation.clone();}}}
 project["accessoryDepth"]=serde_json::json!(depth);
 let text=serde_json::to_vec(&project).map_err(|e|e.to_string())?;
 if text.len()>48_000_000||!project["sourceDataUrl"].as_str().is_some_and(|v|v.starts_with("data:image/png;base64,")&&v.len()<24_000_000)||!project["parts"].as_array().is_some_and(|v|!v.is_empty()&&v.len()<=12){return Err("Review needs its editable source and 1-12 layers (under 48 MB)".into())}
 fs::create_dir_all(root).map_err(|e|e.to_string())?;
 let (w,h)=size.unwrap();let mut r=if let Some(id)=id{let mut old=read(root,&id)?;if old.status!="pending"||expected!=Some(old.revision)||old.category!=category||old.width!=w||old.height!=h{return Err("Review changed or was already approved. Reopen the latest review.".into())}old.revision=old.revision.checked_add(1).ok_or("Too many revisions")?;old}else{Review{id:format!("review-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()),name:name.clone(),category:category.clone(),depth:depth.clone(),revision:0,status:"pending".into(),item_id:None,width:w,height:h,fit_warnings:vec![],review_notes:String::new(),needs_edits:false}};
 r.name=name.trim().into();r.depth=depth;
 r.fit_warnings=project["generation"]["fitReport"]["warnings"].as_array().map(|a|a.iter().take(8).filter_map(|v|v.as_str()).map(|s|s.chars().take(500).collect()).collect()).unwrap_or_default();
 let dir=root.join(&r.id);fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let dest=dir.join(format!("revision-{}",r.revision));fs::create_dir(&dest).map_err(|e|e.to_string())?;
 let result=(||{for layer in layers{fs::write(dest.join(format!("{}.png",layer.slot)),layer.bytes).map_err(|e|e.to_string())?;}
 fs::write(dest.join("project.json"),text).map_err(|e|e.to_string())?;write(&dir,&r)?;Ok(r)})();
 if result.is_err(){for file in ["front.png","back.png","project.json"]{let _=fs::remove_file(dest.join(file));}let _=fs::remove_dir(&dest);}
 result
}
fn approve(root:&Path,library:&Path,id:&str)->Result<Review,String>{
 let mut r=read(root,id)?;if r.status=="saved"{return Ok(r)}if r.status!="pending"{return Err("This review was dismissed".into())}
 let source=version(root,&r)?;let id=format!("atelier_review_{}",&r.id[7..]);let meta=serde_json::json!({"prototype":true,"name":r.name,"width":r.width,"height":r.height}).to_string();
 fs::create_dir_all(library).map_err(|e|e.to_string())?;let base=library.canonicalize().map_err(|e|e.to_string())?;
 let parent=if r.category=="hair"{base.join("hairstyles")}else{base.join("accessories").join(&r.depth)};fs::create_dir_all(&parent).map_err(|e|e.to_string())?;if !parent.canonicalize().map_err(|e|e.to_string())?.starts_with(&base){return Err("Wardrobe target escapes library".into())}
 let front=fs::read(source.join("front.png")).map_err(|e|e.to_string())?;validate_output(&front,&meta)?;
 if r.category=="hair"{
  let back=fs::read(source.join("back.png")).map_err(|e|e.to_string())?;validate_output(&back,&meta)?;let target=parent.join(&id);
  if target.exists(){if fs::read(target.join("hair_front.png")).map_err(|e|e.to_string())?!=front||fs::read(target.join("hair_back.png")).map_err(|e|e.to_string())?!=back{return Err("Different hair already uses this ID".into())}}
  else{let stage=parent.join(format!(".incoming-{id}"));fs::create_dir(&stage).map_err(|e|e.to_string())?;fs::write(stage.join("hair_front.png"),front).map_err(|e|e.to_string())?;fs::write(stage.join("hair_back.png"),back).map_err(|e|e.to_string())?;fs::write(stage.join("selection.json"),&meta).map_err(|e|e.to_string())?;fs::rename(stage,target).map_err(|e|e.to_string())?;}
 }else{
  let target=parent.join(format!("{id}.png"));if target.exists(){if fs::read(&target).map_err(|e|e.to_string())?!=front{return Err("Different accessory already uses this ID".into())}}
  else{let stage=parent.join(format!(".incoming-{id}"));fs::write(&stage,front).map_err(|e|e.to_string())?;fs::rename(stage,target).map_err(|e|e.to_string())?;fs::write(parent.join(format!("{id}.selection.json")),&meta).map_err(|e|e.to_string())?;}
 }
 r.status="saved".into();r.item_id=Some(id);write(&folder(root,&r.id)?,&r)?;Ok(r)
}
#[tauri::command]pub fn wearable_reviews_list(app:tauri::AppHandle)->Result<Vec<Review>,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut result=vec![];if root.exists(){for e in fs::read_dir(&root).map_err(|e|e.to_string())?{let p=e.map_err(|e|e.to_string())?.path();let id=p.file_name().and_then(|v|v.to_str()).unwrap_or("");if valid(id)&&p.join("review.json").is_file(){let r=read(&root,id)?;if r.status=="pending"{result.push(r)}}}}result.sort_by(|a,b|b.id.cmp(&a.id));Ok(result)}
#[tauri::command]pub fn wearable_reviews_save(app:tauri::AppHandle,id:Option<String>,expected_revision:Option<u32>,category:String,depth:String,name:String,layers:Vec<AtelierLayer>,project:serde_json::Value)->Result<Review,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;save(&root(&app)?,id,expected_revision,category,depth,name,layers,project)}
#[tauri::command]pub fn wearable_reviews_image(app:tauri::AppHandle,id:String,slot:String,revision:Option<u32>)->Result<tauri::ipc::Response,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;if !matches!(slot.as_str(),"front"|"back"){return Err("Invalid layer".into())}let root=root(&app)?;let mut r=read(&root,&id)?;if let Some(revision)=revision{if revision>r.revision{return Err("Unknown review revision".into())}r.revision=revision;}Ok(tauri::ipc::Response::new(fs::read(version(&root,&r)?.join(format!("{slot}.png"))).map_err(|e|e.to_string())?))}
#[tauri::command]pub fn wearable_reviews_open(app:tauri::AppHandle,id:String)->Result<serde_json::Value,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let r=read(&root,&id)?;let mut project:serde_json::Value=serde_json::from_slice(&fs::read(version(&root,&r)?.join("project.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;project["name"]=serde_json::json!(r.name);Ok(serde_json::json!({"review":r,"project":project}))}
#[tauri::command]pub fn wearable_reviews_approve(app:tauri::AppHandle,id:String)->Result<Review,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;approve(&root(&app)?,&crate::outfit_prototype::library_root(&app)?,&id)}
#[tauri::command]pub fn wearable_reviews_dismiss(app:tauri::AppHandle,id:String)->Result<(),String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut r=read(&root,&id)?;if r.status!="pending"{return Err("Only pending reviews can be dismissed".into())}r.status="dismissed".into();write(&folder(&root,&id)?,&r)}

#[cfg(test)]mod tests{
 use super::*;
 fn layers(hair:bool,edited:bool)->Vec<AtelierLayer>{let front=if edited{include_bytes!("../../tests/fixtures/outfit-edited-alpha.png").to_vec()}else{include_bytes!("../../tests/fixtures/outfit-alpha.png").to_vec()};let mut result=vec![AtelierLayer{slot:"front".into(),bytes:front}];if hair{result.push(AtelierLayer{slot:"back".into(),bytes:include_bytes!("../../tests/fixtures/outfit-alpha.png").to_vec()})}result}
 fn project()->serde_json::Value{serde_json::json!({"name":"Editable hair","accessoryDepth":"top","sourceDataUrl":"data:image/png;base64,iVBORw0KGgo=","parts":[{"id":"piece-1","depth":"front"},{"id":"piece-2","depth":"back"}]})}
 #[test]fn hair_preserves_both_layers_project_and_approval_is_idempotent(){
  let base=std::env::temp_dir().join(format!("mana-wearable-review-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let root=base.join("review");let library=base.join("wardrobe");
  let r=save(&root,None,None,"hair".into(),"top".into(),"Silver waves".into(),layers(true,false),project()).unwrap();assert!(!library.exists());
  let r=save(&root,Some(r.id.clone()),Some(0),"hair".into(),"top".into(),"Edited waves".into(),layers(true,true),project()).unwrap();assert_eq!(r.revision,1);
  assert!(save(&root,Some(r.id.clone()),Some(0),"hair".into(),"top".into(),"Stale".into(),layers(true,false),project()).is_err());
  assert_eq!(serde_json::from_slice::<serde_json::Value>(&fs::read(version(&root,&r).unwrap().join("project.json")).unwrap()).unwrap(),project());
  let approved=approve(&root,&library,&r.id).unwrap();assert_eq!(approve(&root,&library,&r.id).unwrap().item_id,approved.item_id);
  let dest=library.join("hairstyles").join(approved.item_id.unwrap());assert_eq!(fs::read(dest.join("hair_front.png")).unwrap(),include_bytes!("../../tests/fixtures/outfit-edited-alpha.png"));assert_eq!(fs::read(dest.join("hair_back.png")).unwrap(),include_bytes!("../../tests/fixtures/outfit-alpha.png"));assert_eq!(fs::read_dir(library.join("hairstyles")).unwrap().count(),1);
  assert!(save(&root,Some(r.id),Some(1),"hair".into(),"top".into(),"Saved edit".into(),layers(true,false),project()).is_err());
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
 #[test]fn generated_fit_warnings_survive_reopening(){
  let base=std::env::temp_dir().join(format!("mana-hair-warning-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let mut p=project();p["generation"]=serde_json::json!({"fitReport":{"warnings":["Fringe depth needs review."]}});let r=save(&base,None,None,"hair".into(),"top".into(),"Hair".into(),layers(true,false),p).unwrap();assert_eq!(read(&base,&r.id).unwrap().fit_warnings,vec!["Fringe depth needs review."]);assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
 #[test]fn accessories_keep_selected_depth_and_invalid_inputs_never_install(){
  let base=std::env::temp_dir().join(format!("mana-accessory-review-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let root=base.join("review");let library=base.join("wardrobe");
  assert!(save(&root,None,None,"accessory".into(),"../bad".into(),"Bow".into(),layers(false,false),project()).is_err());assert!(!root.exists());
  assert!(save(&root,None,None,"hair".into(),"top".into(),"Hair".into(),layers(false,false),project()).is_err());
  for depth in ["back","behind-body","behind-front-hair","top"]{let r=save(&root,None,None,"accessory".into(),depth.into(),"Ribbon".into(),layers(false,false),project()).unwrap();let r=approve(&root,&library,&r.id).unwrap();assert!(library.join("accessories").join(depth).join(format!("{}.png",r.item_id.unwrap())).is_file());}
  let r=save(&root,None,None,"accessory".into(),"top".into(),"Pending bow".into(),layers(false,false),project()).unwrap();assert!(read(&root,"../escape").is_err());let mut dismissed=r.clone();dismissed.status="dismissed".into();write(&folder(&root,&r.id).unwrap(),&dismissed).unwrap();assert!(approve(&root,&library,&r.id).is_err());
  assert_eq!(crate::avatar_files::scan(&library).unwrap().len(),4);
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

fn manage(root:&Path,id:&str,expected:u32,action:&str,name:&str,notes:&str,needs_edits:bool)->Result<Review,String>{
 let mut r=read(root,id)?;if r.status!="pending"||r.revision!=expected{return Err("Review changed; reopen it first".into())}
 match action{
 "rename"=>{if name.trim().is_empty()||name.chars().count()>80{return Err("Name must contain 1-80 characters".into())}r.name=name.trim().into();},
 "notes"=>{if notes.chars().count()>2000{return Err("Notes exceed 2000 characters".into())}r.review_notes=notes.into();r.needs_edits=needs_edits;},
 "restore-initial"=>{let mut first=r.clone();first.revision=0;let dir=version(root,&first)?;let project:serde_json::Value=serde_json::from_slice(&fs::read(dir.join("project.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;let mut layers=vec![AtelierLayer{slot:"front".into(),bytes:fs::read(dir.join("front.png")).map_err(|e|e.to_string())?}];if r.category=="hair"{layers.push(AtelierLayer{slot:"back".into(),bytes:fs::read(dir.join("back.png")).map_err(|e|e.to_string())?});}return save(root,Some(r.id.clone()),Some(r.revision),r.category.clone(),project["accessoryDepth"].as_str().unwrap_or(&first.depth).to_string(),r.name.clone(),layers,project);},
 "duplicate"=>{let dir=version(root,&r)?;let mut project:serde_json::Value=serde_json::from_slice(&fs::read(dir.join("project.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;let title=format!("{} copy",r.name.chars().take(74).collect::<String>());project["name"]=serde_json::json!(title);let mut layers=vec![AtelierLayer{slot:"front".into(),bytes:fs::read(dir.join("front.png")).map_err(|e|e.to_string())?}];if r.category=="hair"{layers.push(AtelierLayer{slot:"back".into(),bytes:fs::read(dir.join("back.png")).map_err(|e|e.to_string())?});}let mut copy=save(root,None,None,r.category.clone(),r.depth.clone(),title,layers,project)?;copy.review_notes=r.review_notes;copy.needs_edits=r.needs_edits;write(&folder(root,&copy.id)?,&copy)?;return Ok(copy);},
 _=>return Err("Unknown review action".into())
 }write(&folder(root,id)?,&r)?;Ok(r)
}
#[tauri::command]pub fn wearable_reviews_manage(app:tauri::AppHandle,id:String,expected_revision:u32,action:String,name:String,notes:String,needs_edits:bool)->Result<Review,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;manage(&root(&app)?,&id,expected_revision,&action,&name,&notes,needs_edits)}

#[cfg(test)]mod management_tests{
 use super::*;
 #[test]fn notes_rename_and_duplicate_preserve_revision_art_and_original(){let root=std::env::temp_dir().join(format!("mana-wearable-manage-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let png=include_bytes!("../../tests/fixtures/outfit-alpha.png").to_vec();let project=serde_json::json!({"sourceDataUrl":"data:image/png;base64,AA==","parts":[{"id":"clip"}],"generation":{"rawSourceDataUrl":"data:image/png;base64,AA==","fitReport":{"warnings":["Check fit"]}}});let r=save(&root,None,None,"accessory".into(),"top".into(),"Clip".into(),vec![AtelierLayer{slot:"front".into(),bytes:png.clone()}],project).unwrap();let r=manage(&root,&r.id,0,"notes","","Move left",true).unwrap();assert_eq!(read(&root,&r.id).unwrap().review_notes,"Move left");assert!(r.needs_edits);let copy=manage(&root,&r.id,0,"duplicate","","",false).unwrap();assert_ne!(copy.id,r.id);assert_eq!(copy.review_notes,"Move left");assert_eq!(fs::read(version(&root,&copy).unwrap().join("front.png")).unwrap(),png);let renamed=manage(&root,&r.id,0,"rename","Blue clip","",false).unwrap();assert_eq!(renamed.name,"Blue clip");assert_eq!(read(&root,&copy.id).unwrap().name,"Clip copy");assert!(manage(&root,&r.id,9,"rename","stale","",false).is_err());let edited=save(&root,Some(r.id.clone()),Some(0),"accessory".into(),"top".into(),"Blue clip".into(),vec![AtelierLayer{slot:"front".into(),bytes:png.clone()}],serde_json::json!({"sourceDataUrl":"data:image/png;base64,AA==","parts":[{"id":"clip"}]})).unwrap();let saved:serde_json::Value=serde_json::from_slice(&fs::read(version(&root,&edited).unwrap().join("project.json")).unwrap()).unwrap();assert!(saved["generation"]["rawSourceDataUrl"].is_string());assert_eq!(edited.revision,1);assert_eq!(edited.fit_warnings,vec!["Check fit"]);assert!(root.join(&r.id).join("revision-0/front.png").is_file());let restored=manage(&root,&r.id,1,"restore-initial","","",false).unwrap();assert_eq!(restored.revision,2);assert!(root.join(&r.id).join("revision-1/front.png").is_file());assert_eq!(fs::read(version(&root,&restored).unwrap().join("front.png")).unwrap(),png);fs::remove_dir_all(root).unwrap();}
}
