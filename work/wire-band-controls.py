from pathlib import Path
def edit(path,changes):
 p=Path(path);s=p.read_text(encoding='utf-8')
 for old,new in changes:
  if old not in s:raise RuntimeError(f'Missing edit in {path}: {old[:100]}')
  s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')
edit('src/core/musicStudio.ts',[
 ("import ","import "), # keep import placement below separate
 ("genre?:'original'|'rock'|'jazz'|'pop';","genre?:'original'|'rock'|'jazz'|'pop'|'piano-trio'|'guitar-electric';genreLead?:string;"),
 ("genre:['rock','jazz','pop'].includes(String(settings.genre))?settings.genre as 'rock'|'jazz'|'pop':'original',","genre:['rock','jazz','pop','piano-trio','guitar-electric'].includes(String(settings.genre))?settings.genre as 'rock'|'jazz'|'pop'|'piano-trio'|'guitar-electric':'original',genreLead:checkedGenreLead(String(settings.genre),settings.genreLead),")])
p=Path('src/core/musicStudio.ts');s=p.read_text(encoding='utf-8');p.write_text("import {checkedGenreLead} from './musicGenres';\n"+s,encoding='utf-8')
edit('src/components/SingingDrawer.tsx',[
 ("import VoiceProfileSelect", "import {POP_LEADS,JAZZ_LEADS,checkedGenreLead,type BackingStyle} from '../core/musicGenres';\nimport VoiceProfileSelect"),
 ("useState<'original'|'rock'|'jazz'|'pop'>('original')","useState<BackingStyle>('original')"),
 ("const seconds=musicDuration(start,end);","const [popLead,setPopLead]=useState('electric-piano'),[jazzLead,setJazzLead]=useState('sax');\n const leadFor=(style:string)=>checkedGenreLead(style,style==='pop'?popLead:jazzLead);\n const seconds=musicDuration(start,end);"),
 ("jazz:'Jazz · Sax',rock:'Electric guitar · source notes'","jazz:'Jazz swing',pop:'Pop band',rock:'Rock band','guitar-electric':'Electric guitar · source notes'"),
 ("settings:{genre,percussion,wholeSong","settings:{genre,genreLead:leadFor(genre),percussion,wholeSong"),
 ("previewOnly:true,genre,percussion,voiceProfile","previewOnly:true,genre,genreLead:leadFor(genre),percussion,voiceProfile"),
 ("...(style==='piano-trio'?[arrPercussion]:[])]","...(style==='piano-trio'?[arrPercussion]:[]),...(leadFor(style)?[leadFor(style)]:[])]"),
 ("...(arrStyle==='piano-trio'?[arrPercussion]:[])]","...(arrStyle==='piano-trio'?[arrPercussion]:[]),...(leadFor(arrStyle)?[leadFor(arrStyle)]:[])]"),
 ("settings:{...original.settings,percussion:style===","settings:{...original.settings,genreLead:leadFor(style),percussion:style==="),
 ("instrumental:original.instrumental,style,start:chosenStart","instrumental:original.instrumental,style,genreLead:leadFor(style),start:chosenStart"),
 ('<option value="rock">Electric guitar · source notes</option>','<option value="rock">Rock band</option><option value="guitar-electric">Electric guitar · source notes</option>'),
 ('<option value="jazz">Piano trio · tested style</option>','<option value="jazz">Jazz swing</option><option value="piano-trio">Piano trio · source notes</option>'),
 ('<option value="pop">Pop · preview</option>','<option value="pop">Pop band</option>'),
 ("{genre==='rock'&&<p", "{['rock','jazz','pop'].includes(genre)&&<><label className=\"field\">{genre==='pop'?'Pop lead instrument':genre==='jazz'?'Jazz lead':'Lead instrument'}{genre==='rock'?<span>Electric guitar</span>:<select value={leadFor(genre)} disabled={blocked} onChange={e=>genre==='pop'?setPopLead(e.target.value):setJazzLead(e.target.value)}>{(genre==='pop'?POP_LEADS:JAZZ_LEADS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>}</label><p className=\"hint-soft\">Builds a coordinated band from the detected guitar melody and beat. Best for clear guitar-led 4/4 songs. Choose 8–60 seconds; preview before saving. Singing voice is selected separately.</p></>}{genre==='guitar-electric'&&<p"),
 ("{genre==='jazz'&&<><label", "{genre==='piano-trio'&&<><label"),
 ("genre!=='original'&&genre!=='jazz'&&genre!=='rock'&&", "!['original','rock','jazz','pop','piano-trio','guitar-electric'].includes(genre)&&"),
 ("genre==='jazz'?'Piano backing':genre==='rock'?'Guitar backing':'Original backing'","genre==='piano-trio'?'Piano backing':genre==='original'?'Original backing':'Arranged backing'"),
 ('<option value="jazz">Jazz · Sax</option>','<option value="jazz">Jazz swing</option><option value="pop">Pop band</option>'),
 ('</select></label>{arrStyle===\'piano-trio\'&&','</select></label>{[\'jazz\',\'pop\'].includes(arrStyle)&&<label className="field">Lead instrument<select value={leadFor(arrStyle)} disabled={blocked} onChange={e=>arrStyle===\'pop\'?setPopLead(e.target.value):setJazzLead(e.target.value)}>{(arrStyle===\'pop\'?POP_LEADS:JAZZ_LEADS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}{arrStyle===\'piano-trio\'&&'),
 ('Electric guitar follows the detected source guitar notes and keeps the remaining backing. Jazz features a synthesized sax lead; its chord-based version may lose recognizable riffs. Preview before saving.','Rock, Jazz and Pop rebuild a coordinated band from guitar notes and the source beat (8–60 seconds, best on clear guitar-led 4/4 songs). Guitar-only keeps the other backing. Preview before saving.')])
edit('scripts/arrangement_job.py',[("'piano-trio','piano','gentle-piano','jazz','rock'","'piano-trio','piano','gentle-piano','jazz','rock','pop','guitar-electric'")])
edit('src-tauri/src/singing.rs',[
 ('notes:Option<Vec<serde_json::Value>>,percussion:Option<bool>)->Result','notes:Option<Vec<serde_json::Value>>,percussion:Option<bool>,genre_lead:Option<String>)->Result'),
 ('"piano-trio","piano","gentle-piano","jazz","rock","review-stems"','"piano-trio","piano","gentle-piano","jazz","rock","pop","guitar-electric","review-stems"'),
 ('    validate_instrument_custom(custom.as_ref())?;','    let genre_lead=validate_genre_lead(&style,genre_lead)?;\n    validate_instrument_custom(custom.as_ref())?;'),
 ('json!({"notes":notes,"percussion"','json!({"notes":notes,"genre_lead":genre_lead,"percussion"'),
 ('    genre: Option<String>,','    genre: Option<String>,\n    genre_lead: Option<String>,'),
 ('["original","rock","jazz","pop"].contains(&genre.as_str())','["original","rock","jazz","pop","piano-trio","guitar-electric"].contains(&genre.as_str())'),
 ('    let extractor=extractor.unwrap_or_else(||"mega-lead".into());','    let genre_lead=validate_genre_lead(&genre,genre_lead)?;\n    let extractor=extractor.unwrap_or_else(||"mega-lead".into());'),
 ('"genre":genre,"voice_profile"','"genre":genre,"genre_lead":genre_lead,"voice_profile"'),
 ('"genre":request.get("genre").and_then(|v|v.as_str()).unwrap_or("original"),','"genre":request.get("genre").and_then(|v|v.as_str()).unwrap_or("original"),"genreLead":request.get("genre_lead"),')])
