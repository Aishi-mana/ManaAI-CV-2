use std::io::Write;
use std::path::Path;

pub fn write(dir: &Path, content: &str) -> Result<String, String> {
    write_named(dir,content,"Mana-chat")
}

pub fn write_named(dir: &Path, content: &str, prefix: &str) -> Result<String, String> {
    if content.len() > 20_000_000 { return Err("Conversation exceeds 20 MB".into()); }
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let stamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?.as_nanos();
    let path = dir.join(format!("{prefix}-{stamp}.txt"));
    let mut file = std::fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
    file.sync_all().map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    #[test]
    fn exports_unicode_in_category_folder_without_overwriting() {
        let root=std::env::temp_dir().join(format!("mana-export-test-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let dir=root.join("conversations");
        let first=super::write(&dir,"Mana\nHello~ 你好\n").unwrap();
        let second=super::write(&dir,"Second\n").unwrap();
        assert_ne!(first,second);
        assert_eq!(std::fs::read_to_string(&first).unwrap(),"Mana\nHello~ 你好\n");
        assert!(super::write(&dir,&"a".repeat(20_000_001)).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}
