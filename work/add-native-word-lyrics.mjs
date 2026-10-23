import fs from 'node:fs';let p='src/components/SingingDrawer.tsx',s=fs.readFileSync(p,'utf8');s=s.replace('position={loaded.current===track?position:-1} busy={blocked}',"position={loaded.current===track?position:-1} playing={playing&&loaded.current===track} readPosition={()=>loaded.current===track?(audio.current?.currentTime??position):-1} busy={blocked}");fs.writeFileSync(p,s);
p='src-tauri/src/lyrics.rs';s=fs.readFileSync(p,'utf8');const start=s.indexOf('fn lines('),end=s.indexOf('#[tauri::command]pub fn lyrics_poll',start);
s=s.slice(0,start)+`fn lines(value:&serde_json::Value,max_end:f64)->Vec<serde_json::Value>{
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
`+s.slice(end);
s=s.replace('"-ng","-oj","-of"','"-ng","-oj","-ml","1","-sow","-of"');s=s.replace('>4_000_000','>16_000_000');s=s.replace('let result=lines(&value);','let result=lines(&value,crate::singing::wav_seconds(&job.dir.join("audio.wav")).unwrap_or(3600.));');s=s.replace('lines(&v)','lines(&v,3600.)').replace('lines(&serde_json::json!({}))','lines(&serde_json::json!({}),3600.)');
s+=`\n#[cfg(test)]mod word_tests{use super::*;
 #[test]fn groups_real_word_offsets_and_clips_audio_end(){let rows=serde_json::json!({"transcription":[{"offsets":{"from":0,"to":100},"text":"♪"},{"offsets":{"from":500,"to":1000},"text":" Stay"},{"offsets":{"from":1200,"to":1600},"text":" here."},{"offsets":{"from":3000,"to":4200},"text":" Home"}]});let result=lines(&rows,4.);assert_eq!(result.len(),2);assert_eq!(result[0]["text"],"Stay here.");assert_eq!(result[0]["words"][0]["end"],1.);assert_eq!(result[0]["words"][1]["start"],1.2);assert_eq!(result[1]["end"],4.);}
 #[test]fn multiword_legacy_segments_keep_line_fallback(){let result=lines(&serde_json::json!({"transcription":[{"offsets":{"from":0,"to":2000},"text":"Hello world"}]}),3.);assert_eq!(result[0]["text"],"Hello world");assert!(result[0].get("words").is_none());}
 #[test]fn saved_cli_smoke_fixture_has_word_offsets(){let path=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../work/karaoke-word-smoke/lyrics.json");if !path.exists(){return;}let value:serde_json::Value=serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();let result=lines(&value,6.);assert!(result.iter().any(|line|line["words"].as_array().is_some_and(|w|w.len()>1)));assert!(result.iter().all(|line|line["end"].as_f64().unwrap()<=6.));}
}\n`;
fs.writeFileSync(p,s);
