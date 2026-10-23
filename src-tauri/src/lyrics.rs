use std::{fs,path::{Path,PathBuf},process::{Child,Command,Stdio},sync::Mutex,time::{Duration,Instant}};
struct Job{child:Child,dir:PathBuf,exe:String,model:String,preparing:bool,started:Instant}
impl Drop for Job{fn drop(&mut self){let _=self.child.kill();let _=self.child.wait();for name in ["audio.wav","lyrics.json","job.log"]{let _=fs::remove_file(self.dir.join(name));}let _=fs::remove_dir(&self.dir);}}
#[derive(Default)]pub struct Lyrics(Mutex<Option<Job>>);
fn hidden(cmd:&mut Command){#[cfg(windows)]{use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}cmd.stdin(Stdio::null());}
pub fn stop(state:&Lyrics)->Result<(),String>{state.0.lock().map_err(|e|e.to_string())?.take();Ok(())}
#[tauri::command]pub fn lyrics_stop(state:tauri::State<Lyrics>)->Result<(),String>{stop(&state)}
#[tauri::command]pub fn lyrics_start(state:tauri::State<Lyrics>,path:String,exe_path:String,model_path:String)->Result<(),String>{
 if !Path::new(&exe_path).is_file()||!Path::new(&model_path).is_file(){return Err("Configure Local Whisper in Chat → Voice input → Whisper setup first.".into());}
 let root=Path::new("C:/AI/ManaAI-CV-2/exports/singing").canonicalize().map_err(|e|e.to_string())?;let source=Path::new(&path).canonicalize().map_err(|e|e.to_string())?;
 if !source.starts_with(&root)||!source.is_file()||source.extension().and_then(|s|s.to_str())!=Some("wav"){return Err("Choose a saved song vocal.".into());}
 if !crate::singing::wav_seconds(&source).is_some_and(|seconds|seconds>=0.1&&seconds<=3600.){return Err("Use a saved vocal between 0.1 seconds and one hour.".into());}
 let mut slot=state.0.lock().map_err(|e|e.to_string())?;if slot.is_some(){return Err("Lyrics generation is already running.".into());}
 let id=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();let dir=std::env::temp_dir().join(format!("mana-lyrics-{id}"));fs::create_dir(&dir).map_err(|e|e.to_string())?;
 let mut cmd=Command::new("C:/AI/Applio/ffmpeg.exe");cmd.args(["-y","-nostdin","-i"]).arg(source).args(["-t","3600","-ar","16000","-ac","1","-c:a","pcm_s16le"]).arg(dir.join("audio.wav"));hidden(&mut cmd);cmd.stdout(Stdio::null()).stderr(Stdio::from(fs::File::create(dir.join("job.log")).map_err(|e|e.to_string())?));
 match cmd.spawn(){Ok(child)=>{*slot=Some(Job{child,dir,exe:exe_path,model:model_path,preparing:true,started:Instant::now()});Ok(())},Err(e)=>{let _=fs::remove_file(dir.join("job.log"));let _=fs::remove_dir(dir);Err(e.to_string())}}
}
fn lines(value:&serde_json::Value,max_end:f64)->Vec<serde_json::Value>{
 fn flush(words:&mut Vec<serde_json::Value>,output:&mut Vec<serde_json::Value>){
  if words.is_empty(){return;}
  let text=words.iter().filter_map(|w|w["text"].as_str()).collect::<Vec<_>>().join(" ");
  output.push(serde_json::json!({"start":words[0]["start"],"end":words.last().unwrap()["end"],"text":text,"words":std::mem::take(words)}));
 }
 let mut output=Vec::new();let mut words:Vec<serde_json::Value>=Vec::new();
 if let Some(rows)=value.get("transcription").and_then(|v|v.as_array()){
  for row in rows.iter().take(20000){
   let Some(start)=row.pointer("/offsets/from").and_then(|v|v.as_f64()).map(|n|n/1000.) else{continue};
   let Some(end)=row.pointer("/offsets/to").and_then(|v|v.as_f64()).map(|n|(n/1000.).min(max_end)) else{continue};
   let Some(text)=row.get("text").and_then(|v|v.as_str()).map(str::trim) else{continue};
   if start<0.||end<=start||end>3600.||text.is_empty(){continue;}
   if text.split_whitespace().count()>1{
    flush(&mut words,&mut output);
    output.push(serde_json::json!({"start":start,"end":end,"text":text.chars().take(500).collect::<String>()}));continue;
   }
   if !text.chars().any(char::is_alphanumeric){continue;}
   if words.last().is_some_and(|w|start<w["end"].as_f64().unwrap_or(start)||start-w["end"].as_f64().unwrap_or(start)>1.){flush(&mut words,&mut output);}
   words.push(serde_json::json!({"start":start,"end":end,"text":text}));
   if words.len()>=8||text.ends_with('.')||text.ends_with('!')||text.ends_with('?'){flush(&mut words,&mut output);}
  }
 }
 flush(&mut words,&mut output);output.truncate(2000);output
}
#[tauri::command]pub fn lyrics_poll(state:tauri::State<Lyrics>)->Result<serde_json::Value,String>{
 let mut slot=state.0.lock().map_err(|e|e.to_string())?;let job=slot.as_mut().ok_or("Lyrics generation stopped.")?;
 if job.started.elapsed()>Duration::from_secs(1800){slot.take();return Err("Lyrics generation timed out. Try a shorter song.".into());}
 let status=match job.child.try_wait().map_err(|e|e.to_string())?{None=>return Ok(serde_json::json!({"done":false})),Some(status)=>status};
 if !status.success(){slot.take();return Err("Lyrics generation failed. Check the Whisper setup and saved vocal.".into());}
 if job.preparing{let mut cmd=Command::new(&job.exe);let language=if job.model.to_lowercase().contains(".en."){"en"}else{"auto"};cmd.args(["-m",&job.model,"-f"]).arg(job.dir.join("audio.wav")).args(["-l",language,"-ng","-oj","-ml","1","-sow","-of"]).arg(job.dir.join("lyrics")).args(["-t","4"]);hidden(&mut cmd);cmd.stdout(Stdio::null()).stderr(Stdio::from(fs::File::create(job.dir.join("job.log")).map_err(|e|e.to_string())?));match cmd.spawn(){Ok(child)=>{job.child=child;job.preparing=false;return Ok(serde_json::json!({"done":false}));},Err(e)=>{slot.take();return Err(e.to_string());}}}
 let job=slot.take().unwrap();let file=job.dir.join("lyrics.json");if fs::metadata(&file).map_err(|e|e.to_string())?.len()>16_000_000{return Err("Lyrics output is too large.".into());}let value:serde_json::Value=serde_json::from_slice(&fs::read(file).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;let result=lines(&value,crate::singing::wav_seconds(&job.dir.join("audio.wav")).unwrap_or(3600.));if result.is_empty(){return Err("No lyrics recognized. You can paste timed lyrics instead.".into());}Ok(serde_json::json!({"done":true,"lines":result}))
}
#[cfg(test)]mod tests{use super::*;#[test]fn parses_timed_lines_and_skips_invalid_segments(){let v=serde_json::json!({"transcription":[{"offsets":{"from":1200,"to":3500},"text":" Hello "},{"offsets":{"from":4000,"to":3000},"text":"bad"},{"text":"missing"}]});let result=lines(&v,3600.);assert_eq!(result.len(),1);assert_eq!(result[0]["start"],1.2);assert_eq!(result[0]["text"],"Hello");assert!(lines(&serde_json::json!({}),3600.).is_empty());}#[test]fn idle_stop_is_safe(){stop(&Lyrics::default()).unwrap();}}

#[cfg(test)]mod word_tests{use super::*;
 #[test]fn groups_real_word_offsets_and_clips_audio_end(){let rows=serde_json::json!({"transcription":[{"offsets":{"from":0,"to":100},"text":"♪"},{"offsets":{"from":500,"to":1000},"text":" Stay"},{"offsets":{"from":1200,"to":1600},"text":" here."},{"offsets":{"from":3000,"to":4200},"text":" Home"}]});let result=lines(&rows,4.);assert_eq!(result.len(),2);assert_eq!(result[0]["text"],"Stay here.");assert_eq!(result[0]["words"][0]["end"],1.);assert_eq!(result[0]["words"][1]["start"],1.2);assert_eq!(result[1]["end"],4.);}
 #[test]fn multiword_legacy_segments_keep_line_fallback(){let result=lines(&serde_json::json!({"transcription":[{"offsets":{"from":0,"to":2000},"text":"Hello world"}]}),3.);assert_eq!(result[0]["text"],"Hello world");assert!(result[0].get("words").is_none());}
 #[test]fn saved_cli_smoke_fixture_has_word_offsets(){let value:serde_json::Value=serde_json::from_str(include_str!("../../tests/fixtures/whisper-word-timestamps.json")).unwrap();let result=lines(&value,6.);assert!(result.iter().any(|line|line["words"].as_array().is_some_and(|w|w.len()>1)));assert!(result.iter().all(|line|line["end"].as_f64().unwrap()<=6.));}
}
