import {useMemo,useState} from 'react';
import {buildTimeline,filterTimeline,timelineDate} from '../core/timeline';
import type {RecordedEvent} from '../core/events';
import type {Episode} from '../core/episodes';
import type {Relationship} from '../core/relationship';

export default function GrowthTimeline({events,episodes,relationship,timeZone}:{events:RecordedEvent[];episodes:Episode[];relationship:Relationship;timeZone:string}){
 const [query,setQuery]=useState(''),[scope,setScope]=useState<'all'|'reviewed'|'special'>('all'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[oldest,setOldest]=useState(false);
 const items=useMemo(()=>buildTimeline(events,episodes),[events,episodes]);
 const filtered=filterTimeline(items,query,scope,from,to,timeZone);if(oldest)filtered.reverse();
 const groups=new Map<string,typeof filtered>();for(const item of filtered){const day=timelineDate(item.source.recordedAt,timeZone);groups.set(day,[...(groups.get(day)??[]),item]);}
 return <section aria-label="Relationship and growth timeline"><h3>Our recorded journey</h3>
 <p>Shared history, reviewed memories and special moments, arranged by the original event date. These records show saved actions and your interpretation; they do not measure personal growth or prove feelings.</p>
 <p className="hint-soft">Current fictional relationship stats: Bond {relationship.bond}/100 · Affection {relationship.affection}/100. This is the current snapshot; historical scores were not recorded and are not reconstructed.</p>
 <p>{items.length} recorded events · {episodes.length} reviewed memories · {episodes.filter(e=>e.kind==='special').length} special moments</p>
 <label className="field"><span>Search journey</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <label className="field"><span>Show</span><select value={scope} onChange={e=>setScope(e.target.value as typeof scope)}><option value="all">All recorded events</option><option value="reviewed">Reviewed memories</option><option value="special">Special moments</option></select></label>
 <div className="grid2"><label className="field"><span>From date</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="field"><span>Through date</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div>
 <label className="check"><input type="checkbox" checked={oldest} onChange={e=>setOldest(e.target.checked)}/>Oldest first</label>
 <p className="hint-soft">Dates use {timeZone}. Saved memories keep their source snapshot after event history is cleared. Manage records in the History tab.</p>
 {from&&to&&from>to?<p role="alert">Choose an end date on or after the start date.</p>:<>
 <p>{filtered.length} matching events</p>
 {filtered.length===0&&<p>No recorded moments match yet.</p>}
 {[...groups].map(([day,rows])=><section key={day}><h3>{day}</h3>{rows.map(({source,memory})=><article className="memory-card" key={source.eventId}><h4>{source.title}</h4><p className="hint-soft">{new Date(source.recordedAt).toLocaleTimeString(undefined,{timeZone})} · {source.kind}{memory?` · ${memory.kind==='special'?'Special moment':'Reviewed memory'}`:''}</p><p>{source.outcome}</p>{memory&&<><p className="memory-content"><b>Your reviewed note:</b> {memory.content}</p><p className="hint-soft">{memory.tags.join(' · ')} · Note saved {new Date(memory.createdAt).toLocaleString(undefined,{timeZone})}</p></>}<details><summary>Source reference</summary><p className="memory-content">{source.kind}: {source.id} · Event: {source.eventId}</p><p className="hint-soft">The source may since have changed or been deleted. This is its recorded snapshot.</p></details></article>)}</section>)}
 </>}
 </section>;
}
