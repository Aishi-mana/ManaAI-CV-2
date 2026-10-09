import {useEffect,useState} from 'react';
import {EPISODE_LIMIT,reviewedEpisode} from '../core/episodes';
import type {Episode} from '../core/episodes';
import type {RecordedEvent} from '../core/events';

export default function EpisodesReview({source,entries,editable,onChange,onDone}:{source:RecordedEvent|null;entries:Episode[];editable:boolean;onChange:(entries:Episode[])=>void;onDone:()=>void}){
 const [editing,setEditing]=useState<Episode|null>(null),[content,setContent]=useState(''),[kind,setKind]=useState<Episode['kind']>('episode'),[tags,setTags]=useState(''),[query,setQuery]=useState('');
 const existing=source?entries.find(e=>e.source.eventId===source.eventId):undefined;
 const selected=editing?.source??source;
 useEffect(()=>{if(source){setEditing(null);setContent(`${source.title}: ${source.outcome}`);setKind('episode');setTags('');}},[source]);
 const draftContent=content;
 function cancel(){setEditing(null);setContent('');setTags('');setKind('episode');onDone();}
 function edit(e:Episode){setEditing(e);setContent(e.content);setKind(e.kind);setTags(e.tags.join(', '));}
 return <section aria-label="Reviewed episodic memories"><h3>Episodic memories &amp; special moments ({entries.length}/{EPISODE_LIMIT})</h3><p className="hint-soft">Review what this event means to remember it. Saved notes can be recalled in relevant chat; the recorded outcome remains separate evidence. One note per event. Deleting history keeps the saved source snapshot here.</p>
 {selected&&<article className="memory-card"><h3>Review memory</h3><p>{selected.title}</p><p className="hint-soft">{selected.outcome}</p>{existing&&!editing?<><p>This event already has a memory.</p><button className="btn" onClick={()=>edit(existing)}>Edit saved memory</button><button className="btn" onClick={cancel}>Cancel</button></>:<>
 <label className="field"><span>What should be remembered?</span><textarea rows={3} maxLength={2000} value={draftContent} onChange={e=>setContent(e.target.value)}/></label>
 <label className="field"><span>Type</span><select value={kind} onChange={e=>setKind(e.target.value as Episode['kind'])}><option value="episode">Episodic memory</option><option value="special">Special moment</option></select></label>
 <label className="field"><span>Tags (comma-separated, up to 8)</span><input maxLength={400} value={tags} onChange={e=>setTags(e.target.value)}/></label>
 <button className="btn primary" disabled={!editable||!draftContent.trim()||(!editing&&entries.length>=EPISODE_LIMIT)} onClick={()=>{const note=reviewedEpisode(selected,draftContent,kind,tags,editing??undefined);if(note){onChange(editing?entries.map(e=>e.id===editing.id?note:e):[...entries,note]);cancel();}}}>{editing?'Save changes':'Save reviewed memory'}</button><button className="btn" onClick={cancel}>Cancel</button></> }</article>}
 <label className="field"><span>Search saved moments</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {[...entries].reverse().filter(e=>`${e.content} ${e.tags.join(' ')} ${e.source.title}`.toLowerCase().includes(query.trim().toLowerCase())).map(e=><article className="memory-card" key={e.id}><b>{e.kind==='special'?'Special moment':'Episodic memory'}</b><p className="memory-content">{e.content}</p><p className="hint-soft">{e.tags.join(' · ')} · Saved {new Date(e.createdAt).toLocaleString()}</p><details><summary>Recorded source</summary><p>{e.source.title}</p><p>{e.source.outcome}</p><p className="hint-soft">{new Date(e.source.recordedAt).toLocaleString()} · {e.source.kind}: {e.source.id} · Event: {e.source.eventId}</p></details><button className="btn" disabled={!editable} onClick={()=>edit(e)}>Edit memory</button><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Delete this episodic memory? Event history and its original source stay unchanged.')){onChange(entries.filter(x=>x.id!==e.id));if(editing?.id===e.id)cancel();}}}>Delete memory</button></article>)}
 {entries.length>=EPISODE_LIMIT&&<p role="status">Memory limit reached. Delete a saved note to make room. Nothing is automatically pruned.</p>}
 </section>;
}
