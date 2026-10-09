import ExportNotice from './ExportNotice';
import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {workText} from '../core/workExport';
import type {WorkArtifact} from '../core/work';

export default function ExportWorkButton({artifact}:{artifact:WorkArtifact}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[exportPath,setExportPath]=useState('');
 async function exportText(){
   if(working)return;
   const content=workText(artifact);
   setWorking(true);setStatus('');setExportPath('');
   try{const path=await invoke<string>('export_work',{content});setExportPath(path);}
   catch(e){setStatus(`Export failed: ${String(e)}`);}finally{setWorking(false);}
 }
 return <><button className="btn" title="Save a text copy in exports\work" disabled={working||!inTauri} onClick={()=>void exportText()}>{working?'Exporting…':'Export draft'}</button><ExportNotice status={status} path={exportPath}/></>;
}
