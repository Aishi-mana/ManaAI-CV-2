use std::path::{Component, Path, PathBuf};

fn is_image(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("png") | Some("webp") | Some("jpg") | Some("jpeg")
    )
}

fn allowed_file(path: &Path, rel: &str) -> bool {
    is_image(path) || rel.eq_ignore_ascii_case("items.json")
}

fn canonical_base(dir: &Path) -> Result<PathBuf, String> {
    let base = dir
        .canonicalize()
        .map_err(|e| format!("Could not open avatar folder {}: {e}", dir.display()))?;
    if !base.is_dir() {
        return Err(format!("Avatar folder not found: {}", dir.display()));
    }
    Ok(base)
}

fn resolve_file(base: &Path, rel: &str) -> Result<PathBuf, String> {
    // Normalize separators before checking components, including Windows paths.
    // Colons also reject drive-relative paths and NTFS alternate data streams.
    let normalized = rel.replace('\\', "/");
    let relative = Path::new(&normalized);
    if normalized.is_empty()
        || normalized.contains(':')
        || relative.components().any(|part| {
            matches!(
                part,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err("Avatar file path must be relative and stay inside the avatar folder".into());
    }
    if !allowed_file(relative, &normalized) {
        return Err("Only avatar images and root items.json can be read".into());
    }
    let resolved = base
        .join(relative)
        .canonicalize()
        .map_err(|e| format!("Could not resolve avatar file {rel}: {e}"))?;
    // Path::starts_with compares components, not string prefixes. Canonicalization
    // resolves symlinks and Windows junctions before the containment check.
    if !resolved.starts_with(base) || !resolved.is_file() {
        return Err("Avatar file resolves outside the avatar folder or is not a file".into());
    }
    Ok(resolved)
}

pub fn read(dir: &Path, rel: &str) -> Result<Vec<u8>, String> {
    let base = canonical_base(dir)?;
    let path = resolve_file(&base, rel)?;
    std::fs::read(&path).map_err(|e| format!("Could not read avatar file {rel}: {e}"))
}

fn collect(base: &Path, dir: &Path, out: &mut Vec<String>, depth: u32) {
    if depth > 6 {
        return;
    }
    let Ok(resolved_dir) = dir.canonicalize() else {
        return;
    };
    if !resolved_dir.starts_with(base) {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect(base, &path, out, depth + 1);
        } else if let Ok(rel) = path.strip_prefix(base) {
            let rel = rel.to_string_lossy().replace('\\', "/");
            if resolve_file(base, &rel).is_ok() {
                out.push(rel);
            }
        }
    }
}

pub fn scan(dir: &Path) -> Result<Vec<String>, String> {
    let base = canonical_base(dir)?;
    let mut files = Vec::new();
    collect(&base, &base, &mut files, 0);
    files.sort();
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct Fixture {
        root: PathBuf,
        avatar: PathBuf,
        outside: PathBuf,
    }

    impl Fixture {
        fn new() -> Self {
            let unique = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("mana-avatar-test-{}-{unique}", std::process::id()));
            let avatar = root.join("avatar");
            let outside = root.join("avatar-other");
            fs::create_dir_all(avatar.join("eyes")).unwrap();
            fs::create_dir_all(&outside).unwrap();
            fs::write(avatar.join("eyes/eye_neutral.PNG"), b"inside image").unwrap();
            fs::write(avatar.join("items.json"), b"{}").unwrap();
            fs::write(outside.join("private.png"), b"outside image").unwrap();
            Self {
                root,
                avatar,
                outside,
            }
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            // Cleanup is restricted to the unique test directory directly under temp.
            assert_eq!(self.root.parent(), Some(std::env::temp_dir().as_path()));
            assert!(self
                .root
                .file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with("mana-avatar-test-"));
            fs::remove_dir_all(&self.root).unwrap();
        }
    }

    #[test]
    fn bundled_resources_match_source_and_work_after_relocation() {
        let executable = std::env::current_exe().unwrap();
        let resources = executable
            .parent()
            .unwrap()
            .parent()
            .unwrap()
            .join("assets/avatar");
        let source = Path::new(env!("CARGO_MANIFEST_DIR")).join("../assets/avatar");
        let source_files = scan(&source).unwrap();
        assert_eq!(scan(&resources).unwrap(), source_files);
        let f = Fixture::new();
        let relocated = f.root.join("moved-app/assets/avatar");
        for rel in &source_files {
            let data = read(&resources, rel).unwrap();
            assert_eq!(data, read(&source, rel).unwrap());
            let target = relocated.join(rel);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::write(target, &data).unwrap();
        }
        assert_eq!(scan(&relocated).unwrap(), source_files);
        for rel in source_files {
            assert_eq!(
                read(&relocated, &rel).unwrap(),
                read(&resources, &rel).unwrap()
            );
        }
    }

    #[test]
    fn repository_avatar_assets_scan_and_read_successfully() {
        let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../assets/avatar");
        let files = scan(&dir).unwrap();
        for required in [
            "base/body.png",
            "outfits/default/outfit.png",
            "hairstyles/default/hair_front.png",
        ] {
            assert!(files.contains(&required.to_string()));
        }
        for rel in files {
            assert!(!read(&dir, &rel).unwrap().is_empty(), "empty asset: {rel}");
        }
    }

    #[test]
    fn reads_images_and_root_catalog_and_scans_only_allowed_files() {
        let f = Fixture::new();
        fs::write(f.avatar.join("secret.txt"), b"secret").unwrap();
        fs::write(f.avatar.join("eyes/items.json"), b"{}").unwrap();
        assert_eq!(
            read(&f.avatar, "eyes/eye_neutral.PNG").unwrap(),
            b"inside image"
        );
        assert_eq!(
            read(&f.avatar, "eyes\\eye_neutral.PNG").unwrap(),
            b"inside image"
        );
        assert_eq!(read(&f.avatar, "items.json").unwrap(), b"{}");
        assert!(read(&f.avatar, "secret.txt").is_err());
        assert!(read(&f.avatar, "eyes/items.json").is_err());
        assert_eq!(
            scan(&f.avatar).unwrap(),
            vec!["eyes/eye_neutral.PNG", "items.json"]
        );
    }

    #[test]
    fn rejects_traversal_absolute_windows_prefixes_and_streams() {
        let f = Fixture::new();
        let absolute = f.outside.join("private.png");
        for rel in [
            "../avatar-other/private.png",
            "eyes/../../avatar-other/private.png",
            "..\\avatar-other\\private.png",
            "/private.png",
            "\\private.png",
            "C:\\private.png",
            "C:private.png",
            "\\\\server\\share\\private.png",
            "\\\\?\\C:\\private.png",
            "eyes/eye_neutral.PNG:hidden.png",
            "",
            absolute.to_str().unwrap(),
        ] {
            assert!(read(&f.avatar, rel).is_err(), "accepted {rel}");
        }
    }

    #[test]
    fn rejects_directories_missing_files_and_missing_roots() {
        let f = Fixture::new();
        fs::create_dir(f.avatar.join("directory.png")).unwrap();
        assert!(read(&f.avatar, "directory.png").is_err());
        assert!(read(&f.avatar, "missing.png").is_err());
        assert!(scan(&f.root.join("missing")).is_err());
        assert!(read(&f.avatar.join("items.json"), "image.png").is_err());
    }

    #[test]
    fn double_dots_inside_a_filename_are_not_traversal() {
        let f = Fixture::new();
        fs::write(f.avatar.join("eye..happy.webp"), b"valid").unwrap();
        assert_eq!(read(&f.avatar, "eye..happy.webp").unwrap(), b"valid");
    }

    fn link_dir(target: &Path, link: &Path) {
        #[cfg(unix)]
        std::os::unix::fs::symlink(target, link).unwrap();
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            // Junctions work without the elevation required by Windows symlinks.
            let result = std::process::Command::new("cmd")
                .args(["/C", "mklink", "/J"])
                .arg(link)
                .arg(target)
                .creation_flags(0x0800_0000)
                .output()
                .unwrap();
            assert!(result.status.success(), "junction failed: {:?}", result);
        }
    }

    #[test]
    fn external_directory_links_are_neither_scanned_nor_read() {
        let f = Fixture::new();
        link_dir(&f.outside, &f.avatar.join("external"));
        assert!(read(&f.avatar, "external/private.png").is_err());
        assert!(!scan(&f.avatar)
            .unwrap()
            .iter()
            .any(|rel| rel.starts_with("external/")));
    }

    #[test]
    fn internal_links_and_a_linked_selected_root_still_work() {
        let f = Fixture::new();
        link_dir(&f.avatar.join("eyes"), &f.avatar.join("linked-eyes"));
        assert_eq!(
            read(&f.avatar, "linked-eyes/eye_neutral.PNG").unwrap(),
            b"inside image"
        );
        assert!(scan(&f.avatar)
            .unwrap()
            .contains(&"linked-eyes/eye_neutral.PNG".to_string()));
        let selected = f.root.join("selected");
        link_dir(&f.avatar, &selected);
        assert_eq!(
            read(&selected, "eyes/eye_neutral.PNG").unwrap(),
            b"inside image"
        );
    }
}
