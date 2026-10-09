import ExportNotice from './ExportNotice';
import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {activityText} from '../core/activityExport';
import type {SharedSession} from '../core/sharedActivities';

export default function ExportActivityButton({session,name,generating}:{session:SharedSession;name:string;generating:boolean}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[exportPath,setExportPath]=useState('');
 async function exportText(){
   if(working||generating)return;
   const content=activityText(session,name);
   setWorking(true);setStatus('');setExportPath('');
   try{const path=await invoke<string>('export_activity',{content});setExportPath(path);}
   catch(e){setStatus(`Export failed: ${String(e)}`);}finally{setWorking(false);}
 }
 return <><button className="btn" title="Save a text copy in exports\activities" disabled={working||generating||!inTauri} onClick={()=>void exportText()}>{working?'Exporting…':'Export transcript'}</button><ExportNotice status={status} path={exportPath}/></>;
}
