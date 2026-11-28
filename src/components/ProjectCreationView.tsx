import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {projectCreationSvg,type ProjectCreation} from '../core/projectCreations';
import {townCharacterName,type TownCharacter} from '../core/townCharacters';
import ExportNotice from './ExportNotice';

export default function ProjectCreationView({creation,owner}:{creation:ProjectCreation;owner:TownCharacter}){
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[path,setPath]=useState('');
 const svg=projectCreationSvg(creation,townCharacterName(owner));
 async function exportCreation(){
  if(working)return;setWorking(true);setStatus('');setPath('');
  try{
   if(inTauri)setPath(await invoke<string>('export_town_creation',{content:svg}));
   else{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download=`manaverse-${owner}-${creation.kind}.svg`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Creation downloaded.');}
  }catch(error){setStatus(`Could not export: ${String(error)}`);}finally{setWorking(false);}
 }
 return <section className="project-creation" aria-label={`Saved creation: ${creation.title}`}>
  <h4>{creation.title}</h4>
  <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`${creation.kind} illustration: ${creation.design}`}/>
  <div className="project-creation-transcript">{creation.lines.map((line,index)=><p key={index}>{line}</p>)}</div>
  <p className="hint-soft">AI-written digital page with a simple illustrated design.</p>
  <button type="button" className="btn" disabled={working} onClick={()=>void exportCreation()}>{working?'Saving…':'Export creation'}</button>
  <ExportNotice status={status} path={path}/>
 </section>;
}
