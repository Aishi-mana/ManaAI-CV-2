import type {RecordedEvent} from './events';
import type {Episode} from './episodes';

export interface TimelineItem {source:RecordedEvent;memory:Episode|null}
/** One row per recorded event, including evidence preserved by a reviewed memory. */
export function buildTimeline(events:RecordedEvent[],episodes:Episode[]):TimelineItem[]{
 const rows=new Map<string,TimelineItem>();
 for(const source of events)rows.set(source.eventId,{source,memory:null});
 for(const memory of episodes)rows.set(memory.source.eventId,{source:memory.source,memory});
 return [...rows.values()].sort((a,b)=>Date.parse(b.source.recordedAt)-Date.parse(a.source.recordedAt)||a.source.eventId.localeCompare(b.source.eventId));
}
export function timelineDate(time:string,timeZone:string):string{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
 const part=(type:string)=>parts.find(p=>p.type===type)?.value??'';
 return `${part('year')}-${part('month')}-${part('day')}`;
}
export function filterTimeline(items:TimelineItem[],query:string,scope:'all'|'reviewed'|'special',from:string,to:string,timeZone:string):TimelineItem[]{
 const needle=query.trim().toLowerCase();
 return items.filter(({source,memory})=>{
  const date=timelineDate(source.recordedAt,timeZone);
  return (!from||date>=from)&&(!to||date<=to)&&(scope==='all'||scope==='reviewed'&&!!memory||scope==='special'&&memory?.kind==='special')&&`${source.title} ${source.outcome} ${source.kind} ${memory?.content??''} ${memory?.tags.join(' ')??''}`.toLowerCase().includes(needle);
 });
}
