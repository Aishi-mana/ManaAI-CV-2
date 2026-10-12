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
fn validate_arrangement_range(vocal:&str,instrumental:&str,start:f64,seconds:f64)->Result<(),String>{
    if !start.is_finite()||start<0.0||!seconds.is_finite()||!(1.0..=60.0).contains(&seconds){return Err("Choose a nonnegative start and 1–60 second duration.".into());}
    let root=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing").canonicalize().map_err(|e|e.to_string())?;
    for path in [vocal,instrumental]{let file=Path::new(path).canonicalize().map_err(|e|e.to_string())?;if !file.starts_with(&root)||!file.is_file()||file.extension().and_then(|s|s.to_str())!=Some("wav"){return Err("Choose saved generated vocal and instrument stems.".into());}
        let duration=wav_seconds(&file).ok_or("Cannot read this stem's WAV duration.")?;
        if start+seconds>duration+0.000001{return Err(format!("This stem is {duration:.2} seconds long. Choose a start and duration ending within the song."));}
    }Ok(())
}
#[tauri::command]
pub fn arrangement_validate(vocal:String,instrumental:String,start:f64,seconds:f64)->Result<(),String>{validate_arrangement_range(&vocal,&instrumental,start,seconds)}
#[tauri::command]
pub fn arrangement_start(app:tauri::AppHandle,state:tauri::State<Singing>,python:String,vocal:String,instrumental:String,style:String,start:f64,seconds:f64,preview_only:Option<bool>,guitar:Option<String>,stems:Option<Vec<serde_json::Value>>,bank:Option<String>,source_name:Option<String>)->Result<(),String>{
    if !["sax-extract","piano-extract","fine-stems","piano","gentle-piano","jazz","rock","review-stems","replace-guitar-sax","replace-guitar-piano","replace-guitar-electric-guitar","replace-guitar-electric-guitar-distorted","replace-guitar-acoustic-guitar","replace-guitar-nylon-guitar","replace-guitar-finger-bass","replace-guitar-acoustic-bass","replace-guitar-violin","replace-guitar-strings","replace-guitar-flute","replace-guitar-harp","replace-guitar-drums-standard","replace-guitar-drums-rock","replace-guitar-drums-jazz","replace-guitar-drums-brush","replace-guitar-drums-electronic","replace-guitar-electric-piano","replace-guitar-fm-piano","replace-guitar-organ","replace-guitar-accordion","replace-guitar-harpsichord","replace-guitar-clavinet","replace-guitar-harmonica","replace-guitar-ocarina","replace-guitar-synth-square","replace-guitar-synth-saw","replace-guitar-synth-pad","replace-guitar-synth-poly","replace-guitar-weresax-synth","replace-guitar-weresax-saxcordion","replace-guitar-guitar-black","replace-guitar-guitar-combo","replace-guitar-piano-treble","replace-guitar-piano-bass"].contains(&style.as_str())||!start.is_finite()||start<0.0||!seconds.is_finite()||!(1.0..=60.0).contains(&seconds){return Err("Choose a supported style and a 1–60 second section.".into());}
    let source_name=source_name.unwrap_or_else(||"guitar".into());if !["guitar","piano","bass","other","drums","strings-estimate","winds-estimate","sax-extracted","piano-banquet"].contains(&source_name.as_str()){return Err("Choose a supported source part.".into());}
    if style.starts_with("replace-guitar-") && ((source_name=="drums") != style.starts_with("replace-guitar-drums-")){return Err("Choose a drum kit for drums and a melodic instrument for other parts.".into());}
    let bank=bank.unwrap_or_else(||"fluidr3".into());if !["fluidr3","livehq","separate"].contains(&bank.as_str()){return Err("Choose a supported instrument bank.".into());}
    validate_arrangement_range(&vocal,&instrumental,start,seconds)?;
    let root=Path::new(r"C:\AI\ManaAI-CV-2");let exports=root.join("exports/singing").canonicalize().map_err(|e|e.to_string())?;
    for path in [&vocal,&instrumental]{let file=Path::new(path).canonicalize().map_err(|e|e.to_string())?;if !file.starts_with(&exports)||!file.is_file()||file.extension().and_then(|s|s.to_str())!=Some("wav"){return Err("Choose saved generated vocal and instrument stems.".into());}}
    if style.starts_with("replace-guitar-")||style=="fine-stems"{if style.starts_with("replace-guitar-"){let path=guitar.as_deref().ok_or("Prepare the selected instrument part first.")?;validate_arrangement_range(&vocal,path,start,seconds)?;}for part in stems.as_deref().unwrap_or(&[]){validate_arrangement_range(&vocal,part.get("path").and_then(|v|v.as_str()).ok_or("Missing stem path")?,start,seconds)?;let name=part.get("name").and_then(|v|v.as_str()).unwrap_or("");if !["guitar","piano","bass","drums","other","sax","electric-guitar","replacement-piano","electric-guitar-distorted","strings-estimate","winds-estimate","sax-extracted","piano-banquet"].contains(&name){return Err("Invalid part label".into());}}}
    if style=="sax-extract"||style=="piano-extract"{
        if seconds>30.0{return Err("Choose a 1–30 second section for optional extraction.".into());}
        let required=if style=="sax-extract"{vec!["data/sax-demucs/filosax_demucs_v3_14.22_SDR.th"]}else{vec!["data/query-bandit/checkpoints/ev-pre-aug.ckpt","data/query-bandit/config/models/bandit-query.yml","data/separator-references/piano.wav"]};
        for file in required{if !root.join(file).is_file(){return Err("Optional extractor setup is missing. Restore its project model/reference files.".into());}}
    }
    if style=="fine-stems"{
        if seconds>30.0{return Err("Choose a 1–30 second section for finer extraction.".into());}
        let repo=root.join("data/AudioSep");
        for file in ["checkpoint/audiosep_base_4M_steps.ckpt","checkpoint/music_speech_audioset_epoch_15_esc_89.98.pt"]{if !repo.join(file).is_file(){return Err("AudioSep setup is missing. Restore its project checkpoint files.".into());}}
        if stems.as_ref().is_some_and(|parts|!parts.is_empty()&&!parts.iter().any(|p|p.get("name").and_then(|v|v.as_str())==Some("other"))){return Err("This project needs an Other/mixed part for finer extraction.".into());}
    }
    let mut slot=state.0.lock().map_err(|e|e.to_string())?;if slot.is_some(){return Err("A singing job is already active.".into());}
    let id=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();let dir=PathBuf::from(exports.join(format!("arrangement-{id}")).to_string_lossy().trim_start_matches(r"\\?\").to_string());fs::create_dir(&dir).map_err(|e|e.to_string())?;
    let script=app.path().resolve("scripts/arrangement_job.py",tauri::path::BaseDirectory::Resource).ok().filter(|p|p.is_file()).unwrap_or_else(||root.join("scripts/arrangement_job.py"));
    let log=fs::File::create(dir.join("job.log")).map_err(|e|e.to_string())?;let mut cmd=Command::new(python);cmd.arg(script).env("PYTHONUNBUFFERED","1").env("PYTHONIOENCODING","utf-8").stdin(Stdio::piped()).stdout(Stdio::from(log.try_clone().map_err(|e|e.to_string())?)).stderr(Stdio::from(log));
    #[cfg(windows)] {use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
    let mut child=cmd.spawn().map_err(|e|e.to_string())?;let data=serde_json::to_vec(&serde_json::json!({"data_root":root,"vocal":vocal,"instrumental":instrumental,"style":style,"previewOnly":preview_only.unwrap_or(false),"bank":bank,"source_name":source_name,"guitar":guitar,"stems":stems,"start":start,"seconds":seconds,"output":dir,"result":dir.join("result.json")})).map_err(|e|e.to_string())?;
    let result=fs::write(dir.join("request.json"),&data).map_err(|e|e.to_string()).and_then(|_|child.stdin.take().ok_or("Job input unavailable".into()).and_then(|mut f|f.write_all(&data).map_err(|e|e.to_string())));
    if let Err(e)=result{let _=child.kill();let _=child.wait();return Err(e);}*slot=Some(Job{child,dir});Ok(())
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
    fn arrangement_preflight_checks_shorter_stem_before_launch(){
        let dir=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing").join(format!("preflight-test-{}",std::process::id()));fs::create_dir(&dir).unwrap();
        let write=|name:&str,frames:u32|{let mut bytes=vec![];bytes.extend_from_slice(b"RIFF");bytes.extend_from_slice(&(36+frames*2).to_le_bytes());bytes.extend_from_slice(b"WAVEfmt ");bytes.extend_from_slice(&16u32.to_le_bytes());bytes.extend_from_slice(&1u16.to_le_bytes());bytes.extend_from_slice(&1u16.to_le_bytes());bytes.extend_from_slice(&8000u32.to_le_bytes());bytes.extend_from_slice(&16000u32.to_le_bytes());bytes.extend_from_slice(&2u16.to_le_bytes());bytes.extend_from_slice(&16u16.to_le_bytes());bytes.extend_from_slice(b"data");bytes.extend_from_slice(&(frames*2).to_le_bytes());bytes.resize(44+frames as usize*2,0);let file=dir.join(name);fs::write(&file,bytes).unwrap();file.to_string_lossy().to_string()};
        let vocal=write("vocal.wav",24000);let backing=write("backing.wav",16000);
        assert!(validate_arrangement_range(&vocal,&backing,1.0,1.0).is_ok());
        assert!(validate_arrangement_range(&vocal,&backing,1.0,2.0).unwrap_err().contains("2.00"));
        assert!(validate_arrangement_range(&vocal,&backing,0.0,61.0).is_err());
        fs::remove_file(vocal).unwrap();fs::remove_file(backing).unwrap();fs::remove_dir(dir).unwrap();
    }
    #[test]
    fn excerpts_preserve_frames_and_reject_invalid_ranges(){
        let mut wave=vec![];wave.extend_from_slice(b"RIFF");wave.extend_from_slice(&100u32.to_le_bytes());wave.extend_from_slice(b"WAVEfmt ");wave.extend_from_slice(&16u32.to_le_bytes());wave.extend_from_slice(&1u16.to_le_bytes());wave.extend_from_slice(&1u16.to_le_bytes());wave.extend_from_slice(&8u32.to_le_bytes());wave.extend_from_slice(&16u32.to_le_bytes());wave.extend_from_slice(&2u16.to_le_bytes());wave.extend_from_slice(&16u16.to_le_bytes());wave.extend_from_slice(b"data");wave.extend_from_slice(&64u32.to_le_bytes());for sample in 0..32u16{wave.extend_from_slice(&sample.to_le_bytes());}
        let excerpt=cut_wave(&wave,1.0,2.0).unwrap();assert_eq!(&excerpt[44..],&wave[60..92]);assert_eq!(u32::from_le_bytes(excerpt[40..44].try_into().unwrap()),32);
        assert!(cut_wave(&wave,3.0,2.0).is_err());assert!(cut_wave(&wave,f64::NAN,2.0).is_err());assert!(cut_wave(&wave,0.0,31.0).is_err());assert!(cut_wave(&wave[..50],0.0,1.0).is_err());
    }
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
        if request.get("previewOnly").and_then(|v|v.as_bool())==Some(true){continue;}
        let source=request.get("source").and_then(|v|v.as_str()).unwrap_or("");let name=entry.file_name().to_string_lossy().into_owned();
        let id=format!("studio-{}",name.chars().filter(|c|c.is_ascii_alphanumeric()||*c=='-').collect::<String>());
        let title=Path::new(source).file_stem().and_then(|s|s.to_str()).map(str::to_owned).unwrap_or_else(||format!("Saved cover {name}"));
        projects.push(serde_json::json!({"id":id,"title":title,"createdAtMs":entry.metadata().ok().and_then(|m|m.modified().ok()).and_then(|t|t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d|d.as_millis()).unwrap_or(0),"status":"ready","stems":result.get("stems").and_then(|v|v.as_array()).map(|parts|parts.iter().take(8).map(|part|serde_json::json!({"name":part.get("name"),"path":safe(part.get("path").and_then(|v|v.as_str()).unwrap_or("")),"gain":1,"muted":false})).collect::<Vec<_>>()).unwrap_or_default(),"source":source,"vocal":vocal,"mix":mix,"instrumental":instrumental,"seconds":wav_seconds(Path::new(&vocal)).unwrap_or(0.0),"artwork":"","error":"","settings":{"wholeSong":request.get("whole_song").and_then(|v|v.as_bool()).unwrap_or(false),"start":request.get("start").and_then(|v|v.as_f64()).unwrap_or(0.0),"seconds":request.get("seconds").and_then(|v|v.as_f64()).unwrap_or(10.0),"separate":request.get("separate").and_then(|v|v.as_bool()).unwrap_or(true),"backingGain":request.get("backing_gain").and_then(|v|v.as_f64()).unwrap_or(0.3),"reference":request.get("reference").and_then(|v|v.as_str()).unwrap_or("")}}));
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

fn cut_wave(bytes:&[u8],start:f64,seconds:f64)->Result<Vec<u8>,String>{
    if !start.is_finite()||start<0.0||!seconds.is_finite()||!(1.0..=30.0).contains(&seconds){return Err("Choose a 1–30 second clip and a nonnegative start.".into());}
    if bytes.len()<12||&bytes[..4]!=b"RIFF"||&bytes[8..12]!=b"WAVE"{return Err("Unsupported WAV header.".into());}
    let mut offset=12;let mut fmt=None;let mut data=None;
    while offset+8<=bytes.len(){let size=u32::from_le_bytes(bytes[offset+4..offset+8].try_into().unwrap()) as usize;let end=offset.checked_add(8+size).ok_or("Invalid WAV chunk")?;if end>bytes.len(){return Err("Truncated WAV file.".into());}match &bytes[offset..offset+4]{b"fmt "=>fmt=Some(&bytes[offset+8..end]),b"data"=>data=Some(&bytes[offset+8..end]),_=>{}}offset=end+size%2;}
    let fmt=fmt.ok_or("Missing WAV format")?;let data=data.ok_or("Missing WAV audio")?;if fmt.len()<16{return Err("Invalid WAV format.".into());}
    let format=u16::from_le_bytes(fmt[..2].try_into().unwrap());let rate=u32::from_le_bytes(fmt[4..8].try_into().unwrap()) as f64;let block=u16::from_le_bytes(fmt[12..14].try_into().unwrap()) as usize;
    if ![1,3,65534].contains(&format)||rate==0.0||block==0{return Err("Choose a PCM or floating-point WAV.".into());}
    let first=(start*rate).round() as usize;let count=(seconds*rate).round() as usize;let frames=data.len()/block;
    if count==0||first>frames||count>frames-first{return Err("The excerpt ends beyond the song. Choose an earlier start or shorter length.".into());}
    let clip=&data[first*block..(first+count)*block];let fmt_pad=fmt.len()%2;let data_pad=clip.len()%2;
    let mut out=Vec::new();out.extend_from_slice(b"RIFF");out.extend_from_slice(&((4+8+fmt.len()+fmt_pad+8+clip.len()+data_pad) as u32).to_le_bytes());out.extend_from_slice(b"WAVEfmt ");out.extend_from_slice(&(fmt.len() as u32).to_le_bytes());out.extend_from_slice(fmt);if fmt_pad>0{out.push(0);}out.extend_from_slice(b"data");out.extend_from_slice(&(clip.len() as u32).to_le_bytes());out.extend_from_slice(clip);if data_pad>0{out.push(0);}Ok(out)
}
#[tauri::command]
pub async fn singing_excerpt(path:String,start:f64,seconds:f64)->Result<String,String>{
    tauri::async_runtime::spawn_blocking(move||{
        let root=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing").canonicalize().map_err(|e|e.to_string())?;
        let file=Path::new(&path).canonicalize().map_err(|e|e.to_string())?;
        if !file.starts_with(&root)||!file.is_file()||file.extension().and_then(|s|s.to_str())!=Some("wav")||fs::metadata(&file).map_err(|e|e.to_string())?.len()>256000000{return Err("Choose a generated singing WAV under 256 MB.".into());}
        let clip=cut_wave(&fs::read(file).map_err(|e|e.to_string())?,start,seconds)?;
        let dir=root.join("excerpts");fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let dir=dir.canonicalize().map_err(|e|e.to_string())?;if !dir.starts_with(&root){return Err("Excerpt folder must stay inside singing exports.".into());}
        let id=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();
        let output=dir.join(format!("excerpt-{id}.wav"));let mut target=fs::OpenOptions::new().write(true).create_new(true).open(&output).map_err(|e|e.to_string())?;target.write_all(&clip).map_err(|e|e.to_string())?;
        Ok(output.to_string_lossy().trim_start_matches(r"\\?\").replace('\\',"/"))
    }).await.map_err(|e|e.to_string())?
}

#[tauri::command]
pub fn singing_save_mix(bytes:Vec<u8>)->Result<String,String>{
    if bytes.len()>256000000||bytes.len()<44||&bytes[..4]!=b"RIFF"||&bytes[8..12]!=b"WAVE"{return Err("Choose a WAV mix under 256 MB.".into());}
    let root=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing").canonicalize().map_err(|e|e.to_string())?;
    let dir=root.join("mixes");fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let dir=dir.canonicalize().map_err(|e|e.to_string())?;if !dir.starts_with(root){return Err("Invalid mix folder.".into());}
    let id=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();let path=dir.join(format!("mix-{id}.wav"));let mut file=fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e|e.to_string())?;file.write_all(&bytes).map_err(|e|e.to_string())?;Ok(path.to_string_lossy().trim_start_matches(r"\\?\").replace('\\',"/"))
}
#[tauri::command]
pub fn singing_export(path:String,destination:String)->Result<(),String>{
    let root=Path::new(r"C:\AI\ManaAI-CV-2\exports\singing").canonicalize().map_err(|e|e.to_string())?;let source=Path::new(&path).canonicalize().map_err(|e|e.to_string())?;
    if !source.starts_with(root)||!source.is_file()||source.extension().and_then(|v|v.to_str())!=Some("wav"){return Err("Choose a generated WAV.".into());}
    let target=Path::new(&destination);if target.extension().and_then(|v|v.to_str()).map(|s|s.eq_ignore_ascii_case("wav"))!=Some(true){return Err("Export as a .wav file.".into());}
    let mut output=fs::OpenOptions::new().write(true).create_new(true).open(target).map_err(|e|format!("Choose a new filename; existing files are kept. {e}"))?;let mut input=fs::File::open(source).map_err(|e|e.to_string())?;std::io::copy(&mut input,&mut output).map_err(|e|e.to_string())?;Ok(())
}
