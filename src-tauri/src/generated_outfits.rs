use std::{fs,path::{Path,PathBuf},sync::Mutex};
use serde::{Serialize,Deserialize};
static QUEUE:Mutex<()>=Mutex::new(());
#[derive(Clone,Serialize,Deserialize,Debug)]
#[serde(rename_all="camelCase")]
pub struct Design{pub id:String,pub name:String,pub created_at:u64,pub status:String,pub prompt:String,pub width:u32,pub height:u32,pub outfit_id:Option<String>,#[serde(default="legacy_fit_version")]pub fit_version:u32,#[serde(default)]pub revision:u32,#[serde(default)]pub fit_warnings:Vec<String>,#[serde(default)]pub review_notes:String,#[serde(default)]pub needs_edits:bool,#[serde(default)]pub source_job_id:Option<String>}
fn legacy_fit_version()->u32{1}
fn valid_id(id:&str)->bool{id.starts_with("image-")&&id.len()<100&&id[6..].bytes().all(|b|b.is_ascii_digit())&&id.len()>6}
fn root(app:&tauri::AppHandle)->Result<PathBuf,String>{use tauri::Manager;app.path().app_data_dir().map(|p|p.join("generated-outfits")).map_err(|e|e.to_string())}
fn checked_folder(root:&Path,id:&str)->Result<PathBuf,String>{
 if !valid_id(id){return Err("Invalid outfit design ID.".into());}
 let base=root.canonicalize().map_err(|e|e.to_string())?;let p=base.join(id).canonicalize().map_err(|e|e.to_string())?;
 if !p.starts_with(&base){return Err("Design resolves outside its library.".into());}Ok(p)
}
fn record(root:&Path,id:&str)->Result<Design,String>{let folder=checked_folder(root,id)?;let bytes=fs::read(folder.join("design.json")).map_err(|e|e.to_string())?;if bytes.len()>20_000{return Err("Design details are too large.".into());}let d:Design=serde_json::from_slice(&bytes).map_err(|e|e.to_string())?;if d.id!=id{return Err("Design ID mismatch.".into());}Ok(d)}
fn write_record(folder:&Path,d:&Design)->Result<(),String>{let temp=folder.join("design.tmp");fs::write(&temp,serde_json::to_vec_pretty(d).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;fs::rename(temp,folder.join("design.json")).map_err(|e|e.to_string())}
fn metadata(d:&Design)->String{serde_json::json!({"prototype":true,"width":d.width,"height":d.height,"name":d.name,"generatedDesign":d.id,"prompt":d.prompt,"category":"outfit"}).to_string()}
fn enqueue(root:&Path,id:&str,name:&str,prompt:&str,bytes:&[u8])->Result<Design,String>{
 if !valid_id(id)||name.trim().is_empty()||name.chars().count()>80||prompt.len()>6000{return Err("Invalid outfit design details.".into());}
 let (width,height)=crate::outfit_prototype::png_dimensions(bytes)?;
 fs::create_dir_all(root).map_err(|e|e.to_string())?;
 if root.join(id).exists(){return record(root,id);}
 let d=Design{id:id.into(),name:name.trim().into(),created_at:std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_secs(),status:"pending".into(),prompt:prompt.into(),width,height,outfit_id:None,fit_version:7,revision:0,fit_warnings:vec![],review_notes:String::new(),needs_edits:false,source_job_id:None};
 let folder=root.join(id);fs::create_dir(&folder).map_err(|e|e.to_string())?;
 fs::write(folder.join("outfit.png"),bytes).map_err(|e|e.to_string())?;fs::write(folder.join("initial-fit.png"),bytes).map_err(|e|e.to_string())?;write_record(&folder,&d)?;Ok(d)
}
fn approve(root:&Path,library:&Path,id:&str)->Result<Design,String>{
 let mut d=record(root,id)?;if d.status=="saved"{return Ok(d);}if d.status!="pending"{return Err("This design is no longer awaiting review.".into());}
 if d.fit_version<2{return Err("Update this design’s fit before saving it to Wardrobe.".into());}
 let source=checked_folder(root,id)?;let bytes=fs::read(source.join("outfit.png")).map_err(|e|e.to_string())?;let project=load_project(root,id)?;let layers=project.as_ref().cloned().unwrap_or_default();let bytes=crate::outfit_prototype::embedded_outfit_layer(&layers,"outfitFrontBytes",(d.width,d.height))?.unwrap_or(bytes);let back=crate::outfit_prototype::embedded_outfit_layer(&layers,"outfitBackBytes",(d.width,d.height))?;let meta=metadata(&d);crate::outfit_prototype::validate_output(&bytes,&meta)?;
 fs::create_dir_all(library).map_err(|e|e.to_string())?;let base=library.canonicalize().map_err(|e|e.to_string())?;let outfits=base.join("outfits");fs::create_dir_all(&outfits).map_err(|e|e.to_string())?;
 if !outfits.canonicalize().map_err(|e|e.to_string())?.starts_with(&base){return Err("Outfit folder escapes its library.".into());}
 let outfit_id=format!("atelier_generated_{id}");let dest=outfits.join(&outfit_id);
 if dest.exists(){
  if !dest.canonicalize().map_err(|e|e.to_string())?.starts_with(&base)||fs::read(dest.join("outfit.png")).map_err(|e|e.to_string())?!=bytes{return Err("A different outfit already uses this design ID.".into());}
 }else{
  let staging=outfits.join(format!(".incoming-{id}"));
  fs::create_dir_all(&staging).map_err(|e|e.to_string())?;
  if !staging.canonicalize().map_err(|e|e.to_string())?.starts_with(&base){return Err("Staging folder escapes wardrobe.".into());}
  fs::write(staging.join("outfit.png"),&bytes).map_err(|e|e.to_string())?;if let Some(back)=&back{fs::write(staging.join("outfit_back.png"),back).map_err(|e|e.to_string())?;}fs::write(staging.join("selection.json"),&meta).map_err(|e|e.to_string())?;
  if let Some(project)=load_project(root,id)?{fs::write(staging.join("project.json"),serde_json::to_vec(&project).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;}
  fs::rename(&staging,&dest).map_err(|e|e.to_string())?;
 }
 d.status="saved".into();d.outfit_id=Some(outfit_id);write_record(&source,&d)?;Ok(d)
}
fn list(root:&Path)->Result<Vec<Design>,String>{
 if !root.exists(){return Ok(vec![]);}let mut designs=vec![];
 for entry in fs::read_dir(root).map_err(|e|e.to_string())?{let p=entry.map_err(|e|e.to_string())?.path();let id=p.file_name().and_then(|s|s.to_str()).unwrap_or("");if valid_id(id){let d=record(root,id)?;if d.status=="pending"{designs.push(d);}}}
 designs.sort_by(|a,b|b.created_at.cmp(&a.created_at).then_with(||b.id.cmp(&a.id)));Ok(designs)
}
#[tauri::command]pub fn generated_outfits_list(app:tauri::AppHandle)->Result<Vec<Design>,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;list(&root(&app)?)}
#[tauri::command]pub fn generated_outfits_image(app:tauri::AppHandle,id:String)->Result<tauri::ipc::Response,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let folder=checked_folder(&root(&app)?,&id)?;let bytes=fs::read(folder.join("outfit.png")).map_err(|e|e.to_string())?;crate::outfit_prototype::png_dimensions(&bytes)?;Ok(tauri::ipc::Response::new(bytes))}
#[tauri::command]pub fn generated_outfits_submit(app:tauri::AppHandle,state:tauri::State<crate::image_generation::ImageGeneration>,job_id:String,name:String,mode:String)->Result<Design,String>{
 if mode!="review"&&mode!="immediate"{return Err("Choose review or immediate saving.".into());}
 let dir=crate::image_generation::completed_outfit(&state,&job_id)?;let id=dir.file_name().and_then(|s|s.to_str()).ok_or("Invalid generation folder")?;
 let bytes=fs::read(dir.join("outfit.png")).map_err(|e|e.to_string())?;let request:serde_json::Value=serde_json::from_slice(&fs::read(dir.join("request.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut d=enqueue(&root,id,&name,request["prompt"].as_str().unwrap_or(""),&bytes)?;apply_fit_report(&dir,&mut d);write_record(&checked_folder(&root,id)?,&d)?;
 if mode=="immediate"&&d.fit_warnings.is_empty(){approve(&root,&crate::outfit_prototype::library_root(&app)?,id)}else{Ok(d)}
}
#[cfg(test)]
fn update_review(root:&Path,id:&str,bytes:&[u8],expected_revision:u32,name:&str)->Result<Design,String>{
 update_review_project(root,id,bytes,expected_revision,name,None)
}
fn update_review_project(root:&Path,id:&str,bytes:&[u8],expected_revision:u32,name:&str,project:Option<serde_json::Value>)->Result<Design,String>{
 let mut d=record(root,id)?;
 if d.status!="pending"{return Err("This design is already saved or dismissed. Your saved outfit was not changed.".into());}
 if d.revision!=expected_revision{return Err("This review changed since you opened it. Reopen the latest review before saving edits.".into());}
 crate::outfit_prototype::validate_output(bytes,&metadata(&d))?;
 if crate::outfit_prototype::png_dimensions(bytes)?!=(d.width,d.height){return Err("Edited review must keep the original body canvas size.".into());}
 if name.trim().is_empty()||name.chars().count()>80{return Err("Review name must contain 1-80 characters.".into());}
 let folder=checked_folder(root,id)?;
 let next_revision=d.revision.checked_add(1).ok_or("Review revision limit reached")?;
 let project_file=folder.join(format!("edit-{}.json",next_revision));
 if let Some(project)=project{
  validate_project(&project)?;for key in ["outfitFrontBytes","outfitBackBytes"]{crate::outfit_prototype::embedded_outfit_layer(&project,key,(d.width,d.height))?;}
  fs::write(&project_file,serde_json::to_vec(&project).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
 }else if project_file.exists(){fs::remove_file(&project_file).map_err(|e|e.to_string())?;}
 let original=fs::read(folder.join("outfit.png")).map_err(|e|e.to_string())?;
 let temp=folder.join("outfit-edit.tmp");fs::write(&temp,bytes).map_err(|e|e.to_string())?;
 fs::rename(&temp,folder.join("outfit.png")).map_err(|e|e.to_string())?;
 d.revision=next_revision;d.name=name.trim().into();
 if let Err(error)=write_record(&folder,&d){
  let _=fs::remove_file(&project_file);
  fs::write(&temp,&original).map_err(|e|format!("{error}; could not restore previous preview: {e}"))?;
  fs::rename(&temp,folder.join("outfit.png")).map_err(|e|e.to_string())?;return Err(error);
 }
 Ok(d)
}
#[tauri::command]pub fn generated_outfits_update(app:tauri::AppHandle,id:String,bytes:Vec<u8>,expected_revision:u32,name:String,project:Option<serde_json::Value>)->Result<Design,String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;update_review_project(&root(&app)?,&id,&bytes,expected_revision,&name,project)
}
#[tauri::command]pub fn generated_outfits_approve(app:tauri::AppHandle,id:String)->Result<Design,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;approve(&root(&app)?,&crate::outfit_prototype::library_root(&app)?,&id)}
#[tauri::command]pub fn generated_outfits_dismiss(app:tauri::AppHandle,id:String)->Result<(),String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut d=record(&root,&id)?;if d.status!="pending"{return Err("This design is no longer awaiting review.".into());}d.status="dismissed".into();write_record(&checked_folder(&root,&id)?,&d)}
#[tauri::command]pub fn generated_outfits_mode(app:tauri::AppHandle,mode:Option<String>)->Result<String,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let file=root.join("preferences.json");if let Some(mode)=mode{if mode!="review"&&mode!="immediate"{return Err("Invalid save preference".into());}fs::create_dir_all(root).map_err(|e|e.to_string())?;fs::write(file,serde_json::to_vec(&mode).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;return Ok(mode);}Ok(fs::read(file).ok().and_then(|b|serde_json::from_slice::<String>(&b).ok()).filter(|m|m=="review"||m=="immediate").unwrap_or("review".into()))}

#[cfg(test)]mod tests{
 use super::*;
 #[test]fn queue_survives_reopen_and_approval_is_idempotent(){
  let base=std::env::temp_dir().join(format!("mana-designs-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let root=base.join("review");let library=base.join("wardrobe");let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");
  enqueue(&root,"image-123","Blue dress","blue dress",bytes).unwrap();enqueue(&root,"image-456","Another dress","dress",bytes).unwrap();assert_eq!(list(&root).unwrap().len(),2);assert!(!library.exists());
  let a=approve(&root,&library,"image-123").unwrap();let b=approve(&root,&library,"image-123").unwrap();assert_eq!(a.outfit_id,b.outfit_id);assert_eq!(list(&root).unwrap().len(),1);assert_eq!(fs::read_dir(library.join("outfits")).unwrap().count(),1);
  assert!(enqueue(&root,"../bad","Bad","",bytes).is_err());assert!(enqueue(&root,"image-789","Bad","",b"not png").is_err());assert!(record(&root,"../bad").is_err());
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[cfg(test)]mod recovery_tests{
 use super::*;
 #[test]fn failed_immediate_save_retains_review_and_partial_staging_can_retry(){
  let base=std::env::temp_dir().join(format!("mana-design-recovery-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let root=base.join("review");let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");
  enqueue(&root,"image-789","Recoverable","dress",bytes).unwrap();let blocked=base.join("blocked");fs::write(&blocked,b"file").unwrap();assert!(approve(&root,&blocked,"image-789").is_err());assert_eq!(list(&root).unwrap().len(),1);
  let library=base.join("wardrobe");let partial=library.join("outfits/.incoming-image-789");fs::create_dir_all(&partial).unwrap();fs::write(partial.join("outfit.png"),b"partial").unwrap();assert_eq!(approve(&root,&library,"image-789").unwrap().status,"saved");
  enqueue(&root,"image-790","Dismiss me","dress",bytes).unwrap();let mut d=record(&root,"image-790").unwrap();d.status="dismissed".into();write_record(&checked_folder(&root,"image-790").unwrap(),&d).unwrap();assert_eq!(list(&root).unwrap().len(),0);assert!(approve(&root,&library,"image-790").is_err());
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[tauri::command]pub async fn generated_outfits_refit(app:tauri::AppHandle,id:String)->Result<Design,String>{
 tauri::async_runtime::spawn_blocking(move||{
  use tauri::Manager;
  let image_state=app.state::<crate::image_generation::ImageGeneration>();let _image=crate::image_generation::idle_guard(&image_state)?;
  let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut d=record(&root,&id)?;
  if d.status!="pending"{return Err("Only pending outfits can be refitted.".into());}
  if load_project(&root,&id)?.is_some(){return Err("This review has editable manual work. Reopen it in Atelier; retrying the original fit would discard those edits.".into());}
  let images=Path::new(r"C:\AI\ManaAI-CV-2\exports\images").canonicalize().map_err(|e|e.to_string())?;
  let source_id=d.source_job_id.as_deref().unwrap_or(&id);if !valid_id(source_id){return Err("Invalid original source ID".into())}let source=images.join(source_id).canonicalize().map_err(|_|"The original outfit source is missing. You can still edit the review in Atelier.".to_string())?;
  if !source.starts_with(&images){return Err("Invalid outfit source folder.".into());}
  let request:serde_json::Value=serde_json::from_slice(&fs::read(source.join("request.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
  if request["outfitExtraction"]!="aligned-avatar"&&request["outfitExtraction"]!="intact-garment"&&request["outfitExtraction"]!="garment-only-body-guide"{return Err("This older design has no posed avatar reference. Edit it in Atelier; automatic stretching cannot reliably repair it.".into());}
  let script=app.path().resolve("scripts/generated_outfit.py",tauri::path::BaseDirectory::Resource).map_err(|e|e.to_string())?;
  let script=if script.is_file(){script}else{Path::new(env!("CARGO_MANIFEST_DIR")).join("../scripts/generated_outfit.py")};
  let mut command=std::process::Command::new(crate::image_generation::PYTHON);command.arg(script).arg(&source).arg(source.join("avatar-body.png")).current_dir(&source).env("PYTHONDONTWRITEBYTECODE","1").env("PYTHONIOENCODING","utf-8");
  #[cfg(windows)]{use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
  let output=command.output().map_err(|e|e.to_string())?;
  if !output.status.success(){return Err(format!("Could not refit this design: {}",String::from_utf8_lossy(&output.stderr).chars().rev().take(500).collect::<String>().chars().rev().collect::<String>()));}
  let bytes=fs::read(source.join("outfit.png")).map_err(|e|e.to_string())?;crate::outfit_prototype::validate_output(&bytes,&metadata(&d))?;
  let folder=checked_folder(&root,&id)?;let backup=folder.join("outfit-before-refit.png");if !backup.exists(){fs::copy(folder.join("outfit.png"),backup).map_err(|e|e.to_string())?;}
  d=update_review_project(&root,&id,&bytes,d.revision,&d.name,None)?;
  apply_fit_report(&source,&mut d);
  d.fit_version=if request["outfitExtraction"]=="garment-only-body-guide"{7}else if request["outfitExtraction"]=="intact-garment"{4}else{6};write_record(&folder,&d)?;Ok(d)
 }).await.map_err(|e|e.to_string())?
}

#[cfg(test)]mod legacy_fit_tests{
 use super::*;
 #[test]fn older_reviews_default_to_legacy_fit_and_cannot_be_saved_before_update(){
  let base=std::env::temp_dir().join(format!("mana-legacy-fit-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let root=base.join("review");let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");
  let d=enqueue(&root,"image-991","Old fit","dress",bytes).unwrap();let mut v=serde_json::to_value(d).unwrap();v.as_object_mut().unwrap().remove("fitVersion");fs::write(root.join("image-991/design.json"),serde_json::to_vec(&v).unwrap()).unwrap();
  assert_eq!(record(&root,"image-991").unwrap().fit_version,1);assert!(approve(&root,&base.join("wardrobe"),"image-991").unwrap_err().contains("fit"));assert_eq!(list(&root).unwrap().len(),1);
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[cfg(test)]mod edit_review_tests{
 use super::*;
 #[test]fn edited_pending_design_approves_once_and_rejects_stale_or_saved_overwrite(){
  let base=std::env::temp_dir().join(format!("mana-review-edit-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
  let root=base.join("review");let library=base.join("wardrobe");
  let original=include_bytes!("../../tests/fixtures/outfit-alpha.png");let edited=include_bytes!("../../tests/fixtures/outfit-edited-alpha.png");
  enqueue(&root,"image-111","Sailor","outfit",original).unwrap();
  let changed=update_review(&root,"image-111",edited,0,"Adjusted sailor").unwrap();assert_eq!(changed.revision,1);assert_eq!(changed.name,"Adjusted sailor");assert_eq!(fs::read(root.join("image-111/initial-fit.png")).unwrap(),original);
  assert_eq!(list(&root).unwrap().len(),1);assert!(!library.exists());
  assert!(update_review(&root,"image-111",original,0,"Stale draft").is_err());assert_eq!(fs::read(root.join("image-111/outfit.png")).unwrap(),edited);
  assert!(update_review(&root,"image-111",b"bad png",1,"Invalid draft").is_err());assert_eq!(record(&root,"image-111").unwrap().revision,1);
  let approved=approve(&root,&library,"image-111").unwrap();let again=approve(&root,&library,"image-111").unwrap();assert_eq!(approved.outfit_id,again.outfit_id);
  let saved=library.join("outfits").join(approved.outfit_id.unwrap()).join("outfit.png");assert_eq!(fs::read(&saved).unwrap(),edited);assert_eq!(fs::read_dir(library.join("outfits")).unwrap().count(),1);
  assert!(update_review(&root,"image-111",original,1,"Saved draft").is_err());assert_eq!(fs::read(saved).unwrap(),edited);
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[derive(Clone,Serialize,Deserialize,Debug)]
#[serde(rename_all="camelCase")]
pub struct OutfitSchedule{
 frequency:String,
 next_due:Option<u64>,
 last_message:String,
 #[serde(default)]
 retry_policy_applied:bool,
}
const CREATION_RETRY_DELAY:u64=6*3600;
impl Default for OutfitSchedule{fn default()->Self{Self{frequency:"off".into(),next_due:None,last_message:String::new(),retry_policy_applied:true}}}
fn schedule_interval(frequency:&str)->Result<Option<u64>,String>{match frequency{"off"=>Ok(None),"weekly"=>Ok(Some(7*86400)),"twice-weekly"=>Ok(Some(7*86400/2)),_=>Err("Choose Off, once a week or twice a week.".into())}}
fn read_schedule(root:&Path)->Result<OutfitSchedule,String>{
 let file=root.join("schedule.json");if !file.exists(){return Ok(OutfitSchedule::default());}
 let mut schedule:OutfitSchedule=serde_json::from_slice(&fs::read(file).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
 let interval=schedule_interval(&schedule.frequency)?;
 if !schedule.retry_policy_applied {
  let failed=schedule.last_message.starts_with("Scheduled outfit did not finish:")||schedule.last_message.starts_with("Creation did not finish:");
  if let (true,Some(interval),Some(due))=(failed,interval,schedule.next_due){
   schedule.next_due=Some(due.saturating_sub(interval).saturating_add(CREATION_RETRY_DELAY));
  }
  schedule.retry_policy_applied=true;
 }
 Ok(schedule)
}
fn write_schedule(root:&Path,schedule:&OutfitSchedule)->Result<(),String>{fs::create_dir_all(root).map_err(|e|e.to_string())?;let temp=root.join("schedule.tmp");fs::write(&temp,serde_json::to_vec_pretty(schedule).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;fs::rename(temp,root.join("schedule.json")).map_err(|e|e.to_string())}
fn configure_schedule(root:&Path,frequency:Option<&str>,now:u64)->Result<OutfitSchedule,String>{
 let mut schedule=read_schedule(root)?;
 if let Some(frequency)=frequency{let interval=schedule_interval(frequency)?;if schedule.frequency!=frequency{schedule.frequency=frequency.into();schedule.next_due=interval.map(|seconds|now.saturating_add(seconds));write_schedule(root,&schedule)?;}}
 Ok(schedule)
}
fn claim_schedule(root:&Path,now:u64)->Result<bool,String>{
 let mut schedule=read_schedule(root)?;let Some(interval)=schedule_interval(&schedule.frequency)? else{return Ok(false)};
 if !schedule.next_due.is_some_and(|due|now>=due){return Ok(false)}
 // Claim durably BEFORE generation. Reopening Mana cannot trigger duplicates
 // or a burst of generations for missed weeks. Reported failures can retry sooner.
 schedule.next_due=Some(now.saturating_add(interval));schedule.last_message="Scheduled attempt started.".into();write_schedule(root,&schedule)?;Ok(true)
}
fn schedule_now()->Result<u64,String>{std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|v|v.as_secs()).map_err(|e|e.to_string())}
#[tauri::command]pub fn generated_outfits_schedule(app:tauri::AppHandle,frequency:Option<String>)->Result<OutfitSchedule,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;configure_schedule(&root(&app)?,frequency.as_deref(),schedule_now()?)}
#[tauri::command]pub fn generated_outfits_schedule_claim(app:tauri::AppHandle)->Result<bool,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;claim_schedule(&root(&app)?,schedule_now()?)}
fn record_schedule_result(root:&Path,message:&str,failed:bool,now:u64)->Result<(),String>{
 let mut schedule=read_schedule(root)?;
 schedule.last_message=message.chars().take(500).collect();
 if failed && schedule.frequency!="off" {
  schedule.next_due=Some(now.saturating_add(CREATION_RETRY_DELAY));
 }
 write_schedule(root,&schedule)
}
#[tauri::command]pub fn generated_outfits_schedule_result(app:tauri::AppHandle,message:String,failed:bool)->Result<(),String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;
 record_schedule_result(&root(&app)?,&message,failed,schedule_now()?)
}

#[cfg(test)]mod schedule_tests{
 use super::*;
 #[test]fn schedule_is_opt_in_persistent_and_never_catches_up_in_a_burst(){
  let base=std::env::temp_dir().join(format!("mana-outfit-schedule-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
  assert_eq!(read_schedule(&base).unwrap().frequency,"off");assert!(!claim_schedule(&base,9999999).unwrap());assert!(!base.exists());
  let s=configure_schedule(&base,Some("weekly"),1000).unwrap();assert_eq!(s.next_due,Some(605800));assert!(!claim_schedule(&base,605799).unwrap());assert!(claim_schedule(&base,605800).unwrap());assert!(!claim_schedule(&base,605800).unwrap());
  fs::write(base.join("schedule.json"),br#"{"frequency":"weekly","nextDue":1210600,"lastMessage":"Scheduled outfit did not finish: rejected source"}"#).unwrap();
  let legacy_retry=605800+CREATION_RETRY_DELAY;
  assert!(!claim_schedule(&base,legacy_retry-1).unwrap());
  assert!(claim_schedule(&base,legacy_retry).unwrap());
  record_schedule_result(&base,"Attempt failed",true,legacy_retry+30).unwrap();
  let retry=legacy_retry+30+CREATION_RETRY_DELAY;
  assert!(!claim_schedule(&base,retry-1).unwrap());
  assert!(claim_schedule(&base,retry).unwrap());
  record_schedule_result(&base,"Saved for review",false,retry+30).unwrap();
  assert_eq!(read_schedule(&base).unwrap().next_due,Some(retry+604800));
  assert!(claim_schedule(&base,9999999).unwrap());assert!(!claim_schedule(&base,9999999).unwrap());assert_eq!(read_schedule(&base).unwrap().next_due,Some(9999999+604800));
  assert_eq!(configure_schedule(&base,Some("twice-weekly"),2000).unwrap().next_due,Some(304400));assert!(configure_schedule(&base,Some("daily"),2000).is_err());
  configure_schedule(&base,Some("off"),3000).unwrap();assert!(!claim_schedule(&base,u64::MAX).unwrap());
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[derive(Serialize)]pub struct OutfitIdeaHistory{name:String,prompt:String}
fn idea_history(root:&Path)->Result<Vec<OutfitIdeaHistory>,String>{
 if !root.exists(){return Ok(vec![])}
 let mut designs=vec![];
 for entry in fs::read_dir(root).map_err(|e|e.to_string())?{
  let path=entry.map_err(|e|e.to_string())?.path();let id=path.file_name().and_then(|v|v.to_str()).unwrap_or("");
  if valid_id(id){designs.push(record(root,id)?);}
 }
 designs.sort_by(|a,b|b.created_at.cmp(&a.created_at).then_with(||b.id.cmp(&a.id)));
 Ok(designs.into_iter().take(24).map(|d|OutfitIdeaHistory{name:d.name,prompt:d.prompt}).collect())
}
#[tauri::command]pub fn generated_outfits_idea_history(app:tauri::AppHandle)->Result<Vec<OutfitIdeaHistory>,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;idea_history(&root(&app)?)}

#[cfg(test)]mod idea_history_tests{
 use super::*;
 #[test]fn history_includes_approved_and_dismissed_designs_after_reopen(){
  let base=std::env::temp_dir().join(format!("mana-idea-history-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
  assert!(idea_history(&base).unwrap().is_empty());let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");
  for (id,status,name) in [("image-1","saved","Sky ribbon sailor"),("image-2","dismissed","Mint flower dress"),("image-3","pending","Rose cardigan")]{
   let mut d=enqueue(&base,id,name,name,bytes).unwrap();d.status=status.into();write_record(&base.join(id),&d).unwrap();
  }
  let history=idea_history(&base).unwrap();assert_eq!(history.len(),3);assert!(history.iter().any(|h|h.name=="Mint flower dress"));assert!(history.iter().any(|h|h.prompt=="Sky ribbon sailor"));
  assert_eq!(list(&base).unwrap().len(),1);
  assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

pub(crate) fn validate_project(project:&serde_json::Value)->Result<(),String>{
 let bytes=serde_json::to_vec(project).map_err(|e|e.to_string())?;
 if bytes.len()>48_000_000||!project["sourceDataUrl"].as_str().is_some_and(|s|s.starts_with("data:image/png;base64,")&&s.len()<24_000_000)||!project["parts"].as_array().is_some_and(|a|!a.is_empty()&&a.len()<=12){return Err("Editable outfit needs its source PNG and 1–12 layers, under48MB.".into())}
 for key in ["width","height"]{if !project["sourceSize"][key].as_u64().is_some_and(|v|v>0&&v<=4096){return Err("Invalid editable source dimensions".into())}}
 Ok(())
}
fn load_project(root:&Path,id:&str)->Result<Option<serde_json::Value>,String>{if !valid_id(id){return Err("Invalid outfit design ID".into())}if !root.join(id).exists(){return Ok(None)}let d=record(root,id)?;let file=checked_folder(root,id)?.join(format!("edit-{}.json",d.revision));if !file.exists(){return Ok(None)}if !file.canonicalize().map_err(|e|e.to_string())?.starts_with(checked_folder(root,id)?){return Err("Editable project escapes its review folder".into())}if fs::metadata(&file).map_err(|e|e.to_string())?.len()>48_000_000{return Err("Editable project is too large".into())}let project=serde_json::from_slice(&fs::read(file).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;validate_project(&project)?;Ok(Some(project))}

fn images_root()->PathBuf{PathBuf::from("C:/AI/ManaAI-CV-2/exports/images")}
fn recovery_folder(images:&Path,id:&str)->Result<PathBuf,String>{if !valid_id(id){return Err("Invalid recovery ID".into())}let base=images.canonicalize().map_err(|e|e.to_string())?;let path=base.join(id).canonicalize().map_err(|e|e.to_string())?;if !path.starts_with(base){return Err("Recovery path escapes image jobs".into())}for file in ["request.json","image.png","avatar-body.png"]{let file=path.join(file);let canonical=file.canonicalize().map_err(|e|e.to_string())?;if !canonical.starts_with(&path)||fs::metadata(&canonical).map_err(|e|e.to_string())?.len()>40_000_000{return Err("Recovery file escapes its job or is too large.".into())}}let request:serde_json::Value=serde_json::from_slice(&fs::read(path.join("request.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;if request["outfitExtraction"]!="garment-only-body-guide"||!path.join("image.png").is_file()||!path.join("avatar-body.png").is_file(){return Err("This job has no reusable clothing-only image and body guide.".into())}Ok(path)}
fn rejected_clothing_source(dir: &Path, error: &str) -> bool {
 let rejected = |message: &str| {
  let message = message.to_ascii_lowercase();
  message.contains("model generated body parts instead of a clothing-only layer")
   || message.contains("model drew a person instead of clothing only")
 };
 rejected(error) || ["recovery.log", "job.log"].iter().any(|file| {
  use std::io::{Read, Seek, SeekFrom};
  let Ok(mut log) = fs::File::open(dir.join(file)) else { return false };
  let Ok(size) = log.metadata().map(|meta| meta.len()) else { return false };
  if log.seek(SeekFrom::Start(size.saturating_sub(8192))).is_err() { return false }
  let mut tail = Vec::new();
  log.take(8192).read_to_end(&mut tail).is_ok() && rejected(&String::from_utf8_lossy(&tail))
 })
}
fn recovery_list(images:&Path,queue:&Path)->Result<Vec<serde_json::Value>,String>{
 if !images.exists(){return Ok(vec![])}let mut jobs=vec![];
 for entry in fs::read_dir(images).map_err(|e|e.to_string())?.filter_map(Result::ok){let id=entry.file_name().to_string_lossy().into_owned();if queue.join(&id).exists(){continue}let Ok(dir)=recovery_folder(images,&id) else{continue};let progress:serde_json::Value=fs::read(dir.join("progress.json")).ok().and_then(|b|serde_json::from_slice(&b).ok()).unwrap_or_default();let error=progress["error"].as_str().unwrap_or("Fitting or review submission was not completed.");if rejected_clothing_source(&dir,error){continue}let created=entry.metadata().ok().and_then(|v|v.modified().ok()).and_then(|v|v.duration_since(std::time::UNIX_EPOCH).ok()).map(|v|v.as_secs()).unwrap_or(0);jobs.push(serde_json::json!({"id":id,"name":"Recovered outfit","createdAt":created,"error":error}));}
 jobs.sort_by_key(|v|std::cmp::Reverse(v["createdAt"].as_u64().unwrap_or(0)));jobs.truncate(20);Ok(jobs)
}
#[tauri::command]pub fn generated_outfits_recoverable(app:tauri::AppHandle)->Result<Vec<serde_json::Value>,String>{let _q=QUEUE.lock().map_err(|e|e.to_string())?;recovery_list(&images_root(),&root(&app)?)}
#[tauri::command]pub async fn generated_outfits_recover(app:tauri::AppHandle,id:String,name:String)->Result<Design,String>{
 tauri::async_runtime::spawn_blocking(move||{
  use tauri::Manager;let state=app.state::<crate::image_generation::ImageGeneration>();let _image=crate::image_generation::idle_guard(&state)?;
  let _q=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;
  if root.join(&id).exists(){return Err("This outfit is already in review or was handled. Use Retry fitting on its pending card.".into())}
  if name.trim().is_empty()||name.chars().count()>80{return Err("Use an outfit name of1–80 characters.".into())}
  let source=recovery_folder(&images_root(),&id)?;
  let progress:serde_json::Value=fs::read(source.join("progress.json")).ok().and_then(|b|serde_json::from_slice(&b).ok()).unwrap_or_default();
  if rejected_clothing_source(&source,progress["error"].as_str().unwrap_or("")){return Err("This source contains body parts. Create a new outfit to get a clothing-only image.".into())}
  let script=app.path().resolve("scripts/generated_outfit.py",tauri::path::BaseDirectory::Resource).map_err(|e|e.to_string())?;let script=if script.is_file(){script}else{Path::new(env!("CARGO_MANIFEST_DIR")).join("../scripts/generated_outfit.py")};
  let mut command=std::process::Command::new(crate::image_generation::PYTHON);command.arg(script).arg(&source).arg(source.join("avatar-body.png")).current_dir(&source).env("PYTHONDONTWRITEBYTECODE","1").env("PYTHONIOENCODING","utf-8");
  #[cfg(windows)]{use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
  let output=command.output().map_err(|e|e.to_string())?;fs::write(source.join("recovery.log"),[output.stdout.as_slice(),output.stderr.as_slice()].concat()).map_err(|e|e.to_string())?;
  if !output.status.success(){return Err(format!("Recovery could not finish fitting. No new image was generated. {}",String::from_utf8_lossy(&output.stderr).chars().rev().take(500).collect::<String>().chars().rev().collect::<String>()))}
  let bytes=fs::read(source.join("outfit.png")).map_err(|e|e.to_string())?;let request:serde_json::Value=serde_json::from_slice(&fs::read(source.join("request.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
  let mut design=enqueue(&root,&id,&name,request["prompt"].as_str().unwrap_or(""),&bytes)?;apply_fit_report(&source,&mut design);write_record(&checked_folder(&root,&id)?,&design)?;Ok(design)
 }).await.map_err(|e|e.to_string())?
}

fn apply_fit_report(source:&Path,design:&mut Design){let report:serde_json::Value=fs::read(source.join("outfit-report.json")).ok().and_then(|b|serde_json::from_slice(&b).ok()).unwrap_or_default();design.fit_warnings=report["fit_warnings"].as_array().map(|v|v.iter().filter_map(|v|v.as_str().map(str::to_owned)).take(20).collect()).unwrap_or_else(||vec!["Fit checks are unavailable. Inspect this design in Atelier before approving.".into()]);}

#[tauri::command]pub fn generated_outfits_project(app:tauri::AppHandle,id:String)->Result<Option<serde_json::Value>,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;load_project(&root(&app)?,&id)}
#[cfg(test)]mod project_recovery_tests{
 use super::*;
 fn temp(name:&str)->PathBuf{std::env::temp_dir().join(format!("mana-{name}-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()))}
 #[test]fn editable_project_survives_reopen_and_approval_without_stale_overwrite(){
  let base=temp("project");let root=base.join("queue");let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");let (w,h)=crate::outfit_prototype::png_dimensions(bytes).unwrap();enqueue(&root,"image-123","Draft","long sleeves",bytes).unwrap();
  assert!(load_project(&root,"image-123").unwrap().is_none());
  let mut project=serde_json::json!({"name":"Draft","sourceDataUrl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAX0lEQVR4nO3QMQEAAAgDoPXPuAaG0BC+EIEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOCpnZUIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQH4OWNADoziqwBsAAAAASUVORK5CYII=","sourceSize":{"width":w,"height":h},"parts":[{"id":"dress","name":"Dress","regions":[{"kind":"brush","erase":true,"points":[{"x":2,"y":2}],"brushSize":4}],"transform":{"x":0,"y":0,"scale":1,"frame":1}}],"activePartId":"dress","history":{"past":[{"marker":"before resize"}],"future":[]}});
  let snapshot=serde_json::json!({"pieces":project["parts"].clone(),"activeId":"dress"});project["history"]=serde_json::json!({"past":[snapshot.clone()],"present":snapshot,"future":[]});
  update_review_project(&root,"image-123",bytes,0,"Edited",Some(project.clone())).unwrap();assert_eq!(load_project(&root,"image-123").unwrap(),Some(project.clone()));
  assert!(update_review_project(&root,"image-123",bytes,0,"Stale",Some(serde_json::json!({}))).is_err());assert_eq!(load_project(&root,"image-123").unwrap(),Some(project.clone()));
  let saved=approve(&root,&base.join("wardrobe"),"image-123").unwrap();let installed=base.join("wardrobe/outfits").join(saved.outfit_id.unwrap()).join("project.json");assert_eq!(serde_json::from_slice::<serde_json::Value>(&fs::read(installed).unwrap()).unwrap(),project);
  assert!(update_review_project(&root,"image-123",bytes,1,"Saved edit",None).is_err());assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
 #[test]fn recovery_lists_only_reusable_unqueued_clothing_jobs_and_rejects_escape(){
  let base=temp("recovery");let images=base.join("images");let root=base.join("queue");let dir=images.join("image-456");fs::create_dir_all(&dir).unwrap();let png=include_bytes!("../../tests/fixtures/outfit-alpha.png");fs::write(dir.join("image.png"),png).unwrap();fs::write(dir.join("avatar-body.png"),png).unwrap();fs::write(dir.join("request.json"),br#"{"outfitExtraction":"garment-only-body-guide"}"#).unwrap();fs::write(dir.join("progress.json"),br#"{"stage":"error","error":"fit failed"}"#).unwrap();
  let list=recovery_list(&images,&root).unwrap();assert_eq!(list.len(),1);assert_eq!(list[0]["id"],"image-456");assert_eq!(list[0]["error"],"fit failed");assert!(recovery_folder(&images,"../image-456").is_err());
  for (file,message) in [
   ("progress.json", r#"{"stage":"error","error":"The model generated body parts instead of a clothing-only layer."}"#),
   ("recovery.log", "ValueError: The model drew a person instead of clothing only."),
  ]{
   fs::write(dir.join(file),message).unwrap();
   assert!(recovery_list(&images,&root).unwrap().is_empty());
   fs::remove_file(dir.join(file)).unwrap();
  }
  assert_eq!(recovery_list(&images,&root).unwrap().len(),1);
  enqueue(&root,"image-456","Recovered","",png).unwrap();assert!(recovery_list(&images,&root).unwrap().is_empty());assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
}

#[tauri::command]
pub fn generated_outfits_preview(app:tauri::AppHandle,id:String,stage:String)->Result<tauri::ipc::Response,String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;
 let folder=checked_folder(&root(&app)?,&id)?;
 let file=match stage.as_str(){"current"=>folder.join("outfit.png"),"fitted"=>folder.join("initial-fit.png"),"generated"=>{let d=record(&root(&app)?,&id)?;recovery_folder(&images_root(),d.source_job_id.as_deref().unwrap_or(&id))?.join("image.png")},_=>return Err("Unknown preview stage".into())};
 if fs::metadata(&file).map_err(|_|"This earlier preview is unavailable for this design.")?.len()>40_000_000{return Err("Preview is too large".into())}
 let bytes=fs::read(file).map_err(|e|e.to_string())?;crate::outfit_prototype::png_dimensions(&bytes)?;Ok(tauri::ipc::Response::new(bytes))
}
#[tauri::command]
pub fn generated_outfits_rename(app:tauri::AppHandle,id:String,name:String)->Result<(),String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut d=record(&root,&id)?;
 if d.status!="pending"||name.trim().is_empty()||name.chars().count()>80{return Err("Choose a name of 1–80 characters for a pending design.".into())}
 d.name=name.trim().into();write_record(&checked_folder(&root,&id)?,&d)
}

fn annotate(root:&Path,id:&str,notes:&str,needs_edits:bool)->Result<(),String>{
 let mut d=record(root,id)?;if d.status!="pending"{return Err("This design is no longer awaiting review.".into())}if notes.chars().count()>2000{return Err("Review notes must be under 2000 characters.".into())}d.review_notes=notes.into();d.needs_edits=needs_edits;write_record(&checked_folder(root,id)?,&d)
}
#[tauri::command]
pub fn generated_outfits_annotate(app:tauri::AppHandle,id:String,notes:String,needs_edits:bool)->Result<(),String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;annotate(&root(&app)?,&id,&notes,needs_edits)}
#[cfg(test)]mod annotation_tests{use super::*;#[test]fn notes_survive_reopen_without_changing_pixels_or_edit_revision(){let base=std::env::temp_dir().join(format!("mana-notes-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");enqueue(&base,"image-999","Dress","dress",bytes).unwrap();annotate(&base,"image-999","Check left cuff",true).unwrap();let d=record(&base,"image-999").unwrap();assert!(d.needs_edits);assert_eq!(d.review_notes,"Check left cuff");assert_eq!(d.revision,0);assert_eq!(fs::read(base.join("image-999/outfit.png")).unwrap(),bytes);assert!(annotate(&base,"image-999",&"x".repeat(2001),false).is_err());annotate(&base,"image-999","",false).unwrap();assert!(!record(&base,"image-999").unwrap().needs_edits);fs::remove_dir_all(base).unwrap();}}

fn duplicate_review(root:&Path,id:&str,new_id:&str)->Result<Design,String>{
 let original=record(root,id)?;if original.status!="pending"{return Err("Only pending reviews can be duplicated.".into())}if !valid_id(new_id)||root.join(new_id).exists(){return Err("Duplicate review ID is unavailable.".into())}
 let folder=checked_folder(root,id)?;let bytes=fs::read(folder.join("outfit.png")).map_err(|e|e.to_string())?;let project=load_project(root,id)?;
 let name=format!("{} copy",original.name.chars().take(75).collect::<String>());
 let mut copy=enqueue(root,new_id,&name,&original.prompt,&bytes)?;
 let target=checked_folder(root,new_id)?;
 if let Some(mut project)=project{project["name"]=serde_json::Value::String(name.clone());copy=update_review_project(root,new_id,&bytes,0,&name,Some(project))?;}
 let initial=folder.join("initial-fit.png");if initial.exists(){if !initial.canonicalize().map_err(|e|e.to_string())?.starts_with(&folder){return Err("Initial preview escapes review".into())}fs::copy(initial,target.join("initial-fit.png")).map_err(|e|e.to_string())?;}
 copy.fit_version=original.fit_version;copy.fit_warnings=original.fit_warnings;copy.review_notes=original.review_notes;copy.needs_edits=original.needs_edits;copy.source_job_id=Some(original.source_job_id.unwrap_or(original.id));write_record(&target,&copy)?;Ok(copy)
}
#[tauri::command]pub fn generated_outfits_duplicate(app:tauri::AppHandle,id:String)->Result<Design,String>{let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let new_id=format!("image-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos());duplicate_review(&root(&app)?,&id,&new_id)}
#[cfg(test)]mod duplicate_tests{use super::*;#[test]fn duplicate_is_independent_and_preserves_original(){let base=std::env::temp_dir().join(format!("mana-copy-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");enqueue(&base,"image-111","Dress","dress",bytes).unwrap();annotate(&base,"image-111","Cuff",true).unwrap();let project=serde_json::json!({"name":"Dress","sourceDataUrl":"data:image/png;base64,AA==","sourceSize":{"width":128,"height":128},"parts":[{"id":"dress","locked":true}],"history":{"past":[],"present":{"pieces":[]},"future":[]}});update_review_project(&base,"image-111",bytes,0,"Dress",Some(project)).unwrap();let copy=duplicate_review(&base,"image-111","image-222").unwrap();assert_eq!(copy.name,"Dress copy");assert_eq!(load_project(&base,"image-222").unwrap().unwrap()["parts"][0]["locked"],true);assert_eq!(copy.source_job_id.as_deref(),Some("image-111"));assert!(copy.needs_edits);annotate(&base,"image-222","Changed",false).unwrap();assert_eq!(record(&base,"image-111").unwrap().review_notes,"Cuff");assert_eq!(fs::read(base.join("image-111/outfit.png")).unwrap(),bytes);assert!(duplicate_review(&base,"image-111","image-222").is_err());fs::remove_dir_all(base).unwrap();}}

#[cfg(test)]mod body_depth_tests{use super::*;#[test]fn approval_uses_separate_layers_not_occluded_review_preview(){let root=std::env::temp_dir().join(format!("mana-depth-review-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let queue=root.join("queue");let bytes=include_bytes!("../../tests/fixtures/outfit-alpha.png");enqueue(&queue,"image-123","Layer test","test",bytes).unwrap();let project=serde_json::json!({"sourceDataUrl":"data:image/png;base64,AA==","sourceSize":{"width":128,"height":128},"parts":[{"id":"back","depth":"back"}],"outfitFrontBytes":bytes.to_vec(),"outfitBackBytes":bytes.to_vec()});update_review_project(&queue,"image-123",bytes,0,"Layer test",Some(project)).unwrap();let library=root.join("wardrobe");approve(&queue,&library,"image-123").unwrap();let dest=library.join("outfits/atelier_generated_image-123");assert_eq!(fs::read(dest.join("outfit_back.png")).unwrap(),bytes);assert!(dest.join("project.json").is_file());fs::remove_dir_all(root).unwrap();}}

fn wearable_schedule_root(base:&Path,category:&str)->Result<PathBuf,String>{if !matches!(category,"hair"|"accessory"){return Err("Choose hair or accessory".into())}Ok(base.join(format!("creation-{category}")))}
#[tauri::command]pub fn wearable_creation_schedule(app:tauri::AppHandle,category:String,frequency:Option<String>)->Result<OutfitSchedule,String>{let _g=QUEUE.lock().map_err(|e|e.to_string())?;configure_schedule(&wearable_schedule_root(&root(&app)?,&category)?,frequency.as_deref(),schedule_now()?)}
#[tauri::command]pub fn wearable_creation_claim(app:tauri::AppHandle,category:String)->Result<bool,String>{let _g=QUEUE.lock().map_err(|e|e.to_string())?;claim_schedule(&wearable_schedule_root(&root(&app)?,&category)?,schedule_now()?)}
#[tauri::command]pub fn wearable_creation_result(app:tauri::AppHandle,category:String,message:String,failed:bool)->Result<(),String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;
 record_schedule_result(&wearable_schedule_root(&root(&app)?,&category)?,&message,failed,schedule_now()?)
}

#[cfg(test)]mod wearable_schedule_tests{use super::*;#[test]fn schedules_are_independent_durable_off_by_default_and_claim_once(){let base=std::env::temp_dir().join(format!("mana-wearable-schedule-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let hair=wearable_schedule_root(&base,"hair").unwrap();let accessory=wearable_schedule_root(&base,"accessory").unwrap();assert!(!claim_schedule(&hair,u64::MAX).unwrap());configure_schedule(&hair,Some("weekly"),100).unwrap();configure_schedule(&accessory,Some("twice-weekly"),200).unwrap();assert_eq!(read_schedule(&hair).unwrap().frequency,"weekly");assert_eq!(read_schedule(&accessory).unwrap().frequency,"twice-weekly");assert!(!claim_schedule(&hair,101).unwrap());assert!(claim_schedule(&hair,9999999).unwrap());assert!(!claim_schedule(&hair,9999999).unwrap());assert!(claim_schedule(&accessory,9999999).unwrap());configure_schedule(&hair,Some("off"),10000000).unwrap();assert!(!claim_schedule(&hair,u64::MAX).unwrap());assert!(wearable_schedule_root(&base,"../bad").is_err());fs::remove_dir_all(base).unwrap();}}
