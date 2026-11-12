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
    converter: Mutex<Option<Child>>,
    trained_generation: Mutex<Option<PathBuf>>,
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
    let result = state.trained_generation.lock().map_err(|e|e.to_string())?.take();
    if let Some(result) = result {
        kill(&state.converter)?;
        let _=fs::remove_file(result.with_extension("tmp"));
        let _=fs::remove_file(result);
    }
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
fn english_speech_text(text: &str, language: &str) -> String {
    if language == "en" {
        // GPT-SoVITS strips these characters rather than preserving contractions.
        text.replace(['\u{2018}', '\u{2019}', '\u{02bc}', '\u{ff07}'], "'")
    } else {
        text.to_owned()
    }
}
pub(crate) fn trained_voice_selection(profile: Option<&str>, legacy: bool) -> Result<bool,String> {
    match profile {
        Some("mana-trained-v1" | "mousey-trained-v2")=>Ok(true),
        Some("mana-reference")=>Ok(false),
        Some(_)=>Err("This voice profile is not installed.".into()),
        None=>Ok(legacy),
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
    kill(&state.converter)?;
    kill(&state.server)
}
impl Drop for CustomVoice {
    fn drop(&mut self) { let _=stop_all(self); }
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
    trained_voice: Option<bool>,
    voice_profile: Option<String>,
) -> Result<(), String> {
    validate_port(port)?;
    let trained_voice=trained_voice_selection(voice_profile.as_deref(),trained_voice.unwrap_or(false))?;
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
    if state.trained_generation.lock().map_err(|e|e.to_string())?.is_some() {
        return Err("Voice generation is already active.".into());
    }
    if trained_voice && reply_language == "en" {
        let root=Path::new("C:/AI/ManaAI-CV-2");
        let python=root.join("data/music-tools/Scripts/python.exe");
        if !python.is_file() {return Err("Trained voice runtime is missing. Turn off Use trained Mana voice to use the reference voice.".into());}
        let dir=app.path().app_data_dir().map_err(|e|e.to_string())?;
        fs::create_dir_all(&dir).map_err(|e|e.to_string())?;
        let script=app.path().resolve("scripts/trained_chat_worker.py",tauri::path::BaseDirectory::Resource)
            .ok().filter(|p|p.is_file()).unwrap_or_else(||root.join("scripts/trained_chat_worker.py"));
        let mut worker=state.converter.lock().map_err(|e|e.to_string())?;
        if worker.as_mut().map(|c|c.try_wait()).transpose().map_err(|e|e.to_string())?.flatten().is_some() {
            worker.take();
        }
        if worker.is_none() {
            let log=fs::OpenOptions::new().create(true).append(true).open(dir.join("trained-chat.log")).map_err(|e|e.to_string())?;
            let mut cmd=Command::new(python);
            cmd.arg(script).arg(root).arg(&dir).env("HF_HUB_OFFLINE","1").env("TRANSFORMERS_OFFLINE","1")
                .env("PYTHONIOENCODING","utf-8").env("PYTHONUNBUFFERED","1")
                .stdin(Stdio::piped()).stdout(Stdio::from(log.try_clone().map_err(|e|e.to_string())?)).stderr(Stdio::from(log));
            #[cfg(windows)] {use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
            *worker=Some(cmd.spawn().map_err(|e|e.to_string())?);
        }
        let id=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();
        let result=dir.join(format!("trained-voice-{id}.json"));
        let mut input=serde_json::to_vec(&serde_json::json!({"voiceProfile":voice_profile.as_deref().unwrap_or("mana-trained-v1"),"port":port,"text":english_speech_text(&text,&reply_language),"reference":reference_path,"prompt":english_speech_text(&reference_text,&reference_language),"referenceLanguage":reference_language,"replyLanguage":reply_language,"speed":(1.0+rate as f32*0.04).clamp(0.6,1.4),"result":result})).map_err(|e|e.to_string())?;
        input.push(b'\n');
        let written=worker.as_mut().and_then(|c|c.stdin.as_mut()).ok_or("Trained voice worker is unavailable.")
            .and_then(|stream|stream.write_all(&input).map_err(|_|"Trained voice worker stopped."));
        if let Err(error)=written {
            if let Some(mut child)=worker.take(){let _=child.kill();let _=child.wait();}
            return Err(error.into());
        }
        *state.trained_generation.lock().map_err(|e|e.to_string())?=Some(result);
        return Ok(());
    }
    // Opting out releases the idle trained model; the original route stays available.
    kill(&state.converter)?;
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
    let input=serde_json::to_vec(&serde_json::json!({"voiceProfile":voice_profile.as_deref().unwrap_or("mana-trained-v1"),"port":port,"text":english_speech_text(&text,&reply_language),"reference":reference_path,"prompt":english_speech_text(&reference_text,&reference_language),"referenceLanguage":reference_language,"replyLanguage":reply_language,"speed":(1.0+rate as f32*0.04).clamp(0.6,1.4)})).map_err(|e|e.to_string())?;
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
    let trained=state.trained_generation.lock().map_err(|e|e.to_string())?.clone();
    if let Some(result)=trained {
        if !result.is_file() {
            let mut worker=state.converter.lock().map_err(|e|e.to_string())?;
            let alive=match worker.as_mut(){Some(child)=>child.try_wait().map_err(|e|e.to_string())?.is_none(),None=>false};
            if alive{return Ok(serde_json::json!({"done":false}));}
            state.trained_generation.lock().map_err(|e|e.to_string())?.take();
            return Err("Trained voice worker stopped. Retry, or turn off Use trained Mana voice in Voice setup.".into());
        }
        state.trained_generation.lock().map_err(|e|e.to_string())?.take();
        let response=(||{
            if fs::metadata(&result).map_err(|e|e.to_string())?.len()>16001000{return Err("Voice response exceeds limit.".to_string());}
            let mut value:serde_json::Value=serde_json::from_slice(&fs::read(&result).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
            value["done"]=serde_json::json!(true);
            Ok(value)
        })();
        let _=fs::remove_file(result);
        return response;
    }
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
    fn english_contractions_reach_tts_with_apostrophes_intact() {
        assert_eq!(english_speech_text("I’m glad you’re here. I can’t find Aishi’s book.", "en"),
                   "I'm glad you're here. I can't find Aishi's book.");
        assert_eq!(english_speech_text("Iʼm here; I＇ll wait.", "en"), "I'm here; I'll wait.");
        assert_eq!(english_speech_text("I'm here.", "en"), "I'm here.");
        assert_eq!(english_speech_text("日本語 ‘そのまま’", "ja"), "日本語 ‘そのまま’");
    }
    #[test]
    fn port_is_loopback_service_range() {
        assert!(validate_port(80).is_err());
        assert!(validate_port(1024).is_ok());
        assert!(validate_port(65535).is_ok());
    }
    #[test]
    fn selected_voice_wins_over_legacy_toggle_and_unknown_profiles_do_not_run() {
        assert!(!trained_voice_selection(Some("mana-reference"),true).unwrap());
        assert!(trained_voice_selection(Some("mana-trained-v1"),false).unwrap());
        assert!(trained_voice_selection(Some("mousey-trained-v2"),false).unwrap());
        assert!(!trained_voice_selection(None,false).unwrap());
        assert!(trained_voice_selection(Some("not-installed"),true).is_err());
    }
    #[cfg(windows)]
    #[test]
    fn trained_worker_stays_warm_until_active_request_is_cancelled() {
        let state=CustomVoice::default();
        *state.converter.lock().unwrap()=Some(command("Start-Sleep -Seconds 30").stdout(Stdio::null()).spawn().unwrap());
        stop_generation(&state).unwrap();
        assert!(state.converter.lock().unwrap().as_mut().unwrap().try_wait().unwrap().is_none());
        let path=std::env::temp_dir().join(format!("trained-voice-cancel-{}.json",std::process::id()));
        fs::write(&path,"pending").unwrap();
        *state.trained_generation.lock().unwrap()=Some(path.clone());
        stop_generation(&state).unwrap();
        assert!(state.converter.lock().unwrap().is_none());
        assert!(state.trained_generation.lock().unwrap().is_none());
        assert!(!path.exists());
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
