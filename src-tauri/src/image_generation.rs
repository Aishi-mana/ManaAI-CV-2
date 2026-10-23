use std::{fs,io::Read,path::{Path,PathBuf},process::{Child,Command,Stdio},sync::Mutex};

use tauri::Manager;

const CHECKPOINTS:&str=r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Shared\models\checkpoints";

const ENGINE:&str=r"C:\AI\stable-diffusion.cpp\build\bin\Release\sd-cli.exe";

const COMFY:&str=r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI";

const PYTHON:&str=r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\.venv\Scripts\python.exe";

const QWEN_MODEL:&str="Qwen-Rapid-AIO-SFW-v23.safetensors";

const SHARED:&str=r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Shared";

fn qwen_files()->serde_json::Value{let root=Path::new(SHARED).join("models");serde_json::json!({"model":root.join("diffusion_models").join(QWEN_MODEL),"clip":root.join("text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"),"vae":root.join("vae/qwen_image_vae.safetensors"),"lora":root.join("loras/modern-anime.safetensors")})}

fn qwen_ready()->bool{Path::new(PYTHON).is_file()&&qwen_files().as_object().unwrap().values().all(|p|p.as_str().is_some_and(|p|Path::new(p).is_file()))&&Path::new(COMFY).join("comfy_extras/nodes_qwen.py").is_file()}

fn qwen_reference()->PathBuf{Path::new(SHARED).join("input/Mana Turnaround Sheet.png")}

#[derive(Default)]pub struct ImageGeneration(pub Mutex<Option<Job>>);

pub struct Job{child:Child,dir:PathBuf,stopped:bool}

impl Drop for Job{fn drop(&mut self){if self.child.try_wait().ok().flatten().is_none(){

 #[cfg(windows)]{use std::os::windows::process::CommandExt;let _=Command::new("taskkill.exe").args(["/PID",&self.child.id().to_string(),"/T","/F"]).creation_flags(0x08000000).stdout(Stdio::null()).stderr(Stdio::null()).status();}

 let _=self.child.kill();let _=self.child.wait();}}}

fn architecture(path:&Path)->Result<&'static str,String>{

 let mut file=fs::File::open(path).map_err(|e|e.to_string())?;let mut size=[0;8];file.read_exact(&mut size).map_err(|e|e.to_string())?;let size=u64::from_le_bytes(size);if size>20_000_000{return Err("Checkpoint header too large".into());}let mut data=vec![0;size as usize];file.read_exact(&mut data).map_err(|e|e.to_string())?;let header:serde_json::Value=serde_json::from_slice(&data).map_err(|e|e.to_string())?;let keys=header.as_object().ok_or("Invalid checkpoint")?;

 if keys.keys().any(|k|k.starts_with("model.diffusion_model.cap_embedder."))&&keys.keys().any(|k|k.starts_with("text_encoders.gemma2_2b.")){Ok("neta")}

 else if keys.keys().any(|k|k.starts_with("conditioner.embedders.")){Ok("sdxl")}

 else if keys.keys().any(|k|k.starts_with("cond_stage_model.transformer.")){Ok("sd1")}

 else{Ok("unsupported")}

}

#[tauri::command]pub fn image_generation_discover()->Result<serde_json::Value,String>{

 let mut models=Vec::new();for entry in fs::read_dir(CHECKPOINTS).map_err(|e|format!("Checkpoint folder unavailable: {e}"))?{let path=entry.map_err(|e|e.to_string())?.path();if path.extension().and_then(|s|s.to_str())!=Some("safetensors"){continue;}let kind=architecture(&path).unwrap_or("unsupported");models.push(serde_json::json!({"name":path.file_name().unwrap().to_string_lossy(),"kind":kind}));}models.push(serde_json::json!({"name":QWEN_MODEL,"kind":"qwen"}));models.sort_by_key(|m|m["name"].as_str().unwrap_or("").to_lowercase());

 Ok(serde_json::json!({"models":models,"engineReady":Path::new(ENGINE).is_file(),"netaReady":Path::new(PYTHON).is_file()&&Path::new(COMFY).join("comfy/sd.py").is_file(),"qwenReady":qwen_ready(),"qwenReferenceReady":qwen_reference().is_file(),"folder":CHECKPOINTS}))

}

#[derive(serde::Deserialize,serde::Serialize)]pub struct Request{pub model:String,pub prompt:String,pub negative:String,pub width:u32,pub height:u32,pub steps:u32,pub cfg:f64,pub seed:u32,pub cpu:bool,#[serde(default,rename="characterReference")]pub character_reference:bool,#[serde(default)]pub reference:Option<String>,#[serde(default,rename="referenceStrength")]pub reference_strength:Option<f64>,#[serde(default,rename="referenceMask")]pub reference_mask:Option<String>}

fn valid_dimensions(r:&Request)->bool{let qwen=r.model==QWEN_MODEL;let limit=if qwen{1280}else{1024};let step=if qwen{16}else{64};r.width<=limit&&r.height<=limit&&r.width%step==0&&r.height%step==0&&(!qwen||r.width as u64*r.height as u64<=1_310_720)}

fn validate(r:&Request)->Result<(),String>{if r.model==QWEN_MODEL{if r.cpu{return Err("Qwen currently requires the NVIDIA GPU. Turn off Use CPU.".into());}if (r.reference.is_some()&&r.character_reference)||r.reference_mask.is_some(){return Err("Choose one Qwen reference: character sheet or current avatar, without a clothing mask.".into());}}else if r.character_reference{return Err("Character sheet references require Qwen.".into());}if let Some(mask)=&r.reference_mask{let data=mask.strip_prefix("data:image/jpeg;base64,").ok_or("Use a JPEG clothing mask.")?;if r.reference.is_none()||mask.len()>1_000_000||!data.starts_with("/9j/")||data.len()%4!=0||!data.bytes().all(|b|b.is_ascii_alphanumeric()||b"+/=".contains(&b)){return Err("Invalid clothing mask.".into());}}if r.reference_strength.is_some_and(|n|!n.is_finite()||n<0.2||n>0.8){return Err("Reference variation must be 0.2–0.8.".into());}if let Some(image)=&r.reference{let encoded=image.strip_prefix("data:image/jpeg;base64,").ok_or("Use a JPEG avatar reference.")?;if image.len()>1_000_000||!encoded.starts_with("/9j/")||encoded.len()%4!=0||!encoded.bytes().all(|b|b.is_ascii_alphanumeric()||b"+/=".contains(&b)){return Err("Invalid avatar reference.".into());}}if r.model.is_empty()||Path::new(&r.model).components().count()!=1||r.model.contains(['/', '\\'])||!r.model.ends_with(".safetensors")||r.prompt.trim().is_empty()||r.prompt.len()>6000||r.negative.len()>6000||r.width<128||r.height<128||!valid_dimensions(r)||r.steps<1||r.steps>50||!r.cfg.is_finite()||r.cfg<1.0||r.cfg>15.0{return Err("Use a local checkpoint, a prompt, dimensions 128–1024 in multiples of64, 1–50 steps and guidance1–15.".into());}Ok(())}

#[tauri::command]pub fn image_generation_start(app:tauri::AppHandle,state:tauri::State<ImageGeneration>,request:Request)->Result<String,String>{

 validate(&request)?;let mut slot=state.0.lock().map_err(|e|e.to_string())?;if let Some(job)=slot.as_mut(){if job.child.try_wait().map_err(|e|e.to_string())?.is_none(){return Err("Stop the current image job first.".into());}}

 let is_qwen=request.model==QWEN_MODEL;let checkpoint=if is_qwen{Path::new(SHARED).join("models/diffusion_models").join(QWEN_MODEL)}else{Path::new(CHECKPOINTS).join(&request.model)};let kind=if is_qwen{"qwen"}else{architecture(&checkpoint)?};if is_qwen&&(!qwen_ready()||(request.character_reference&&!qwen_reference().is_file())){return Err("Qwen's local model files or Mana turnaround sheet are missing.".into());}if kind=="unsupported"{return Err("This checkpoint architecture is not supported by this image tool.".into());}if !Path::new(PYTHON).is_file(){return Err("The installed image Python environment is missing.".into());}if kind!="neta"&&kind!="qwen"&&!Path::new(ENGINE).is_file(){return Err("Stable Diffusion engine is missing.".into());}

 let dir=Path::new(r"C:\AI\ManaAI-CV-2\exports\images").join(format!("image-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos()));fs::create_dir_all(&dir).map_err(|e|e.to_string())?;

 let mut payload=serde_json::to_value(&request).map_err(|e|e.to_string())?;payload["checkpoint"]=serde_json::json!(checkpoint);payload["backend"]=serde_json::json!(if kind=="qwen"{"qwen"}else if kind=="neta"{"neta"}else{"sd"});payload["engine"]=serde_json::json!(ENGINE);payload["comfy"]=serde_json::json!(COMFY);if is_qwen{payload["qwenFiles"]=qwen_files();if request.character_reference{payload["qwenReference"]=serde_json::json!(qwen_reference());}}let input=dir.join("request.json");fs::write(&input,serde_json::to_vec_pretty(&payload).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;

 let script=app.path().resolve("scripts/image_job.py",tauri::path::BaseDirectory::Resource).map_err(|e|e.to_string())?;let script=if script.is_file(){script}else{Path::new(env!("CARGO_MANIFEST_DIR")).join("../scripts/image_job.py")};

 let log=fs::File::create(dir.join("job.log")).map_err(|e|e.to_string())?;let err=log.try_clone().map_err(|e|e.to_string())?;let mut command=Command::new(PYTHON);command.arg(script).arg(input).current_dir(&dir).env("PYTHONIOENCODING","utf-8").stdout(Stdio::from(log)).stderr(Stdio::from(err));

 #[cfg(windows)]{use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}

 let child=command.spawn().map_err(|e|e.to_string())?;let path=dir.to_string_lossy().to_string();*slot=Some(Job{child,dir,stopped:false});Ok(path)

}

#[tauri::command]pub fn image_generation_poll(state:tauri::State<ImageGeneration>,job_id:String)->Result<serde_json::Value,String>{let mut slot=state.0.lock().map_err(|e|e.to_string())?;let job=slot.as_mut().ok_or("No image job")?;if job.dir.to_string_lossy()!=job_id{return Err("Image job was replaced.".into());}if job.stopped{return Ok(serde_json::json!({"stage":"stopped"}));}let exit=job.child.try_wait().map_err(|e|e.to_string())?;let mut status=fs::read(job.dir.join("progress.json")).ok().and_then(|b|serde_json::from_slice::<serde_json::Value>(&b).ok()).unwrap_or(serde_json::json!({"stage":"loading"}));if exit.is_none()&&status["stage"]=="ready"{status["stage"]=serde_json::json!("finishing");}if let Some(exit)=exit{if exit.success()&&job.dir.join("image.jpg").is_file(){status["stage"]=serde_json::json!("ready");}else{status["stage"]=serde_json::json!("error");if status["error"].as_str().map_or(true,|message|message.is_empty()){status["error"]=serde_json::json!("Image generation stopped unexpectedly. Details are saved in this image job’s job.log.");}}}status["path"]=serde_json::json!(job.dir.join("image.jpg"));Ok(status)}

#[tauri::command]pub fn image_generation_result(state:tauri::State<ImageGeneration>,job_id:String)->Result<tauri::ipc::Response,String>{let mut slot=state.0.lock().map_err(|e|e.to_string())?;let job=slot.as_mut().ok_or("No image job")?;if job.dir.to_string_lossy()!=job_id{return Err("Image job was replaced.".into());}if job.stopped||!job.child.try_wait().map_err(|e|e.to_string())?.is_some_and(|s|s.success()){return Err("Image is not ready.".into());}let path=job.dir.join("image.jpg");if fs::metadata(&path).map_err(|e|e.to_string())?.len()>10_000_000{return Err("Image is too large.".into());}Ok(tauri::ipc::Response::new(fs::read(path).map_err(|e|e.to_string())?))}

pub fn stop(state:&ImageGeneration)->Result<(),String>{let mut slot=state.0.lock().map_err(|e|e.to_string())?;if let Some(mut job)=slot.take(){job.stopped=true;drop(job);}Ok(())}

#[tauri::command]pub fn image_generation_stop(state:tauri::State<ImageGeneration>,job_id:String)->Result<(),String>{let mut slot=state.0.lock().map_err(|e|e.to_string())?;if slot.as_ref().is_some_and(|j|j.dir.to_string_lossy()==job_id){slot.take();}Ok(())}

#[cfg(test)]mod tests{use super::*;#[test]fn rejects_unsafe_requests(){let mut r=Request{model:"test.safetensors".into(),prompt:"cat".into(),negative:String::new(),width:512,height:512,steps:20,cfg:7.0,seed:42,cpu:true,character_reference:false,reference:None,reference_strength:None,reference_mask:None};assert!(validate(&r).is_ok());r.reference_strength=Some(0.1);assert!(validate(&r).is_err());r.reference_strength=Some(0.45);assert!(validate(&r).is_ok());r.reference=Some("data:text/html;base64,AAAA".into());assert!(validate(&r).is_err());r.reference=Some("data:image/jpeg;base64,/9j/AA==".into());assert!(validate(&r).is_ok());r.reference_mask=Some("not-a-mask".into());assert!(validate(&r).is_err());r.reference_mask=Some("data:image/jpeg;base64,/9j/AA==".into());assert!(validate(&r).is_ok());r.reference=None;assert!(validate(&r).is_err());r.reference_mask=None;r.model="../private.safetensors".into();assert!(validate(&r).is_err());r.model="test.safetensors".into();r.width=4096;assert!(validate(&r).is_err());}}

#[cfg(test)]mod header_tests{use super::*;#[test]fn classifies_tensor_layout_without_loading_weights(){

 let path=std::env::temp_dir().join(format!("mana-model-header-{}.safetensors",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));

 for (keys,kind) in [(vec!["cond_stage_model.transformer.test"],"sd1"),(vec!["conditioner.embedders.0.test"],"sdxl"),(vec!["model.diffusion_model.cap_embedder.0.weight","text_encoders.gemma2_2b.test"],"neta"),(vec!["unknown.tensor"],"unsupported")]{let value:serde_json::Map<String,serde_json::Value>=keys.into_iter().map(|k|(k.to_string(),serde_json::json!({}))).collect();let data=serde_json::to_vec(&value).unwrap();let mut bytes=(data.len() as u64).to_le_bytes().to_vec();bytes.extend(data);fs::write(&path,bytes).unwrap();assert_eq!(architecture(&path).unwrap(),kind);}

 fs::remove_file(path).unwrap();

}}

#[cfg(test)]mod qwen_tests{use super::*;#[test]fn qwen_bounds_and_reference_are_independent(){let mut r=Request{model:QWEN_MODEL.into(),prompt:"library".into(),negative:String::new(),width:1280,height:720,steps:4,cfg:1.0,seed:42,cpu:false,character_reference:true,reference:None,reference_strength:None,reference_mask:None};assert!(validate(&r).is_ok());r.cpu=true;assert!(validate(&r).is_err());r.cpu=false;r.height=1280;assert!(validate(&r).is_err());r.height=720;r.reference=Some("data:image/jpeg;base64,/9j/AA==".into());assert!(validate(&r).is_err());r.character_reference=false;assert!(validate(&r).is_ok());r.reference=None;r.character_reference=true;r.model="photon_v1.safetensors".into();assert!(validate(&r).is_err());}}

