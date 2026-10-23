from pathlib import Path
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8').replace('mod conversation_export;', 'mod conversation_export;\nmod game_export;');idx=s.index('#[tauri::command]\nfn export_playtest');s=s[:idx]+'''#[tauri::command]
fn export_game(content:String)->Result<String,String>{
    game_export::write(Path::new(r"C:\AI\ManaAI-CV-2\exports\games"),&content)
}

'''+s[idx:];s=s.replace('            export_work,','            export_work,\n            export_game,');p.write_text(s,encoding='utf-8')
p=Path('src/components/SavedGamesPlayground.tsx');s=p.read_text(encoding='utf-8');s="import ExportGameButton from './ExportGameButton';\n"+s;s=s.replace(' <label className="field">Load saved version', ' <ExportGameButton title={title} code={p.code} disabled={blocked}/>\n <label className="field">Load saved version');p.write_text(s,encoding='utf-8')
