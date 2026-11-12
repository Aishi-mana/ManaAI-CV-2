import {useEffect,useState} from 'react';
import {open,save} from '@tauri-apps/plugin-dialog';
import {invoke} from '@tauri-apps/api/core';
import {createBackup,snapshotBackup,validateBackup,restoreBackup} from '../core/backup';
import {dataHealth,compareBackups} from '../core/dataHealth';
import type {Backup} from '../core/backup';
import {inTauri} from '../core/useLlama';
export default function BackupPanel({ready,onBusy}:{ready:boolean;onBusy:(busy:boolean)=>void}){
 const [portable,setPortable]=useState<{path:string;checksum:string;files:number}|null>(null),[includeModel,setIncludeModel]=useState(false),[includeAvatars,setIncludeAvatars]=useState(true),[includeVision,setIncludeVision]=useState(false),[includeRuntime,setIncludeRuntime]=useState(false);
 const [includeDeveloper,setIncludeDeveloper]=useState(false),[includeWhisper,setIncludeWhisper]=useState(false);
 const [preview,setPreview]=useState<Backup|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const [current,setCurrent]=useState<Backup|null>(null),[safetyFiles,setSafetyFiles]=useState<string[]>([]);
 useEffect(()=>{try{setCurrent(snapshotBackup());}catch(e){setStatus(`Could not inspect saved data: ${String(e)}`);}if(inTauri)void invoke<string[]>('list_safety_backups').then(setSafetyFiles).catch(e=>setStatus(String(e)));},[]);
 async function inspect(path:string){setPreview(null);setPortable(null);const raw=await invoke<string>('read_backup_file',{path});const incoming=validateBackup(raw);setCurrent(await createBackup());setPreview(incoming);}
 const health=current?dataHealth(current):null;
 const incomingHealth=preview?dataHealth(preview):null;
 async function run(task:()=>Promise<void>){if(!ready||busy)return;setBusy(true);onBusy(true);setStatus('');try{await task();}catch(e){setStatus(String(e));}finally{setBusy(false);onBusy(false);}}
 return <section><h3>Saved data overview</h3><p className="hint-soft">Disk gallery backups contain thumbnails and the image index, not the full picture files. Also copy the gallery folder shown in Image gallery when moving or backing up your collection. Deleted disk pictures cannot be restored from an index-only backup.</p>
 {health&&<><table className="data-table"><tbody>{health.counts.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.count}</td></tr>)}</tbody></table><p className="hint-soft">Snapshot size: {(health.bytes/1024).toFixed(1)} KB. Counts describe saved records, not completed work.</p><details><summary>Data checks ({health.notes.length} notes)</summary>{health.notes.length?health.notes.map((note,i)=><p key={i}>{note}</p>):<p>No missing links or duplicate daily dates found by these checks.</p>}<p className="hint-soft">Checks are read-only. Deleted goals or parent revisions can explain missing links; records are never removed or repaired automatically.</p></details></>}
 <button className="btn" disabled={!ready||busy} onClick={()=>void run(async()=>{setCurrent(await createBackup());})}>Refresh overview</button>
 <h3>Backup and restore</h3><p className="hint-soft">Backups include music drafts and library metadata, settings, chat, identity, memories, diary and Recently deleted, goals, work, playtests, saved attachment images and companion state. Model files and avatar images are not included. The JSON file contains private conversation data, retained images and local paths. Older backups and safety copies may retain deleted images. Stop the model before using these controls.</p>
 <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{const backup=await createBackup();const path=await save({defaultPath:`Mana-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,filters:[{name:'Mana backup',extensions:['json']}]});if(!path)return;await invoke('write_backup_file',{path,content:JSON.stringify(backup)});setStatus('Backup exported.');})}>Export backup</button>
 <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{setPreview(null);const path=await open({multiple:false,filters:[{name:'Mana backup',extensions:['json']}]});if(typeof path==='string')await inspect(path);})}>Choose backup to restore</button>
 <details>
  <summary>Portable backup</summary>
  <p className="hint-soft">The ZIP includes the data snapshot, available music files referenced by the library or drafts, and full disk gallery images. Choose which avatar files, models and runtime to bundle. Restore archives containing a runtime only from sources you trust. Mana turns off automatic startup when restoring a bundled runtime.</p>
  <label className="check"><input type="checkbox" checked={includeModel} disabled={busy} onChange={event=>setIncludeModel(event.target.checked)}/> Include selected chat model</label>
  <label className="check"><input type="checkbox" checked={includeAvatars} disabled={busy} onChange={event=>setIncludeAvatars(event.target.checked)}/> Include custom avatar and installed Wardrobe items</label>
  <label className="check"><input type="checkbox" checked={includeVision} disabled={busy} onChange={event=>setIncludeVision(event.target.checked)}/> Include vision model and projector</label>
  <label className="check"><input type="checkbox" checked={includeRuntime} disabled={busy} onChange={event=>setIncludeRuntime(event.target.checked)}/> Include llama-server and its DLLs</label>
  <label className="check"><input type="checkbox" checked={includeDeveloper} disabled={busy} onChange={event=>setIncludeDeveloper(event.target.checked)}/> Include Game Dev model</label>
  <label className="check"><input type="checkbox" checked={includeWhisper} disabled={busy} onChange={event=>setIncludeWhisper(event.target.checked)}/> Include Whisper model, executable and DLLs</label>
  <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{
   const path=await save({defaultPath:'Mana-portable-backup.zip',filters:[{name:'Mana portable backup',extensions:['zip']}]});
   if(!path)return;
   const result=await invoke<{files:number;missing:number}>('portable_backup',{operation:'export',path,content:JSON.stringify(await createBackup()),model:includeModel,avatars:includeAvatars,vision:includeVision,runtime:includeRuntime,developer:includeDeveloper,whisper:includeWhisper});
   setStatus('Portable backup exported with '+result.files+' files.'+(result.missing?' '+result.missing+' referenced files were missing from this installation.':''));
  })}>Export portable backup</button>
  <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{
   setPreview(null);setPortable(null);
   const path=await open({multiple:false,filters:[{name:'Mana portable backup',extensions:['zip']}]});
   if(typeof path!=='string')return;
   const result=await invoke<{content:string;checksum:string;files:number}>('portable_backup',{operation:'inspect',path});
   const incoming=validateBackup(result.content);
   setCurrent(await createBackup());setPortable({path,checksum:result.checksum,files:result.files});setPreview(incoming);
  })}>Choose portable backup to restore</button>
 </details>
 {preview&&<article className="memory-card"><h4>Restore preview</h4>{portable&&<p>{portable.files} bundled files. Existing files must match before restore can continue.</p>}<p>Backup from {new Date(preview.createdAt).toLocaleString()}</p>
 {current&&<table className="data-table"><thead><tr><th scope="col">Records</th><th scope="col">Current</th><th scope="col">Backup</th></tr></thead><tbody>{compareBackups(current,preview).map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.current}</td><td>{row.incoming}</td></tr>)}</tbody></table>}
 {!!incomingHealth?.notes.length&&<details><summary>Backup data notes ({incomingHealth.notes.length})</summary>{incomingHealth.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}
 <p className="hint-soft">Equal counts do not mean identical contents. Restore replaces all saved data and reloads Mana. A safety backup of current data is saved first; restore stops if it cannot be saved. Saved paths may need adjustment on another computer.</p><button className="btn" disabled={!ready||busy} onClick={()=>{if(window.confirm('Replace all saved data with this backup and reload Mana? A safety copy of current data will be saved first.'))void run(async()=>{await restoreBackup(preview,portable?async()=>{await invoke('portable_backup',{operation:'restore',path:portable.path,checksum:portable.checksum});}:undefined);});}}>Restore this backup</button><button className="btn" disabled={busy} onClick={()=>{setPreview(null);setPortable(null);}}>Cancel preview</button></article>}
 <details><summary>Safety backups ({safetyFiles.length} recent files)</summary><p className="hint-soft">Created before restores and retained locally. Selecting one opens a preview only. The latest 20 are shown; older files stay in Mana's app-data backups folder.</p>{!safetyFiles.length&&<p>No safety backups yet.</p>}{safetyFiles.map(path=><div key={path}><p className="memory-content">{path}</p><button className="btn" disabled={!ready||busy} onClick={()=>void run(async()=>inspect(path))}>Preview safety backup</button></div>)}</details>
 <p role="status">{status}</p></section>;
}
