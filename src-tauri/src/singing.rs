use std::{
    fs,
    io::{Read, Seek, SeekFrom, Write},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
};
use tauri::Manager;
#[derive(Default)]
pub struct Singing(pub Mutex<Option<Job>>);
pub struct Job {
    child: Child,
    dir: PathBuf,
}
impl Drop for Job {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
pub fn stop(state: &Singing) -> Result<(), String> {
    state.0.lock().map_err(|e| e.to_string())?.take();
    Ok(())
}
#[tauri::command]
pub fn singing_stop(state: tauri::State<Singing>) -> Result<(), String> {
    stop(&state)
}
#[tauri::command]
pub fn singing_start(
    app: tauri::AppHandle,
    state: tauri::State<Singing>,
    python: String,
    repo: String,
    source: String,
    reference: String,
    start: f64,
    seconds: f64,
    separate: bool,
    backing_gain: f64,
    whole_song: Option<bool>,
) -> Result<(), String> {
    if !backing_gain.is_finite() || !(0.0..=1.0).contains(&backing_gain) {
        return Err("Backing volume must be between 0 and 1.".into());
    }
    let whole_song = whole_song.unwrap_or(false);
    if !whole_song && (!start.is_finite()
        || !seconds.is_finite()
        || start < 0.0
        || start > 3600.0
        || !(1.0..=60.0).contains(&seconds))
    {
        return Err("Use a segment of 1–60 seconds, starting within one hour.".into());
    }
    for file in [&python, &source, &reference] {
        if !Path::new(file).is_file() {
            return Err(format!("Missing singing file: {file}"));
        }
    }
    if !Path::new(&repo).join("inference.py").is_file() {
        return Err("Seed-VC source folder is missing.".into());
    }
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    if slot.is_some() {
        return Err("A singing job is already active.".into());
    }
    let root = Path::new(r"C:\AI\ManaAI-CV-2");
    let id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis();
    let dir = root.join("exports/singing").join(id.to_string());
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let script = app
        .path()
        .resolve(
            "scripts/singing_job.py",
            tauri::path::BaseDirectory::Resource,
        )
        .ok()
        .filter(|p| p.is_file())
        .unwrap_or_else(|| root.join("scripts/singing_job.py"));
    let log = fs::File::create(dir.join("job.log")).map_err(|e| e.to_string())?;
    let mut cmd = Command::new(python);
    cmd.arg(script)
        .env("CUDA_VISIBLE_DEVICES", "")
        .env("PYTHONUNBUFFERED", "1")
        .env("PYTHONIOENCODING", "utf-8")
        .env("PYTHONUTF8", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::from(log.try_clone().map_err(|e| e.to_string())?))
        .stderr(Stdio::from(log));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    let data=serde_json::to_vec(&serde_json::json!({"repo":repo,"source":source,"reference":reference,"start":if whole_song {0.0}else{start},"seconds":seconds,"whole_song":whole_song,"separate":separate,"backing_gain":backing_gain,"output":dir,"result":dir.join("result.json")})).map_err(|e|e.to_string())?;
    if let Err(error)=fs::write(dir.join("request.json"),&data){let _=child.kill();let _=child.wait();return Err(error.to_string());}
    if let Err(e) = child
        .stdin
        .take()
        .ok_or("Job input unavailable".to_string())
        .and_then(|mut f| f.write_all(&data).map_err(|e| e.to_string()))
    {
        let _ = child.kill();
        let _ = child.wait();
        return Err(e);
    }
    *slot = Some(Job { child, dir });
    Ok(())
}

fn wav_seconds(path:&Path)->Option<f64>{
    let mut file=fs::File::open(path).ok()?;let mut header=[0u8;12];file.read_exact(&mut header).ok()?;
    if &header[..4]!=b"RIFF"||&header[8..]!=b"WAVE"{return None;}
    let mut rate=0u32;
    for _ in 0..100{
        let mut chunk=[0u8;8];file.read_exact(&mut chunk).ok()?;let size=u32::from_le_bytes(chunk[4..8].try_into().ok()?);
        if &chunk[..4]==b"fmt "&&size>=16{let mut format=[0u8;16];file.read_exact(&mut format).ok()?;rate=u32::from_le_bytes(format[8..12].try_into().ok()?);file.seek(SeekFrom::Current((size-16) as i64+(size%2) as i64)).ok()?;}
        else if &chunk[..4]==b"data"&&rate>0{return Some(size as f64/rate as f64);}
        else{file.seek(SeekFrom::Current(size as i64+(size%2) as i64)).ok()?;}
    }None
}
#[cfg(test)]
mod library_tests{
    use super::*;
    #[test]
    fn wav_metadata_reads_duration_and_rejects_invalid_header(){
        let path=std::env::temp_dir().join(format!("mana-studio-duration-{}.wav",std::process::id()));
        let mut wave=vec![];wave.extend_from_slice(b"RIFF");wave.extend_from_slice(&32036u32.to_le_bytes());wave.extend_from_slice(b"WAVEfmt ");wave.extend_from_slice(&16u32.to_le_bytes());wave.extend_from_slice(&1u16.to_le_bytes());wave.extend_from_slice(&1u16.to_le_bytes());wave.extend_from_slice(&8000u32.to_le_bytes());wave.extend_from_slice(&16000u32.to_le_bytes());wave.extend_from_slice(&2u16.to_le_bytes());wave.extend_from_slice(&16u16.to_le_bytes());wave.extend_from_slice(b"data");wave.extend_from_slice(&32000u32.to_le_bytes());wave.resize(32044,0);fs::write(&path,wave).unwrap();assert_eq!(wav_seconds(&path),Some(2.0));fs::write(&path,b"invalid").unwrap();assert_eq!(wav_seconds(&path),None);fs::remove_file(path).unwrap();
    }
    #[test]
    fn discovered_covers_use_existing_generated_files(){
        let covers=singing_library().unwrap();
        for cover in covers{let vocal=cover["vocal"].as_str().unwrap();assert!(Path::new(vocal).is_file());assert!(vocal.to_lowercase().starts_with("c:/ai/manaai-cv-2/exports/singing/"));assert!(cover["seconds"].as_f64().unwrap()>0.0);}
    }
}
#[tauri::command]
pub fn singing_library()->Result<Vec<serde_json::Value>,String>{
    let root=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing");if !root.exists(){return Ok(vec![]);}let root=root.canonicalize().map_err(|e|e.to_string())?;
    let mut dirs=fs::read_dir(&root).map_err(|e|e.to_string())?.filter_map(Result::ok).collect::<Vec<_>>();dirs.sort_by_key(|e|std::cmp::Reverse(e.file_name()));
    let mut projects=vec![];
    for entry in dirs{
        let result_path=entry.path().join("result.json");
        if !result_path.is_file()||!result_path.canonicalize().map(|p|p.starts_with(&root)).unwrap_or(false)||fs::metadata(&result_path).map(|m|m.len()>64000).unwrap_or(true){continue;}
        let result=match fs::read(&result_path).ok().and_then(|b|serde_json::from_slice::<serde_json::Value>(&b).ok()){Some(v)=>v,None=>continue};
        if result.get("error").and_then(|v|v.as_str()).is_some_and(|s|!s.is_empty()){continue;}
        let safe=|value:&str|->String{let path=Path::new(value);match path.canonicalize(){Ok(p) if p.starts_with(&root)&&p.is_file()&&p.extension().is_some_and(|e|e=="wav")=>p.to_string_lossy().trim_start_matches(r"\\?\").replace('\\',"/"),_=>String::new()}};
        let vocal=safe(result.get("vocal").and_then(|v|v.as_str()).unwrap_or(""));if vocal.is_empty(){continue;}
        let mix=safe(result.get("mix").and_then(|v|v.as_str()).unwrap_or(""));
        let instrumental=safe(&entry.path().join("instrumental.wav").to_string_lossy());
        let request=fs::read(entry.path().join("request.json")).ok().filter(|b|b.len()<64000).and_then(|b|serde_json::from_slice::<serde_json::Value>(&b).ok()).unwrap_or_default();
        let source=request.get("source").and_then(|v|v.as_str()).unwrap_or("");let name=entry.file_name().to_string_lossy().into_owned();
        let id=format!("studio-{}",name.chars().filter(|c|c.is_ascii_alphanumeric()||*c=='-').collect::<String>());
        let title=Path::new(source).file_stem().and_then(|s|s.to_str()).map(str::to_owned).unwrap_or_else(||format!("Saved cover {name}"));
        projects.push(serde_json::json!({"id":id,"title":title,"createdAtMs":entry.metadata().ok().and_then(|m|m.modified().ok()).and_then(|t|t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d|d.as_millis()).unwrap_or(0),"status":"ready","source":source,"vocal":vocal,"mix":mix,"instrumental":instrumental,"seconds":wav_seconds(Path::new(&vocal)).unwrap_or(0.0),"artwork":"","error":"","settings":{"wholeSong":request.get("whole_song").and_then(|v|v.as_bool()).unwrap_or(false),"start":request.get("start").and_then(|v|v.as_f64()).unwrap_or(0.0),"seconds":request.get("seconds").and_then(|v|v.as_f64()).unwrap_or(10.0),"separate":request.get("separate").and_then(|v|v.as_bool()).unwrap_or(true),"backingGain":request.get("backing_gain").and_then(|v|v.as_f64()).unwrap_or(0.3),"reference":request.get("reference").and_then(|v|v.as_str()).unwrap_or("")}}));
        if projects.len()>=50{break;}
    }Ok(projects)
}
#[tauri::command]
pub fn singing_poll(state: tauri::State<Singing>) -> Result<serde_json::Value, String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let job = slot.as_mut().ok_or("Singing job stopped.")?;
    let mut log = Vec::new();
    if let Ok(mut file) = fs::File::open(job.dir.join("job.log")) {
        let size = file.metadata().map(|m| m.len()).unwrap_or(0);
        let _ = file.seek(SeekFrom::Start(size.saturating_sub(2000)));
        let _ = file.take(2000).read_to_end(&mut log);
    }
    let tail = String::from_utf8_lossy(&log[log.len().saturating_sub(2000)..]).to_string();
    if job.child.try_wait().map_err(|e| e.to_string())?.is_none() {
        return Ok(serde_json::json!({"done":false,"log":tail}));
    }
    let result=fs::read(job.dir.join("result.json")).ok().and_then(|b|serde_json::from_slice::<serde_json::Value>(&b).ok()).unwrap_or_else(||serde_json::json!({"done":true,"error":"Singing process exited without a result. See job log."}));
    slot.take();
    Ok(serde_json::json!({"done":true,"log":tail,"result":result}))
}
#[tauri::command]
pub fn singing_audio(path: String) -> Result<tauri::ipc::Response, String> {
    let root = Path::new(r"C:\AI\ManaAI-CV-2\exports\singing")
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let file = Path::new(&path).canonicalize().map_err(|e| e.to_string())?;
    if !file.starts_with(root)
        || file.extension().and_then(|s| s.to_str()) != Some("wav")
        || fs::metadata(&file).map_err(|e| e.to_string())?.len() > 256000000
    {
        return Err("Choose a generated singing WAV under 256 MB.".into());
    }
    Ok(tauri::ipc::Response::new(
        fs::read(file).map_err(|e| e.to_string())?,
    ))
}
