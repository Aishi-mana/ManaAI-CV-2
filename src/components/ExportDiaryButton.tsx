import ExportNotice from './ExportNotice';
import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {diaryText} from '../core/diaryExport';
import type {DiaryEntry} from '../core/diary';

export default function ExportDiaryButton({entries,name,all=false}:{entries:DiaryEntry[];name:string;all?:boolean}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[exportPath,setExportPath]=useState('');
 async function exportText(){
   if(working||!entries.some(entry=>!entry.deletedAt))return;
   const content=diaryText(entries,name);
   setWorking(true);setStatus('');setExportPath('');
   try{const path=await invoke<string>('export_diary',{content});setExportPath(path);}
   catch(e){setStatus(`Export failed: ${String(e)}`);}finally{setWorking(false);}
 }
 return <><button className="btn" title="Save a text copy in exports\diary" disabled={working||!entries.some(entry=>!entry.deletedAt)||!inTauri} onClick={()=>void exportText()}>{working?'Exporting…':all?'Export all active entries':'Export entry'}</button><ExportNotice status={status} path={exportPath}/></>;
}
