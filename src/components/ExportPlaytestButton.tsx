import ExportNotice from './ExportNotice';
import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {playtestText} from '../core/playtestExport';
import type {Playtest} from '../core/playtests';

export default function ExportPlaytestButton({report}:{report:Playtest}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[exportPath,setExportPath]=useState('');
 async function exportText(){
   if(working)return;
   const content=playtestText(report);
   setWorking(true);setStatus('');setExportPath('');
   try{const path=await invoke<string>('export_playtest',{content});setExportPath(path);}
   catch(e){setStatus(`Export failed: ${String(e)}`);}finally{setWorking(false);}
 }
 return <><button className="btn" title="Save a text copy in exports\playtests" disabled={working||!inTauri} onClick={()=>void exportText()}>{working?'Exporting…':'Export report'}</button><ExportNotice status={status} path={exportPath}/></>;
}
