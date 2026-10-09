import {readStored,writeStored} from './persistence';
import {isRecord,nonEmptyString} from './validation';
import {uid} from './types';

export const EVENT_LIMIT=500;
export const EVENT_KINDS=['goal','work','playtest','activity','diary','thought','archive'] as const;
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
