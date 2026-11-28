use std::io::Write;
use std::path::Path;
pub fn write(dir:&Path,content:&str)->Result<String,String>{
 if !content.starts_with(r#"<svg xmlns="http://www.w3.org/2000/svg""#)||content.len()>50_000{return Err("Use a digital creation SVG under 50 KB.".into());}
 std::fs::create_dir_all(dir).map_err(|e|e.to_string())?;
 let stamp=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();
 let path=dir.join(format!("Manaverse-creation-{stamp}.svg"));
 let mut file=std::fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e|e.to_string())?;
 file.write_all(content.as_bytes()).map_err(|e|e.to_string())?;file.sync_all().map_err(|e|e.to_string())?;
 Ok(path.to_string_lossy().into_owned())
}
#[cfg(test)]mod tests{
 #[test]fn exports_unique_svg_without_overwriting(){
  let dir=std::env::temp_dir().join(format!("mana-creation-export-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
  let content=r#"<svg xmlns="http://www.w3.org/2000/svg"><title>Small star</title></svg>"#;
  let first=super::write(&dir,content).unwrap();let second=super::write(&dir,content).unwrap();
  assert_ne!(first,second);assert!(first.ends_with(".svg"));assert_eq!(std::fs::read_to_string(&first).unwrap(),content);
  assert!(super::write(&dir,"not svg").is_err());assert!(super::write(&dir,&format!("{}{}",content,"a".repeat(50000))).is_err());
  std::fs::remove_dir_all(dir).unwrap();
 }
}

