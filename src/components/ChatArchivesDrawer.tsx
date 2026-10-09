import ImageReportView from './ImageReportView';
import type { SavedImage } from '../core/savedImages';
import {useMemo,useState} from 'react';
import type {ChatArchive} from '../core/chatArchives';
import {searchChat} from '../core/chatSearch';
import {cleanReply} from '../core/emotion';
import ExportChatButton from './ExportChatButton';

export default function ChatArchivesDrawer({archives,charName,userName,onDelete,onClose,savedImages}:{savedImages:SavedImage[];archives:ChatArchive[];charName:string;userName:string;onDelete:(id:string)=>void;onClose:()=>void}){
 const [query,setQuery]=useState(''),[selected,setSelected]=useState<string|null>(null);
 const matches=useMemo(()=>archives.map(archive=>({archive,ids:searchChat(archive.messages,query,charName)})).filter(row=>!query.trim()||row.ids.length||row.archive.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[archives,query,charName]);
 const active=archives.find(a=>a.id===selected);
 const hitIds=new Set(active?searchChat(active.messages,query,charName):[]);
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Chat archives">
 <header className="drawer-head"><h2>Chat archives</h2><button className="btn" onClick={onClose}>Close</button></header>
 <div className="drawer-body"><p>Saved conversations are read-only and stay separate from current chat, memory recall and diary sources. Up to 50 archives; delete an old archive to make room.</p>
 <label>Search archives<input type="search" value={query} maxLength={200} onChange={e=>setQuery(e.target.value)} /></label>
 <p role="status">{matches.length} of {archives.length} archives</p>
 {matches.map(({archive,ids})=><div className="progress-card" key={archive.id}><b>{archive.title}</b><p>{new Date(archive.createdAt).toLocaleString()} · {archive.messages.length} messages{query.trim()?` · ${ids.length} matching messages`:''}</p><button className="btn" onClick={()=>setSelected(archive.id)}>View conversation</button><button className="btn" onClick={()=>{if(window.confirm(`Permanently delete archive "${archive.title}"?`)){onDelete(archive.id);if(selected===archive.id)setSelected(null);}}}>Delete archive</button></div>)}
 {!matches.length&&<p>{archives.length?'No matching archives.':'No archived conversations yet.'}</p>}
 {active&&<article><h3>{active.title}</h3><ExportChatButton messages={active.messages} charName={charName} userName={userName} title={active.title}/><p>Matches are outlined below.</p>{active.messages.map(m=><div key={m.id} className={`progress-card${hitIds.has(m.id)?' archive-match':''}`}><b>{m.role==='user'?'You':charName}</b><p className="memory-content">{m.role==='user'?m.content:cleanReply(m.content,charName).text}</p>{m.imageReport&&<ImageReportView report={m.imageReport} images={savedImages}/>}{m.error&&<p className="msg-error">{m.error}</p>}</div>)}</article>}
 </div></section></>;
}
