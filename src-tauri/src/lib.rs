use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

mod avatar_files;
mod character;
mod store;
mod conversation_export;
mod game_export;
mod image_generation;
mod outfit_prototype;
mod generated_outfits;
mod wearable_reviews;
mod gallery;
mod speech;
mod dictation;
mod whisper;
mod lyrics;
mod vision;
mod custom_voice;
mod singing;
mod memory_embeddings;
mod web_search;

#[tauri::command]
fn export_conversation(content: String) -> Result<String, String> {
    conversation_export::write(Path::new(r"C:\AI\ManaAI-CV-2\exports\conversations"), &content)
}

#[tauri::command]
fn export_diary(content: String) -> Result<String, String> {
    conversation_export::write_named(Path::new(r"C:\AI\ManaAI-CV-2\exports\diary"), &content, "Mana-diary")
}

#[tauri::command]
fn export_activity(content: String) -> Result<String, String> {
    conversation_export::write_named(Path::new(r"C:\AI\ManaAI-CV-2\exports\activities"), &content, "Mana-activity")
}

#[tauri::command]
fn export_work(content: String) -> Result<String, String> {
    conversation_export::write_named(Path::new(r"C:\AI\ManaAI-CV-2\exports\work"), &content, "Mana-work")
}

#[tauri::command]
fn export_game(content:String)->Result<String,String>{
    game_export::write(Path::new(r"C:\AI\ManaAI-CV-2\exports\games"),&content)
}

#[tauri::command]
fn export_playtest(content: String) -> Result<String, String> {
    conversation_export::write_named(Path::new(r"C:\AI\ManaAI-CV-2\exports\playtests"), &content, "Mana-playtest")
}

#[tauri::command]
fn initialize_store(
    app: tauri::AppHandle,
    state: tauri::State<store::Store>,
    legacy: std::collections::BTreeMap<String, String>,
) -> Result<std::collections::BTreeMap<String, String>, String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    if slot.is_none() {
        let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        *slot = Some(store::open(&dir.join("mana.sqlite3"))?);
    }
    store::initialize(slot.as_mut().unwrap(), &legacy)
}

#[tauri::command]
fn save_store(
    state: tauri::State<store::Store>,
    values: std::collections::BTreeMap<String, String>,
) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    store::save(
        slot.as_mut().ok_or("Database has not been initialized")?,
        &values,
    )
}

const BACKUP_MAX_BYTES: usize = 256_000_000;

#[tauri::command]
fn write_backup_file(path: String, content: String) -> Result<(), String> {
    use std::io::Write;
    if content.len() > BACKUP_MAX_BYTES {
        return Err("Backup exceeds 256 MB".into());
    }
    let value: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    if value["format"] != "mana-backup" || value["version"] != 1 {
        return Err("Invalid backup format".into());
    }
    // Never silently overwrite another backup or an unrelated file.
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes())
        .map_err(|e| e.to_string())?;
    file.sync_all().map_err(|e| e.to_string())
}
#[tauri::command]
fn read_backup_file(path: String) -> Result<String, String> {
    use std::io::Read;
    let file = File::open(path).map_err(|e| e.to_string())?;
    if file.metadata().map_err(|e| e.to_string())?.len() > BACKUP_MAX_BYTES as u64 {
        return Err("Backup exceeds 256 MB".into());
    }
    let mut content = String::new();
    file.take(BACKUP_MAX_BYTES as u64 + 1)
        .read_to_string(&mut content)
        .map_err(|e| e.to_string())?;
    if content.len() > BACKUP_MAX_BYTES {
        return Err("Backup exceeds 256 MB".into());
    }
    Ok(content)
}

#[tauri::command]
async fn portable_backup(app: tauri::AppHandle, operation: String, path: String, content: Option<String>, model: Option<bool>, avatars: Option<bool>, vision: Option<bool>, runtime: Option<bool>, developer: Option<bool>, whisper: Option<bool>, checksum: Option<String>) -> Result<serde_json::Value, String> {
    use std::io::Write;
    use std::process::{Command, Stdio};
    if !matches!(operation.as_str(), "export"|"inspect"|"restore")
        || !std::path::Path::new(&path).extension().and_then(|v|v.to_str()).is_some_and(|v|v.eq_ignore_ascii_case("zip"))
        || content.as_ref().is_some_and(|value|value.len()>BACKUP_MAX_BYTES)
    {
        return Err("Choose a Mana portable ZIP backup under the metadata limit.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let app_data=app.path().app_data_dir().map_err(|e|e.to_string())?;
        let gallery=app_data.join("gallery");
        let exe=std::env::current_exe().map_err(|e|e.to_string())?;
        let conventional=Path::new(r"C:\AI\ManaAI-CV-2");
        let workspace=exe.ancestors()
            .find(|dir|dir.join("src-tauri/tauri.conf.json").is_file()&&dir.join("scripts/portable_backup.py").is_file())
            .or_else(||conventional.is_dir().then_some(conventional))
            .unwrap_or(&app_data);
        let script=app.path().resolve("scripts/portable_backup.py",tauri::path::BaseDirectory::Resource)
            .ok().filter(|p|p.is_file()).unwrap_or_else(||workspace.join("scripts/portable_backup.py"));
        let python=workspace.join("data/music-tools/Scripts/python.exe");
        let mut command=Command::new(if python.is_file(){python}else{PathBuf::from("python.exe")});
        command.arg(script).arg(operation).arg(path).arg(workspace).arg(gallery)
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
        #[cfg(windows)] { use std::os::windows::process::CommandExt; command.creation_flags(0x08000000); }
        let mut worker=command.spawn().map_err(|e|format!("Could not start Mana's local backup helper: {e}"))?;
        let request=serde_json::to_vec(&serde_json::json!({"content":content,"model":model.unwrap_or(false),"avatars":avatars.unwrap_or(false),"vision":vision.unwrap_or(false),"runtime":runtime.unwrap_or(false),"developer":developer.unwrap_or(false),"whisper":whisper.unwrap_or(false),"checksum":checksum})).map_err(|e|e.to_string())?;
        worker.stdin.take().ok_or("Cannot open backup helper input.")?.write_all(&request).map_err(|e|e.to_string())?;
        let output=worker.wait_with_output().map_err(|e|e.to_string())?;
        if !output.status.success(){return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());}
        serde_json::from_slice(&output.stdout).map_err(|e|e.to_string())
    }).await.map_err(|e|e.to_string())?
}

#[tauri::command]
fn restore_backup_store(
    app: tauri::AppHandle,
    state: tauri::State<store::Store>,
    values: std::collections::BTreeMap<String, String>,
    safety_content: String,
) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    restore_with_safety(
        slot.as_mut().ok_or("Database has not been initialized")?,
        &values,
        &dir,
        safety_content,
    )
}
fn restore_with_safety(
    connection: &mut rusqlite::Connection,
    values: &std::collections::BTreeMap<String, String>,
    dir: &Path,
    safety_content: String,
) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let path = dir.join(format!("before-restore-{stamp}.json"));
    write_backup_file(path.to_string_lossy().into_owned(), safety_content)?;
    store::save(connection, values)
}

#[tauri::command]
fn list_safety_backups(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut paths = Vec::new();
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with("before-restore-")
            && name.ends_with(".json")
            && entry.file_type().map_err(|e| e.to_string())?.is_file()
        {
            paths.push(entry.path().to_string_lossy().into_owned());
        }
    }
    paths.sort();
    paths.reverse();
    paths.truncate(20);
    Ok(paths)
}

#[cfg(test)]
mod backup_file_tests {
    use super::{read_backup_file, restore_with_safety, store, write_backup_file, BACKUP_MAX_BYTES};
    struct Temp(std::path::PathBuf);
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }
    fn temp() -> Temp {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path =
            std::env::temp_dir().join(format!("mana-backup-test-{}-{stamp}", std::process::id()));
        std::fs::create_dir_all(&path).unwrap();
        Temp(path)
    }
    #[test]
    fn backup_files_roundtrip_without_overwriting_existing_content() {
        let dir = temp();
        let path = dir.0.join("copy.json").to_string_lossy().into_owned();
        let content = r#"{"format":"mana-backup","version":1,"data":{"message":"ä½ å¥½"}}"#;
        write_backup_file(path.clone(), content.into()).unwrap();
        assert_eq!(read_backup_file(path.clone()).unwrap(), content);
        assert!(write_backup_file(
            path.clone(),
            r#"{"format":"mana-backup","version":1}"#.into()
        )
        .is_err());
        assert_eq!(read_backup_file(path).unwrap(), content);
    }
    #[test]
    fn large_backup_passes_the_native_file_boundary() {
        let dir = temp();
        let path = dir.0.join("large.json").to_string_lossy().into_owned();
        let payload = serde_json::json!({"format":"mana-backup","version":1,"data":{"artwork":"A".repeat(21_000_000)}}).to_string();
        write_backup_file(path.clone(), payload.clone()).unwrap();
        assert_eq!(read_backup_file(path).unwrap(),payload);
    }

    #[test]
    fn malformed_and_oversize_files_are_rejected() {
        let dir = temp();
        let path = dir.0.join("bad.json").to_string_lossy().into_owned();
        assert!(write_backup_file(path.clone(), "invalid".into()).is_err());
        assert!(!std::path::Path::new(&path).exists());
        std::fs::File::create(&path).unwrap().set_len(BACKUP_MAX_BYTES as u64 + 1).unwrap();
        assert!(read_backup_file(path).is_err());
    }
    #[test]
    fn restore_retains_safety_copy_and_does_not_replace_data_on_validation_failure() {
        let dir = temp();
        let mut db = store::open(&dir.0.join("data.sqlite3")).unwrap();
        let original = std::collections::BTreeMap::from([("mana.chat.v1".into(), "[]".into())]);
        store::save(&mut db, &original).unwrap();
        let safety = r#"{"format":"mana-backup","version":1,"data":{"mana.chat.v1":[]}}"#;
        let invalid = std::collections::BTreeMap::from([("unknown".into(), "[]".into())]);
        let backups = dir.0.join("backups");
        assert!(restore_with_safety(&mut db, &invalid, &backups, safety.into()).is_err());
        let snapshot = std::fs::read_dir(&backups)
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        assert_eq!(std::fs::read_to_string(snapshot).unwrap(), safety);
        assert_eq!(
            store::initialize(&mut db, &Default::default()).unwrap()["mana.chat.v1"],
            "[]"
        );
        // If writing the safety copy fails, valid replacement data is still not applied.
        let file_path = dir.0.join("not-a-directory");
        std::fs::write(&file_path, "occupied").unwrap();
        let replacement = std::collections::BTreeMap::from([("mana.chat.v1".into(), "[1]".into())]);
        assert!(restore_with_safety(&mut db, &replacement, &file_path, safety.into()).is_err());
        assert_eq!(
            store::initialize(&mut db, &Default::default()).unwrap()["mana.chat.v1"],
            "[]"
        );
    }
}

/// Holds the llama-server child process (if we started one).
#[derive(Default)]
struct LlamaState(Mutex<Option<Child>>);

/// llama-server output goes here so we can show it when something breaks.
fn log_path() -> PathBuf {
    std::env::temp_dir().join("mana-llama.log")
}

fn kill_child(slot: &mut Option<Child>) {
    if let Some(mut child) = slot.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[tauri::command]
fn start_llama(
    state: tauri::State<LlamaState>,
    exe_path: String,
    model_path: String,
    port: u16,
    ctx_size: u32,
    gpu_layers: i32,
) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;

    // Already running? Nothing to do.
    if let Some(child) = slot.as_mut() {
        if let Ok(None) = child.try_wait() {
            return Ok(());
        }
    }
    *slot = None;

    if !Path::new(&exe_path).is_file() {
        return Err(format!("llama-server not found at: {exe_path}"));
    }
    if !Path::new(&model_path).is_file() {
        return Err(format!("Model file not found at: {model_path}"));
    }

    let log = File::create(log_path()).map_err(|e| format!("Could not create log file: {e}"))?;
    let log_err = log.try_clone().map_err(|e| e.to_string())?;

    let mut cmd = Command::new(&exe_path);
    cmd.arg("-m")
        .arg(&model_path)
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg(port.to_string())
        .arg("-c")
        .arg(ctx_size.to_string())
        .arg("-ngl")
        .arg(gpu_layers.to_string())
        .arg("--jinja")
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(log_err));

    // Run from the exe's folder so it finds its CUDA DLLs.
    if let Some(dir) = Path::new(&exe_path).parent() {
        cmd.current_dir(dir);
    }

    // Don't pop up a console window on Windows.
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Could not start llama-server: {e}"))?;
    *slot = Some(child);
    Ok(())
}

#[tauri::command]
fn stop_llama(state: tauri::State<LlamaState>) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    kill_child(&mut *slot);
    Ok(())
}

#[tauri::command]
fn pause_llama_for_image(state: tauri::State<LlamaState>) -> Result<bool, String> {
    let mut slot=state.0.lock().map_err(|e|e.to_string())?;
    let Some(child)=slot.as_mut() else{return Ok(false);};
    if child.try_wait().map_err(|e|e.to_string())?.is_some(){slot.take();return Ok(false);}
    child.kill().map_err(|e|format!("Could not pause Mana's chat model: {e}"))?;
    child.wait().map_err(|e|format!("Could not wait for chat model to exit: {e}"))?;
    slot.take();Ok(true)
}

#[tauri::command]
fn llama_running(state: tauri::State<LlamaState>) -> bool {
    match state.0.lock() {
        Ok(mut slot) => match slot.as_mut() {
            Some(child) => matches!(child.try_wait(), Ok(None)),
            None => false,
        },
        Err(_) => false,
    }
}

#[tauri::command]
fn llama_log_tail() -> String {
    let data = std::fs::read(log_path()).unwrap_or_default();
    let start = data.len().saturating_sub(3000);
    String::from_utf8_lossy(&data[start..]).to_string()
}

/// Lists every image under the avatar folder as relative paths ("eyes/eye_happy.png").
#[tauri::command]
async fn scan_avatar(app: tauri::AppHandle, dir: String) -> Result<Vec<String>, String> {
    let mut files=avatar_files::scan(&avatar_dir(&app,&dir)?)?;
    let library=outfit_prototype::library_root(&app)?;
    if library.is_dir(){files.extend(avatar_files::scan(&library)?.into_iter().filter(|p|outfit_prototype::imported_item(p)));}
    files.sort();files.dedup();Ok(files)
}

fn avatar_dir(app: &tauri::AppHandle, dir: &str) -> Result<PathBuf, String> {
    if !dir.trim().is_empty() {
        return Ok(PathBuf::from(dir));
    }
    app.path()
        .resolve("assets/avatar", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Could not locate the bundled avatar: {e}"))
}

/// Returns the raw bytes of one avatar image (only image files, only inside the folder).
#[tauri::command]
async fn read_avatar_image(
    app: tauri::AppHandle,
    dir: String,
    rel: String,
) -> Result<tauri::ipc::Response, String> {
    let library=outfit_prototype::library_root(&app)?;
    let bytes=if outfit_prototype::imported_item(&rel)&&library.join(&rel).is_file(){avatar_files::read(&library,&rel)?}else{avatar_files::read(&avatar_dir(&app,&dir)?,&rel)?};
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(LlamaState::default())
        .manage(memory_embeddings::MemoryEmbeddings::default())
        .manage(store::Store::default())
        .manage(speech::Speech::default())
        .manage(dictation::Dictation::default())
        .manage(whisper::Whisper::default())
        .manage(lyrics::Lyrics::default())
        .manage(vision::Vision::default())
        .manage(custom_voice::CustomVoice::default())
        .manage(singing::Singing::default())
        .manage(image_generation::ImageGeneration::default())
        .setup(|app| {
            if let (Some(window),Some(icon))=(app.get_webview_window("main"),app.default_window_icon()) {window.set_icon(icon.clone())?;}
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            gallery::gallery_write,
            gallery::gallery_read,
            gallery::gallery_remove,
            gallery::gallery_folder,
            gallery::gallery_preserve_legacy,
            image_generation::image_generation_discover,
            image_generation::image_generation_start,
            image_generation::outfit_generation_start,
            wearable_reviews::wearable_reviews_list,
            wearable_reviews::wearable_reviews_manage,
            wearable_reviews::wearable_reviews_save,
            wearable_reviews::wearable_reviews_image,
            wearable_reviews::wearable_reviews_open,
            wearable_reviews::wearable_reviews_approve,
            wearable_reviews::wearable_reviews_dismiss,
            generated_outfits::generated_outfits_list,
            generated_outfits::generated_outfits_idea_history,
            generated_outfits::generated_outfits_image,
            generated_outfits::generated_outfits_preview,
            generated_outfits::generated_outfits_rename,
            generated_outfits::generated_outfits_annotate,
            generated_outfits::generated_outfits_duplicate,
            generated_outfits::generated_outfits_refit,
            generated_outfits::generated_outfits_submit,
            generated_outfits::generated_outfits_approve,
            generated_outfits::generated_outfits_update,
            generated_outfits::generated_outfits_project,
            generated_outfits::generated_outfits_recoverable,
            generated_outfits::generated_outfits_recover,
            generated_outfits::generated_outfits_dismiss,
            generated_outfits::generated_outfits_mode,
            generated_outfits::generated_outfits_schedule,
            generated_outfits::wearable_creation_schedule,
            generated_outfits::wearable_creation_claim,
            generated_outfits::wearable_creation_result,
            generated_outfits::generated_outfits_schedule_claim,
            generated_outfits::generated_outfits_schedule_result,
            image_generation::image_generation_poll,
            image_generation::image_generation_result,
            outfit_prototype::outfit_prototype_export,
            outfit_prototype::outfit_wardrobe_save,
            outfit_prototype::outfit_wardrobe_project,
            outfit_prototype::atelier_item_save,
            outfit_prototype::atelier_item_export,
            outfit_prototype::atelier_project_export,
            image_generation::image_generation_stop,
            singing::singing_start,
            singing::singing_poll,
            singing::singing_stop,
            singing::singing_audio,
            singing::singing_import_track,
            singing::singing_library,
            singing::singing_excerpt,
            singing::singing_save_mix,
            singing::singing_band_mix,
            singing::singing_export,
            singing::arrangement_start,
            singing::builder_notes_read,
            singing::original_song_start,
            singing::arrangement_validate,
            custom_voice::custom_voice_server_start,
            custom_voice::custom_voice_server_stop,
            custom_voice::custom_voice_generate,
            custom_voice::custom_voice_poll,
            custom_voice::custom_voice_stop,
            custom_voice::custom_voice_check,
            vision::vision_start,
            vision::vision_detect_model,
            vision::vision_stop,
            vision::vision_running,
            lyrics::lyrics_start,
            lyrics::lyrics_poll,
            lyrics::lyrics_stop,
            whisper::whisper_check,
            whisper::whisper_start,
            whisper::whisper_poll,
            whisper::whisper_stop,
            dictation::dictation_languages,
            dictation::dictation_start,
            dictation::dictation_stop,
            dictation::dictation_poll,
            speech::speech_voices,
            speech::speech_speak,
            speech::speech_stop,
            speech::speech_running,
            start_llama,
            stop_llama,
            memory_embeddings::memory_embeddings,
            web_search::search_web,
            web_search::open_web_source,
            pause_llama_for_image,
            llama_running,
            llama_log_tail,
            scan_avatar,
            read_avatar_image,
            initialize_store,
            save_store,
            write_backup_file,
            portable_backup,
            export_conversation,
            export_diary,
            export_activity,
            export_work,
            export_game,
            export_playtest,
            read_backup_file,
            restore_backup_store,
            list_safety_backups
        ])
        .build(tauri::generate_context!())
        .expect("error while building Mana")
        .run(|app, event| {
            // Make sure llama-server never outlives the app.
            if let tauri::RunEvent::Exit = event {
                if let Some(state)=app.try_state::<memory_embeddings::MemoryEmbeddings>(){state.stop();}
                if let Some(state)=app.try_state::<image_generation::ImageGeneration>(){let _=image_generation::stop(&state);}
                if let Some(state)=app.try_state::<singing::Singing>(){let _=singing::stop(&state);}
                if let Some(state)=app.try_state::<custom_voice::CustomVoice>(){let _=custom_voice::stop_all(&state);}
                if let Some(state) = app.try_state::<vision::Vision>() { let _ = vision::stop(&state); }
                if let Some(state) = app.try_state::<lyrics::Lyrics>() { let _ = lyrics::stop(&state); }
                if let Some(state) = app.try_state::<whisper::Whisper>() { let _ = whisper::stop(&state); }
                if let Some(state) = app.try_state::<dictation::Dictation>() { let _ = dictation::stop(&state); }
                if let Some(state) = app.try_state::<speech::Speech>() { let _ = speech::stop(&state); }
                if let Some(state) = app.try_state::<LlamaState>() {
                    if let Ok(mut slot) = state.0.lock() {
                        kill_child(&mut *slot);
                    }
                }
            }
        });
}
