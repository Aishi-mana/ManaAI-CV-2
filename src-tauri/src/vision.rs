use std::process::{Child,Command,Stdio};
use std::sync::Mutex;
use tauri::Manager;
#[derive(Default)]
pub struct Vision(pub Mutex<Option<Child>>);
#[tauri::command]
pub fn vision_detect_model()->Option<serde_json::Value>{
 let root=std::path::PathBuf::from(std::env::var_os("USERPROFILE")?).join("Downloads").join("AI models");
 let model=root.join("Qwen3-VL-8B-Instruct-Q4_K_M.gguf");let projector=root.join("mmproj-Qwen3-VL-8B-Instruct-F16.gguf");
 if model.is_file()&&projector.is_file(){Some(serde_json::json!({"modelPath":model,"projectorPath":projector}))}else{None}
}
pub fn stop(state:&Vision)->Result<(),String>{if let Some(mut child)=state.0.lock().map_err(|e|e.to_string())?.take(){let _=child.kill();let _=child.wait();}Ok(())}
#[tauri::command]
pub fn vision_stop(state:tauri::State<Vision>)->Result<(),String>{stop(&state)}
#[tauri::command]
pub fn vision_running(state:tauri::State<Vision>)->Result<bool,String>{
 let mut slot=state.0.lock().map_err(|e|e.to_string())?;
 if let Some(child)=slot.as_mut(){if child.try_wait().map_err(|e|e.to_string())?.is_none(){return Ok(true);}}
 *slot=None;Ok(false)
}
#[tauri::command]
pub fn vision_start(app:tauri::AppHandle,state:tauri::State<Vision>,exe_path:String,model_path:String,projector_path:String,port:u16,gpu_layers:u32)->Result<(),String>{
 if port<1024||gpu_layers>999{return Err("Invalid vision port or GPU layers.".into());}
 for (label,path) in [("llama-server",&exe_path),("Vision model",&model_path),("Projector",&projector_path)]{if !std::path::Path::new(path).is_file(){return Err(format!("{label} file not found: {path}"));}}
 let mut slot=state.0.lock().map_err(|e|e.to_string())?;
 if let Some(child)=slot.as_mut(){if child.try_wait().map_err(|e|e.to_string())?.is_none(){return Err("Stop the current vision model before starting another.".into());}}
 let path=app.path().app_data_dir().map_err(|e|e.to_string())?;std::fs::create_dir_all(&path).map_err(|e|e.to_string())?;
 let log=std::fs::File::create(path.join("vision-server.log")).map_err(|e|e.to_string())?;let err=log.try_clone().map_err(|e|e.to_string())?;
 let mut cmd=Command::new(&exe_path);
 cmd.args(["-m",&model_path,"--mmproj",&projector_path,"--host","127.0.0.1","--port",&port.to_string(),"-c","8192","-ngl",&gpu_layers.to_string(),"--jinja"]).stdout(Stdio::from(log)).stderr(Stdio::from(err));
 if gpu_layers==0 {cmd.arg("--no-mmproj-offload");}
 if let Some(parent)=std::path::Path::new(&exe_path).parent(){cmd.current_dir(parent);}
 #[cfg(windows)]{use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
 *slot=Some(cmd.spawn().map_err(|e|format!("Could not start vision: {e}"))?);Ok(())
}
