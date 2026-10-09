import {useEffect,useState} from 'react';
import {open,save} from '@tauri-apps/plugin-dialog';
import {invoke} from '@tauri-apps/api/core';
import {createBackup,snapshotBackup,validateBackup,restoreBackup} from '../core/backup';
import {dataHealth,compareBackups} from '../core/dataHealth';
import type {Backup} from '../core/backup';
import {inTauri} from '../core/useLlama';
export default function BackupPanel({ready,onBusy}:{ready:boolean;onBusy:(busy:boolean)=>void}){
 const [preview,setPreview]=useState<Backup|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const [current,setCurrent]=useState<Backup|null>(null),[safetyFiles,setSafetyFiles]=useState<string[]>([]);
 useEffect(()=>{try{setCurrent(snapshotBackup());}catch(e){setStatus(`Could not inspect saved data: ${String(e)}`);}if(inTauri)void invoke<string[]>('list_safety_backups').then(setSafetyFiles).catch(e=>setStatus(String(e)));},[]);
 async function inspect(path:string){setPreview(null);const raw=await invoke<string>('read_backup_file',{path});const incoming=validateBackup(raw);setCurrent(await createBackup());setPreview(incoming);}
 const health=current?dataHealth(current):null;
 const incomingHealth=preview?dataHealth(preview):null;
 async function run(task:()=>Promise<void>){if(!ready||busy)return;setBusy(true);onBusy(true);setStatus('');try{await task();}catch(e){setStatus(String(e));}finally{setBusy(false);onBusy(false);}}
 return <section><h3>Saved data overview</h3>
 {health&&<><table className="data-table"><tbody>{health.counts.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.count}</td></tr>)}</tbody></table><p className="hint-soft">Snapshot size: {(health.bytes/1024).toFixed(1)} KB. Counts describe saved records, not completed work.</p><details><summary>Data checks ({health.notes.length} notes)</summary>{health.notes.length?health.notes.map((note,i)=><p key={i}>{note}</p>):<p>No missing links or duplicate daily dates found by these checks.</p>}<p className="hint-soft">Checks are read-only. Deleted goals or parent revisions can explain missing links; records are never removed or repaired automatically.</p></details></>}
 <button className="btn" disabled={!ready||busy} onClick={()=>void run(async()=>{setCurrent(await createBackup());})}>Refresh overview</button>
 <h3>Backup and restore</h3><p className="hint-soft">Backups include settings, chat, identity, memories, diary and Recently deleted, goals, work, playtests, saved attachment images and companion state. Model files and avatar images are not included. The JSON file contains private conversation data, retained images and local paths. Older backups and safety copies may retain deleted images. Stop the model before using these controls.</p>
 <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{const backup=await createBackup();const path=await save({defaultPath:`Mana-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,filters:[{name:'Mana backup',extensions:['json']}]});if(!path)return;await invoke('write_backup_file',{path,content:JSON.stringify(backup,null,2)});setStatus('Backup exported.');})}>Export backup</button>
 <button className="btn" disabled={!ready||busy||!inTauri} onClick={()=>void run(async()=>{setPreview(null);const path=await open({multiple:false,filters:[{name:'Mana backup',extensions:['json']}]});if(typeof path==='string')await inspect(path);})}>Choose backup to restore</button>
 {preview&&<article className="memory-card"><h4>Restore preview</h4><p>Backup from {new Date(preview.createdAt).toLocaleString()}</p>
 {current&&<table className="data-table"><thead><tr><th scope="col">Records</th><th scope="col">Current</th><th scope="col">Backup</th></tr></thead><tbody>{compareBackups(current,preview).map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.current}</td><td>{row.incoming}</td></tr>)}</tbody></table>}
 {!!incomingHealth?.notes.length&&<details><summary>Backup data notes ({incomingHealth.notes.length})</summary>{incomingHealth.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}
 <p className="hint-soft">Equal counts do not mean identical contents. Restore replaces all saved data and reloads Mana. A safety backup of current data is saved first; restore stops if it cannot be saved. Saved paths may need adjustment on another computer.</p><button className="btn" disabled={!ready||busy} onClick={()=>{if(window.confirm('Replace all saved data with this backup and reload Mana? A safety copy of current data will be saved first.'))void run(async()=>{await restoreBackup(preview);});}}>Restore this backup</button><button className="btn" disabled={busy} onClick={()=>setPreview(null)}>Cancel preview</button></article>}
 <details><summary>Safety backups ({safetyFiles.length} recent files)</summary><p className="hint-soft">Created before restores and retained locally. Selecting one opens a preview only. The latest 20 are shown; older files stay in Mana's app-data backups folder.</p>{!safetyFiles.length&&<p>No safety backups yet.</p>}{safetyFiles.map(path=><div key={path}><p className="memory-content">{path}</p><button className="btn" disabled={!ready||busy} onClick={()=>void run(async()=>inspect(path))}>Preview safety backup</button></div>)}</details>
 <p role="status">{status}</p></section>;
}
