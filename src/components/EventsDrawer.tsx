import {useState} from 'react';
import {EVENT_KINDS} from '../core/events';
import type {RecordedEvent,EventKind} from '../core/events';
import EpisodesReview from './EpisodesReview';
import {EPISODE_LIMIT,reviewedEpisode,type Episode} from '../core/episodes';
import GrowthTimeline from './GrowthTimeline';
import type {Relationship} from '../core/relationship';

export default function EventsDrawer({events,onChange,onClose,editable,episodes,onEpisodes,relationship,timeZone}:{events:RecordedEvent[];onChange:(events:RecordedEvent[])=>void;onClose:()=>void;editable:boolean;episodes:Episode[];onEpisodes:(entries:Episode[])=>void;relationship:Relationship;timeZone:string}){
 const [shown,setShown]=useState(100);
 const [tab,setTab]=useState<'history'|'timeline'>('history');
 const [source,setSource]=useState<RecordedEvent|null>(null);
 const [query,setQuery]=useState('');const [kind,setKind]=useState<EventKind|'all'>('all');
 function savePortraitMoment(event:RecordedEvent) {
  if(!editable||event.kind!=='portrait'||episodes.length>=EPISODE_LIMIT||episodes.some(note=>note.source.eventId===event.eventId))return;
  const moment=reviewedEpisode(event,event.outcome,'special','portrait');
  if(moment)onEpisodes([...episodes,moment]);
 }
 const matches=[...events].reverse().filter(e=>(kind==='all'||e.kind===kind)&&`${e.title} ${e.outcome} ${e.id}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Recorded event history"><header className="drawer-head"><h2>Recorded event history</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <div className="tabs" role="tablist" aria-label="History views"><button className="tab" role="tab" aria-selected={tab==='history'} onClick={()=>setTab('history')}>History &amp; memories</button><button className="tab" role="tab" aria-selected={tab==='timeline'} onClick={()=>setTab('timeline')}>Our timeline</button></div>
 {tab==='timeline'?<GrowthTimeline events={events} episodes={episodes} relationship={relationship} timeZone={timeZone} canSavePortraitMoment={editable&&episodes.length<EPISODE_LIMIT} onSavePortraitMoment={savePortraitMoment}/>:<>
 <p>Records saved actions from this update onward. Goal and activity completion is user-recorded; drafts and simulated reflections are not proof of executed work. History does not automatically change memories or identity.</p>
 <p>{events.length} saved records. Older history stays saved as new moments are added.</p>
 <label>Search history<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <label>Category<select value={kind} onChange={e=>setKind(e.target.value as EventKind|'all')}><option value="all">All</option>{EVENT_KINDS.map(k=><option key={k} value={k}>{k==='portrait'?'Portrait interactions':k}</option>)}</select></label>
 <EpisodesReview source={source} entries={episodes} editable={editable} onChange={onEpisodes} onDone={()=>setSource(null)}/>
 <h3>Recorded events</h3><p>{matches.length} matching records</p>
 {matches.slice(0,shown).map(e=><article className="memory-card" key={e.eventId}><h3>{e.title}</h3><p className="hint-soft">{new Date(e.recordedAt).toLocaleString()} · {e.kind}</p><p>{e.outcome}</p><details><summary>Source reference</summary><p className="memory-content">{e.kind}: {e.id}</p><p className="hint-soft">This reference identifies the saved source. It may have since changed or been deleted. This history keeps its own brief snapshot.</p></details><button className="btn" disabled={!editable} onClick={()=>setSource(e)}>Review as memory</button><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Delete this history record? The source stays unchanged.'))onChange(events.filter(x=>x.eventId!==e.eventId));}}>Delete record</button></article>)}
 {matches.length>shown&&<button className="btn" onClick={()=>setShown(value=>value+100)}>Load older records</button>}
 {events.length>0&&<button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Clear all event history? Goals, diaries and other sources stay unchanged.'))onChange([]);}}>Clear history</button>}
 </>}
 </div></section></>;
}
