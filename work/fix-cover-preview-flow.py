from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(path,before,after):
 p=root/path;s=p.read_text(encoding='utf-8');assert before in s,(path,before);p.write_text(s.replace(before,after),encoding='utf-8')
edit('src/components/SingingDrawer.tsx'," const [genre,setGenre]", " const [coverDraft,setCoverDraft]=useState<{project:StudioProject;saved:boolean}|null>(null);\n const [genre,setGenre]")
edit('src/components/SingingDrawer.tsx',"  if(state.current.projects.length>=STUDIO_PROJECT_LIMIT){setLog('');setStatus('Library is full (1,000 projects). Open Song Player and remove a library entry to make room; audio files will be kept.');return;}\n",'')
edit('src/components/SingingDrawer.tsx',"  currentJob.current=project.id;save({projects:[project,...state.current.projects],selectedId:project.id});setBusy(true);setStatus('Preparing your cover…');setLog('');", "  currentJob.current=null;setCoverDraft(null);setBusy(true);setStatus('Preparing your cover preview…');setLog('');")
edit('src/components/SingingDrawer.tsx',"await invoke('singing_start',{genre,voiceProfile:","await invoke('singing_start',{previewOnly:true,genre,voiceProfile:")
before="patch(project.id,{status:'ready',vocal:result.vocal,mix:result.mix??'',instrumental:separate?result.vocal.replace(/[^/\\\\]+$/,'instrumental.wav'):'',seconds:result.seconds??0,error:''});setStatus('Your cover is ready. Press Play to listen.');"
after="setCoverDraft({project:{...project,status:'ready',vocal:result.vocal,mix:result.mix??'',instrumental:separate?result.vocal.replace(/[^/\\\\]+$/,'instrumental.wav'):'',seconds:result.seconds??0,error:''},saved:false});setStatus('Preview ready. Listen below, then save this version if you like it.');"
edit('src/components/SingingDrawer.tsx',before,after)
edit('src/components/SingingDrawer.tsx',"patch(project.id,{status:'error',error:String(error)});setStatus(String(error));await invoke('singing_stop').catch(()=>{});}}finally", "setStatus(String(error));await invoke('singing_stop').catch(()=>{});}}finally")
edit('src/components/SingingDrawer.tsx'," async function convert(){",''' function saveCoverPreview(){
  if(!coverDraft||coverDraft.saved||busy)return;
  if(state.current.projects.length>=STUDIO_PROJECT_LIMIT){setStatus('Library is full. Remove an entry before saving.');return;}
  const project=coverDraft.project;
  save({...state.current,projects:[project,...state.current.projects],selectedId:project.id});
  setCoverDraft({...coverDraft,saved:true});setStatus('This exact preview is saved to your library. No regeneration.');
 }
 async function convert(){''')
edit('src/components/SingingDrawer.tsx',"controls={tab==='original'} aria-label=\"Original song preview player\"", "controls={tab==='original'||tab==='create'} aria-label=\"Song preview player\"")
edit('src/components/SingingDrawer.tsx',"if(selected&&selected.seconds===0)patch", "if(tab==='player'&&selected&&selected.seconds===0)patch")
edit('src/components/SingingDrawer.tsx',"{tab!=='player'&&tab!=='original'&&<div hidden>","{tab!=='player'&&tab!=='original'&&tab!=='create'&&<div hidden>")
edit('src/components/SingingDrawer.tsx',"{busy?'Making your cover…':wholeSong?'Make full cover':'Make cover excerpt'}", "{busy?'Making your cover…':wholeSong?'Generate full cover preview':'Generate excerpt preview'}")
edit('src/components/SingingDrawer.tsx','<p role="status" className="cover-inline-status">', '''{coverDraft&&<section className="cover-preview" aria-label="Cover preview"><h3>{coverDraft.project.title} · Preview</h3><p>Listen to this version before saving. Changing the form does not change this generated audio.</p><div className="builder-actions"><button className="btn" disabled={blocked} onClick={()=>void play(coverDraft.project.mix||coverDraft.project.vocal)}>{playing?'Pause preview':'Play preview'}</button><button className="btn" disabled={busy} onClick={()=>{clearPlayer();setStatus('Preview stopped.');}}>Stop preview</button><button className="btn primary" disabled={busy||coverDraft.saved} onClick={saveCoverPreview}>{coverDraft.saved?'Saved to library':'Save this preview to library'}</button></div>{playbackAudio}</section>}<p role="status" className="cover-inline-status">''')
edit('src-tauri/src/singing.rs','    genre: Option<String>,','    genre: Option<String>,\n    preview_only: Option<bool>,')
edit('src-tauri/src/singing.rs','json!({"genre":genre,"voice_profile":','json!({"previewOnly":preview_only.unwrap_or(false),"genre":genre,"voice_profile":')
