from pathlib import Path
p=Path('src-tauri/src/image_generation.rs');s=p.read_text();at='#[derive(Default)]pub struct ImageGeneration'
constants=r'''const QWEN_MODEL:&str="Qwen-Rapid-AIO-SFW-v23.safetensors";
const SHARED:&str=r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Shared";
fn qwen_files()->serde_json::Value{let root=Path::new(SHARED).join("models");serde_json::json!({"model":root.join("diffusion_models").join(QWEN_MODEL),"clip":root.join("text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"),"vae":root.join("vae/qwen_image_vae.safetensors"),"lora":root.join("loras/modern-anime.safetensors")})}
fn qwen_ready()->bool{Path::new(PYTHON).is_file()&&qwen_files().as_object().unwrap().values().all(|p|p.as_str().is_some_and(|p|Path::new(p).is_file()))&&Path::new(COMFY).join("comfy_extras/nodes_qwen.py").is_file()}
fn qwen_reference()->PathBuf{Path::new(SHARED).join("input/Mana Turnaround Sheet.png")}
'''
s=s.replace(at,constants+at)
s=s.replace('models.sort_by_key(|m|', 'models.push(serde_json::json!({"name":QWEN_MODEL,"kind":"qwen"}));models.sort_by_key(|m|',1)
s=s.replace('"folder":CHECKPOINTS','"qwenReady":qwen_ready(),"qwenReferenceReady":qwen_reference().is_file(),"folder":CHECKPOINTS',1)
s=s.replace('pub cpu:bool,','pub cpu:bool,#[serde(default,rename="characterReference")]pub character_reference:bool,',1)
s=s.replace('r.width>1024||r.height>1024||r.width%64!=0||r.height%64!=0','!valid_dimensions(r)',1)
s=s.replace('fn validate(r:&Request)', '''fn valid_dimensions(r:&Request)->bool{let qwen=r.model==QWEN_MODEL;let limit=if qwen{1280}else{1024};let step=if qwen{16}else{64};r.width<=limit&&r.height<=limit&&r.width%step==0&&r.height%step==0&&(!qwen||r.width as u64*r.height as u64<=1_310_720)}
fn validate(r:&Request)''',1)
s=s.replace('fn validate(r:&Request)->Result<(),String>{', '''fn validate(r:&Request)->Result<(),String>{if r.model==QWEN_MODEL{if r.cpu{return Err("Qwen currently requires the NVIDIA GPU. Turn off Use CPU.".into());}if r.reference.is_some()||r.reference_mask.is_some(){return Err("Qwen uses its character sheet reference, not the clothing edit mask.".into());}}else if r.character_reference{return Err("Character sheet references require Qwen.".into());}''',1)
s=s.replace('let checkpoint=Path::new(CHECKPOINTS).join(&request.model);let kind=architecture(&checkpoint)?;', '''let is_qwen=request.model==QWEN_MODEL;let checkpoint=if is_qwen{Path::new(SHARED).join("models/diffusion_models").join(QWEN_MODEL)}else{Path::new(CHECKPOINTS).join(&request.model)};let kind=if is_qwen{"qwen"}else{architecture(&checkpoint)?};if is_qwen&&(!qwen_ready()||(request.character_reference&&!qwen_reference().is_file())){return Err("Qwen's local model files or Mana turnaround sheet are missing.".into());}''',1)
s=s.replace('if kind!="neta"&&!Path::new(ENGINE)', 'if kind!="neta"&&kind!="qwen"&&!Path::new(ENGINE)',1)
s=s.replace('if kind=="neta"{"neta"}else{"sd"}', 'if kind=="qwen"{"qwen"}else if kind=="neta"{"neta"}else{"sd"}',1)
s=s.replace('let input=dir.join("request.json");','''if is_qwen{payload["qwenFiles"]=qwen_files();if request.character_reference{payload["qwenReference"]=serde_json::json!(qwen_reference());}}let input=dir.join("request.json");''',1)
s=s.replace('cpu:true,reference:None','cpu:true,character_reference:false,reference:None')
p.write_text(s)

