import ExportNotice from './ExportNotice';
import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {conversationText} from '../core/chatExport';
import type {Msg} from '../core/types';

export default function ExportChatButton({messages,charName,userName,title,disabled=false}:{messages:Msg[];charName:string;userName:string;title?:string;disabled?:boolean}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[exportPath,setExportPath]=useState('');
 async function exportText(){
   if(working||disabled||!messages.length)return;
   const content=conversationText(messages,charName,userName,title);
   setWorking(true);setStatus('');setExportPath('');
   try{
     const path=await invoke<string>('export_conversation',{content});setExportPath(path);
   }catch(e){setStatus(`Export failed: ${String(e)}`);}finally{setWorking(false);}
 }
 return <><button className="btn" title="Save a text copy in C:\AI\ManaAI-CV-2\exports\conversations" disabled={disabled||working||!messages.length||!inTauri} onClick={()=>void exportText()}>{working?'Exporting…':'Export text'}</button><ExportNotice status={status} path={exportPath}/></>;
}
