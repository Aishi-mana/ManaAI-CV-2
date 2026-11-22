import {readStored,writeStored} from './persistence';
import {isRecord,nonEmptyString} from './validation';
import {uid} from './types';
import {journalClock} from './clock';

export const EVENT_LIMIT=500;
export const EVENT_KINDS=['goal','work','playtest','activity','portrait','diary','thought','archive'] as const;
export type EventKind=typeof EVENT_KINDS[number];
export interface EventSource {id:string;kind:EventKind;title:string;outcome:string}
export interface RecordedEvent extends EventSource {eventId:string;recordedAt:string}
export function validateEvents(value:unknown):RecordedEvent[]{
 if(!Array.isArray(value))return [];
 const seen=new Set<string>();
 return value.flatMap((e):RecordedEvent[]=>{
  if(!isRecord(e)||!nonEmptyString(e.eventId)||seen.has(e.eventId)||!nonEmptyString(e.id)||!EVENT_KINDS.includes(e.kind as EventKind)||!nonEmptyString(e.title)||!nonEmptyString(e.outcome)||typeof e.recordedAt!=='string'||!Number.isFinite(Date.parse(e.recordedAt)))return [];
  seen.add(e.eventId);return [{eventId:e.eventId,id:e.id,kind:e.kind as EventKind,title:e.title.slice(0,200),outcome:e.outcome.slice(0,300),recordedAt:e.recordedAt}];
 }).slice(0,EVENT_LIMIT);
}
export function loadEvents():RecordedEvent[]{try{return validateEvents(JSON.parse(readStored('mana.events.v1')??'[]'));}catch{return [];}}
export const saveEvents=(events:RecordedEvent[])=>writeStored('mana.events.v1',JSON.stringify(validateEvents(events)));
// Compare to the mounted baseline: loading old records never invents new events.
// Deletions are not achievements. Unchanged render/save cycles do not duplicate history.
export function changedEventSources(previous:EventSource[],next:EventSource[]):EventSource[]{
 const old=new Map(previous.map(e=>[`${e.kind}:${e.id}`,e]));
 return next.filter(e=>{const before=old.get(`${e.kind}:${e.id}`);return !before||before.outcome!==e.outcome;});
}
export function appendEvents(history:RecordedEvent[],sources:EventSource[],now=new Date()):RecordedEvent[]{
 return [...history,...sources.slice(0,Math.max(0,EVENT_LIMIT-history.length)).map(s=>({...s,eventId:uid(),recordedAt:now.toISOString()}))];
}

export function appendRoomEvent(history:RecordedEvent[],action:string,title:string,outcome:string,timeZone:string,now=new Date()){
 const date=journalClock(now,timeZone).date;
 const id=`room-${date}-${action}`;
 if(history.length>=EVENT_LIMIT||history.some(event=>event.kind==='activity'&&event.id===id))return history;
 return appendEvents(history,[{id,kind:'activity',title:`Companion Room · ${title}`,outcome:outcome.slice(0,300)}],now);
}

export function roomEventSources(history:RecordedEvent[],timeZone:string){
 return history.filter(event=>event.kind==='activity'&&/^room-\d{4}-\d{2}-\d{2}-/.test(event.id))
  .map(event=>({title:event.title,activity:event.outcome,date:journalClock(new Date(event.recordedAt),timeZone).date,recordedAt:event.recordedAt}));
}

export function roomEventContext(history:RecordedEvent[],timeZone:string,query:string,inRoom=false){
 const specific=/\b(?:luna|lyra|pet bot|town square|workshop|park|library|coffee shop|living space|bedroom)\b/i;
 const topic=query.match(specific)?.[0];
 if(!inRoom&&!topic&&!/\b(?:manaverse|what did you do|what have you been up to|how was your day)\b/i.test(query))return '';
 const recent=roomEventSources(history,timeZone).reverse();
 const selected=topic?recent.filter(event=>`${event.title} ${event.activity}`.toLowerCase().includes(topic.toLowerCase())):recent;
 if(!selected.length)return '';
 const activity=selected.slice(0,5).map(({date,activity})=>({date,activity}));
 return '\nRecorded Manaverse activities (evidence only). Use their dates and never invent extra details: '+JSON.stringify(activity);
}

export function homeStoryDays(history:RecordedEvent[],publishedGames:readonly {title:string;publishedAt?:string}[],timeZone:string){
 const moments=roomEventSources(history,timeZone).map(({date,recordedAt,activity})=>({date,recordedAt,text:activity}));
 for(const game of publishedGames){
  if(!game.publishedAt)continue;
  moments.push({date:journalClock(new Date(game.publishedAt),timeZone).date,recordedAt:game.publishedAt,
   text:`Mana published “${game.title}” after its release check passed.`});
 }
 moments.sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
 const days=new Map<string,string[]>();
 for(const moment of moments){
  const day=days.get(moment.date);
  if(day)day.push(moment.text);
  else days.set(moment.date,[moment.text]);
 }
 return [...days].map(([date,entries])=>({date,entries}));
}
