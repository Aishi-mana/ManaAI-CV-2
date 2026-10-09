import {useState} from 'react';
import {EVENT_KINDS,EVENT_LIMIT} from '../core/events';
import type {RecordedEvent,EventKind} from '../core/events';
import EpisodesReview from './EpisodesReview';
import type {Episode} from '../core/episodes';
import GrowthTimeline from './GrowthTimeline';
import type {Relationship} from '../core/relationship';

export default function EventsDrawer({events,onChange,onClose,editable,episodes,onEpisodes,relationship,timeZone}:{events:RecordedEvent[];onChange:(events:RecordedEvent[])=>void;onClose:()=>void;editable:boolean;episodes:Episode[];onEpisodes:(entries:Episode[])=>void;relationship:Relationship;timeZone:string}){
 const [tab,setTab]=useState<'history'|'timeline'>('history');
 const [source,setSource]=useState<RecordedEvent|null>(null);
 const [query,setQuery]=useState('');const [kind,setKind]=useState<EventKind|'all'>('all');
 const matches=[...events].reverse().filter(e=>(kind==='all'||e.kind===kind)&&`${e.title} ${e.outcome} ${e.id}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Recorded event history"><header className="drawer-head"><h2>Recorded event history</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <div className="tabs" role="tablist" aria-label="History views"><button className="tab" role="tab" aria-selected={tab==='history'} onClick={()=>setTab('history')}>History &amp; memories</button><button className="tab" role="tab" aria-selected={tab==='timeline'} onClick={()=>setTab('timeline')}>Our timeline</button></div>
 {tab==='timeline'?<GrowthTimeline events={events} episodes={episodes} relationship={relationship} timeZone={timeZone}/>:<>
 <p>Records saved actions from this update onward. Goal and activity completion is user-recorded; drafts and simulated reflections are not proof of executed work. History does not automatically change memories or identity.</p>
 <p>{events.length}/{EVENT_LIMIT} records. At the limit, new events stop recording until you remove records; nothing is automatically pruned.</p>
 <label>Search history<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <label>Category<select value={kind} onChange={e=>setKind(e.target.value as EventKind|'all')}><option value="all">All</option>{EVENT_KINDS.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
 <EpisodesReview source={source} entries={episodes} editable={editable} onChange={onEpisodes} onDone={()=>setSource(null)}/>
 <h3>Recorded events</h3><p>{matches.length} matching records</p>
 {events.length===EVENT_LIMIT&&<p role="status">History is full. New actions still work, but their events will not be recorded.</p>}
 {matches.map(e=><article className="memory-card" key={e.eventId}><h3>{e.title}</h3><p className="hint-soft">{new Date(e.recordedAt).toLocaleString()} · {e.kind}</p><p>{e.outcome}</p><details><summary>Source reference</summary><p className="memory-content">{e.kind}: {e.id}</p><p className="hint-soft">This reference identifies the saved source. It may have since changed or been deleted. This history keeps its own brief snapshot.</p></details><button className="btn" disabled={!editable} onClick={()=>setSource(e)}>Review as memory</button><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Delete this history record? The source stays unchanged.'))onChange(events.filter(x=>x.eventId!==e.eventId));}}>Delete record</button></article>)}
 {events.length>0&&<button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Clear all event history? Goals, diaries and other sources stay unchanged.'))onChange([]);}}>Clear history</button>}
 </>}
 </div></section></>;
}
