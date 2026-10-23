import fs from 'node:fs';
let p='src/components/SingingDrawer.tsx',s=fs.readFileSync(p,'utf8');
s=s.replace('project:StudioProject;brief:OriginalBrief;lyrics:string}|undefined','project:StudioProject;brief:OriginalBrief;lyrics:string;fullLength:boolean;saved:boolean}|undefined');
s=s.replace('brief:OriginalBrief,previewOnly:boolean){','brief:OriginalBrief,mode: \"short\"|\"full-preview\"){\n  const previewOnly=true,fullLength=mode===\"full-preview\";');
s=s.replace('duration:previewOnly?15:brief.duration,previewOnly','duration:fullLength?brief.duration:15,previewOnly');
s=s.replace('setOriginalDraft({project:ready,brief,lyrics:ready.generatedLyrics??\'\'})','setOriginalDraft({project:ready,brief,lyrics:ready.generatedLyrics??\'\',fullLength,saved:false})');
s=s.replace("setStatus(previewOnly?'Original draft ready. Listen before creating the full song.':brief.instrumental?'Original instrumental saved to your library.':'Original song saved. Vocal output is a guide singer until converted to Mana.')","setStatus(fullLength?'Full preview ready. Listen and seek, then save this exact version without regenerating.':'Short preview ready. It may contain only the introduction.')");
const insert=s.indexOf(' async function convert(){');
s=s.slice(0,insert)+` function saveOriginalPreview(){if(!originalDraft?.fullLength||originalDraft.saved||busy)return;if(state.current.projects.length>=50){setStatus('Library is full. Remove an entry first.');return;}const project={...originalDraft.project,settings:{...originalDraft.project.settings,wholeSong:true}};save({...state.current,projects:[project,...state.current.projects],selectedId:project.id});setOriginalDraft({...originalDraft,project,saved:true});setStatus('Original song saved from this preview. No regeneration.');}\n`+s.slice(insert);
const audioStart=s.indexOf(' {url&&<audio ref={audio}');const audioEnd=s.indexOf('/>}',audioStart)+3;const audio=s.slice(audioStart,audioEnd).trim().replace('{url&&','url?').replace('/>}','/>:null');
s=s.slice(0,audioStart)+' {tab===\'player\'&&playbackAudio}'+s.slice(audioEnd);
s=s.replace(' return <section className="music-studio"',` const playbackAudio=${audio.replace('<audio ref=',"<audio controls={tab==='original'} aria-label=\"Original song preview player\" ref=")};\n return <section className="music-studio"`);
s=s.replace('draft={originalDraft?{path:originalDraft.project.mix,brief:originalDraft.brief,lyrics:originalDraft.lyrics}:undefined}','draft={originalDraft?{path:originalDraft.project.mix,brief:originalDraft.brief,lyrics:originalDraft.lyrics,fullLength:originalDraft.fullLength,saved:originalDraft.saved}:undefined} player={playbackAudio} previewPlaying={playing} onSavePreview={saveOriginalPreview}');
s=s.replace('</section></div><footer className="studio-status"',"</section></div>{tab!=='player'&&tab!=='original'&&<div hidden>{playbackAudio}</div>}<footer className=\"studio-status\"");
fs.writeFileSync(p,s);
p='src/components/OriginalSongPanel.tsx';s=fs.readFileSync(p,'utf8').replace("import {useState}","import {useState,type ReactNode}");
s=s.replace('onCover,onStop,log}', 'onCover,onStop,log,player,previewPlaying,onSavePreview}');
s=s.replace('preview:boolean)=>void;draft?:{path:string;brief:OriginalBrief;lyrics:string};','preview:"short"|"full-preview")=>void;draft?:{path:string;brief:OriginalBrief;lyrics:string;fullLength:boolean;saved:boolean};player?:ReactNode;previewPlaying?:boolean;onSavePreview?:()=>void;');
s=s.replace('originalFingerprint(brief)===originalFingerprint(draft.brief);','originalFingerprint(brief)===originalFingerprint(draft.brief)&&brief.duration===draft.brief.duration;');
s=s.replace('Shape the music, listen to a short draft, then create your full song.','Shape the music, preview the whole song, then save the version you like.');
const a=s.indexOf('   <p className="hint-soft">Start with about 15 seconds.');const b=s.indexOf('   {busy&&',a);
s=s.slice(0,a)+`   <p className="hint-soft">Full preview uses your song length so you can hear the vocals after the introduction.</p>
   <button className="btn primary" disabled={busy||!brief} onClick={()=>brief&&onGenerate(title,brief,'full-preview')}>Generate full preview</button>
   <button className="btn" disabled={busy||!matching||!draft?.fullLength||draft.saved} onClick={onSavePreview}>{draft?.saved?'Saved to library':'Save this version to library'}</button>
   <p className="hint-soft">Saving keeps this exact audio. It does not generate the song again.</p>
   <details className="original-short-preview"><summary>Quick instrumental / intro check</summary><p className="hint-soft">A 15-second preview may end before singing starts.</p><button className="btn" disabled={busy||!brief} onClick={()=>brief&&onGenerate(title,brief,'short')}>Make 15-second preview</button></details>
   <button className="btn original-variation" disabled={busy} onClick={()=>setSeed(Math.floor(Math.random()*2147483648))}>New variation · change seed</button>
   <p className="hint-soft">The same idea and seed can repeat the same song. Change the seed for a different rendition.</p>
   {draft&&<div className="original-draft-actions"><strong>{draft.fullLength?'Full song preview':'15-second preview'}</strong><button className="btn" disabled={busy} onClick={()=>onPreview(draft.path)}>{previewPlaying?'Pause preview':'Play preview'}</button>{player&&<div className="original-preview-player">{player}</div>}{!matching&&<p className="hint-soft">Settings changed. This player still contains the previous preview; generate a new preview to hear the new settings.</p>}{!draft.brief.instrumental&&<button className="btn" disabled={busy} onClick={()=>onCover(draft.path)}>Create Mana cover</button>}{draft.lyrics&&draft.lyrics!=='[Instrumental]'&&<details><summary>Generated lyrics</summary><pre className="studio-log">{draft.lyrics}</pre></details>}</div>}
`+s.slice(b);
fs.writeFileSync(p,s);
p='src-tauri/src/singing.rs';s=fs.readFileSync(p,'utf8').replace('    if preview_only&&duration>20.0{return Err("Draft previews must be at most 20 seconds.".into());}','    // Preview-only controls library discovery, not length; full previews use\n    // the same validated 10–180 second boundary as saved original songs.');fs.writeFileSync(p,s);
