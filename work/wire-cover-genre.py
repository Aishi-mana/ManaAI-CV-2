from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(path,before,after):
 p=root/path;s=p.read_text(encoding='utf-8');assert before in s,(path,before);p.write_text(s.replace(before,after),encoding='utf-8')
edit('src-tauri/src/singing.rs','    voice_profile: Option<String>,','    voice_profile: Option<String>,\n    genre: Option<String>,')
edit('src-tauri/src/singing.rs','    let extractor=extractor.unwrap_or_else', '''    let genre=genre.unwrap_or_else(||"original".into());
    if !["original","rock","jazz","pop"].contains(&genre.as_str()) {return Err("Choose Original, Rock, Jazz or Pop backing.".into());}
    if genre!="original" && (!separate || harmony_key.is_some()) {return Err("Genre remix requires separated instruments and a lead vocal cover.".into());}
    let extractor=extractor.unwrap_or_else''')
edit('src-tauri/src/singing.rs','json!({"voice_profile":if trained_voice','json!({"genre":genre,"voice_profile":if trained_voice')
edit('src-tauri/src/singing.rs','"settings":{"wholeSong":request.get','"settings":{"genre":request.get("genre").and_then(|v|v.as_str()).unwrap_or("original"),"wholeSong":request.get')
edit('src/core/musicStudio.ts',"settings:{wholeSong:boolean;", "settings:{genre?:'original'|'rock'|'jazz'|'pop';wholeSong:boolean;")
edit('src/core/musicStudio.ts',"settings:{extractor:settings.extractor", "settings:{genre:['rock','jazz','pop'].includes(String(settings.genre))?settings.genre as 'rock'|'jazz'|'pop':'original',extractor:settings.extractor")
edit('src/components/SingingDrawer.tsx'," const seconds=musicDuration(start,end);", " const [genre,setGenre]=useState<'original'|'rock'|'jazz'|'pop'>('original');\n const seconds=musicDuration(start,end);")
edit('src/components/SingingDrawer.tsx','settings:{wholeSong,start:wholeSong?0:start,','settings:{genre,wholeSong,start:wholeSong?0:start,')
edit('src/components/SingingDrawer.tsx',"await invoke('singing_start',{voiceProfile:singingProfile,", "await invoke('singing_start',{genre,voiceProfile:singingProfile,")
edit('src/components/SingingDrawer.tsx',"setStatus(poll.log.includes('Converting guide vocal')?", "setStatus(poll.log.includes('Restyling instrumental backing')&&!poll.log.includes('Converting guide vocal')?'Restyling the instruments…':poll.log.includes('Converting guide vocal')?")
edit('src/components/SingingDrawer.tsx','<label className="studio-check"><input type="checkbox" checked={wholeSong}', '''<label className="field">Backing style<select value={genre} disabled={blocked} onChange={e=>{const next=e.target.value as typeof genre;setGenre(next);if(next!=='original'){setSeparate(true);setWholeSong(false);setEnd(start+20);}}}><option value="original">Original instruments</option><option value="rock">Rock · preview</option><option value="jazz">Jazz · preview</option><option value="pop">Pop · preview</option></select></label>{genre!=='original'&&<p className="hint-soft">Rebuilds only the backing with ACE-Step; your selected singer is converted separately. Start with a short excerpt and check phrasing and timing. Uses the GPU. Up to 180 seconds.</p>}<label className="studio-check"><input type="checkbox" checked={wholeSong}''')
edit('src/components/SingingDrawer.tsx','checked={separate} disabled={blocked}',"checked={separate} disabled={blocked||genre!=='original'}")
edit('src-tauri/tauri.conf.json','"../scripts/singing_job.py": "scripts/singing_job.py",','"../scripts/singing_job.py": "scripts/singing_job.py",\n      "../scripts/cover_genre.py": "scripts/cover_genre.py",')
