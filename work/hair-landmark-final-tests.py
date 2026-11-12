from pathlib import Path
p=Path('src/core/generatedHair.ts');s=p.read_text(encoding='utf-8');a=s.index('export function hairPiece');b=s.index('export interface HairLandmarks',a);section=s[a:b].replace('y:best!.top-bounds.y*s-', 'y:top-bounds.y*s-');s=s[:a]+section+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/wearable_reviews.rs');s=p.read_text(encoding='utf-8');marker=' #[test]fn accessories_keep_selected_depth';i=s.index(marker);s=s[:i]+''' #[test]fn generated_fit_warnings_survive_reopening(){
  let base=std::env::temp_dir().join(format!("mana-hair-warning-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));let mut p=project();p["generation"]=serde_json::json!({"fitReport":{"warnings":["Fringe depth needs review."]}});let r=save(&base,None,None,"hair".into(),"top".into(),"Hair".into(),layers(true,false),p).unwrap();assert_eq!(read(&base,&r.id).unwrap().fit_warnings,vec!["Fringe depth needs review."]);assert!(base.canonicalize().unwrap().starts_with(std::env::temp_dir().canonicalize().unwrap()));fs::remove_dir_all(base).unwrap();
 }
'''+s[i:];p.write_text(s,encoding='utf-8')
