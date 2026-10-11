use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
};
use tauri::Manager;
#[derive(Default)]
pub struct CustomVoice {
    server: Mutex<Option<Child>>,
    generation: Mutex<Option<Job>>,
}
struct Job {
    child: Child,
    result: PathBuf,
}
impl Drop for Job {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
        let _ = fs::remove_file(&self.result);
    }
}
fn stop_generation(state: &CustomVoice) -> Result<(), String> {
    state.generation.lock().map_err(|e| e.to_string())?.take();
    Ok(())
}
fn command(script: &str) -> Command {
    let mut cmd = Command::new("powershell.exe");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", script]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    cmd
}
fn validate_port(port: u16) -> Result<(), String> {
    if port < 1024 {
        Err("Use a local port above 1023.".into())
    } else {
        Ok(())
    }
}
fn kill(slot: &Mutex<Option<Child>>) -> Result<(), String> {
    if let Some(mut child) = slot.lock().map_err(|e| e.to_string())?.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}
pub fn stop_all(state: &CustomVoice) -> Result<(), String> {
    stop_generation(state)?;
    kill(&state.server)
}
#[tauri::command]
pub fn custom_voice_stop(state: tauri::State<CustomVoice>) -> Result<(), String> {
    stop_generation(&state)
}
#[tauri::command]
pub fn custom_voice_server_stop(state: tauri::State<CustomVoice>) -> Result<(), String> {
    stop_all(&state)
}
#[tauri::command]
pub fn custom_voice_server_start(
    app: tauri::AppHandle,
    state: tauri::State<CustomVoice>,
    python_path: String,
    repo_path: String,
    port: u16,
    gpt_path: String,
    sovits_path: String,
) -> Result<(), String> {
    validate_port(port)?;
    let repo = Path::new(&repo_path);
    for p in [&python_path, &gpt_path, &sovits_path] {
        if !Path::new(p).is_file() {
            return Err(format!("Missing voice file: {p}"));
        }
    }
    if !repo.join("api_v2.py").is_file() {
        return Err("Choose the GPT-SoVITS repository folder.".into());
    }
    let mut slot = state.server.lock().map_err(|e| e.to_string())?;
    if let Some(child) = slot.as_mut() {
        if child.try_wait().map_err(|e| e.to_string())?.is_none() {
            return Err("Managed voice service is already running.".into());
        }
    }
    slot.take();
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let config = dir.join("mana-tts-config.json");
    fs::write(&config,serde_json::to_vec(&serde_json::json!({"custom":{"device":"cpu","is_half":false,"version":"v2","bert_base_path":repo.join("GPT_SoVITS/pretrained_models/chinese-roberta-wwm-ext-large"),"cnhuhbert_base_path":repo.join("GPT_SoVITS/pretrained_models/chinese-hubert-base"),"t2s_weights_path":gpt_path,"vits_weights_path":sovits_path}})).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
    let log = fs::File::create(dir.join("custom-voice.log")).map_err(|e| e.to_string())?;
    let mut cmd = Command::new(python_path);
    cmd.env("PYTHONIOENCODING", "utf-8")
        .env("PYTHONUTF8", "1")
        .current_dir(repo)
        .arg(repo.join("api_v2.py"))
        .args(["-a", "127.0.0.1", "-p", &port.to_string(), "-c"])
        .arg(config)
        .stdout(Stdio::from(log.try_clone().map_err(|e| e.to_string())?))
        .stderr(Stdio::from(log));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    *slot = Some(cmd.spawn().map_err(|e| e.to_string())?);
    Ok(())
}
#[tauri::command]
pub fn custom_voice_generate(
    app: tauri::AppHandle,
    state: tauri::State<CustomVoice>,
    port: u16,
    text: String,
    reference_path: String,
    reference_text: String,
    reference_language: String,
    reply_language: String,
    rate: i32,
) -> Result<(), String> {
    validate_port(port)?;
    if !["en", "ja"].contains(&reference_language.as_str()) || !["en", "ja"].contains(&reply_language.as_str()) {
        return Err("Choose English or Japanese for reference and reply languages.".into());
    }
    if text.trim().is_empty()
        || text.len() > 8000
        || reference_text.len() > 6000
        || rate < -10
        || rate > 10
        || !Path::new(&reference_path).is_file()
    {
        return Err("Use an existing reference WAV and text under 8 KB.".into());
    }
    let mut slot = state.generation.lock().map_err(|e| e.to_string())?;
    if slot.is_some() {
        return Err("Voice generation is already active.".into());
    }
    let script = r#"$ErrorActionPreference='Stop';[Console]::InputEncoding=[System.Text.UTF8Encoding]::new();[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new();try{$p=[Console]::In.ReadToEnd()|ConvertFrom-Json;$body=@{text=$p.text;text_lang=$p.replyLanguage;ref_audio_path=$p.reference;prompt_text=$p.prompt;prompt_lang=$p.referenceLanguage;media_type='wav';streaming_mode=$false;speed_factor=$p.speed;text_split_method='cut5';batch_size=1;seed=42}|ConvertTo-Json -Compress;$r=Invoke-WebRequest -Uri ('http://127.0.0.1:'+$p.port+'/tts') -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 180 -UseBasicParsing;$data=$r.RawContentStream.ToArray();if($data.Length -gt 12000000){throw 'Audio exceeds 12 MB'};@{audio=[Convert]::ToBase64String($data);error=''}|ConvertTo-Json -Compress}catch{@{audio='';error='Voice generation failed. Start the local GPT-SoVITS service, check reference/transcript and custom-voice.log.'}|ConvertTo-Json -Compress}"#;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let result = dir.join("voice-result.json");
    let file = fs::File::create(&result).map_err(|e| e.to_string())?;
    let mut child = command(script)
        .stdin(Stdio::piped())
        .stdout(Stdio::from(file))
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;
    let input=serde_json::to_vec(&serde_json::json!({"port":port,"text":text,"reference":reference_path,"prompt":reference_text,"referenceLanguage":reference_language,"replyLanguage":reply_language,"speed":(1.0+rate as f32*0.04).clamp(0.6,1.4)})).map_err(|e|e.to_string())?;
    if let Err(e) = child
        .stdin
        .take()
        .ok_or("Voice stdin unavailable".to_string())
        .and_then(|mut stream| stream.write_all(&input).map_err(|e| e.to_string()))
    {
        let _ = child.kill();
        let _ = child.wait();
        return Err(e);
    }
    *slot = Some(Job { child, result });
    Ok(())
}
#[tauri::command]
pub fn custom_voice_poll(state: tauri::State<CustomVoice>) -> Result<serde_json::Value, String> {
    let mut slot = state.generation.lock().map_err(|e| e.to_string())?;
    let child = slot.as_mut().ok_or("Voice generation stopped.")?;
    if child.child.try_wait().map_err(|e| e.to_string())?.is_none() {
        return Ok(serde_json::json!({"done":false}));
    }
    let job = slot.take().unwrap();
    if fs::metadata(&job.result).map_err(|e| e.to_string())?.len() > 16001000 {
        return Err("Voice response exceeds limit.".into());
    }
    let bytes = fs::read(&job.result).map_err(|e| e.to_string())?;
    let mut result: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|_| "Voice service returned an invalid response.".to_string())?;
    result["done"] = serde_json::json!(true);
    Ok(result)
}
#[tauri::command]
pub async fn custom_voice_check(port: u16) -> Result<(), String> {
    validate_port(port)?;
    tauri::async_runtime::spawn_blocking(move||{let script=format!("$ErrorActionPreference='Stop';$r=Invoke-RestMethod 'http://127.0.0.1:{port}/openapi.json' -TimeoutSec 3;if(-not $r.paths.'/tts'){{throw 'Not a GPT-SoVITS service'}}");let result=command(&script).stdout(Stdio::null()).stderr(Stdio::null()).status().map_err(|e|e.to_string())?;if result.success(){Ok(())}else{Err("Voice service is not ready.".into())}}).await.map_err(|e|e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn port_is_loopback_service_range() {
        assert!(validate_port(80).is_err());
        assert!(validate_port(1024).is_ok());
        assert!(validate_port(65535).is_ok());
    }
    #[cfg(windows)]
    #[test]
    fn large_result_uses_file_and_cleanup_removes_it() {
        let path =
            std::env::temp_dir().join(format!("mana-voice-test-{}.json", std::process::id()));
        let output = fs::File::create(&path).unwrap();
        let child = command("[Console]::Out.Write('A'*100000)")
            .stdout(Stdio::from(output))
            .spawn()
            .unwrap();
        let mut job = Job {
            child,
            result: path.clone(),
        };
        assert!(job.child.wait().unwrap().success());
        assert_eq!(fs::metadata(&path).unwrap().len(), 100000);
        drop(job);
        assert!(!path.exists());
    }
}
