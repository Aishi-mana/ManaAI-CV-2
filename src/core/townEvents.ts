import {journalClock} from './clock';
import {residentIds,residentProfiles} from './residentProfiles';
import type {TownCharacter} from './residentRelationships';

const schedule=[
 {title:'Town Market',day:1,start:'11:00',end:'13:00'},
 {title:'Spring Flower Fair',month:4,day:15,start:'16:00',end:'18:00'},
 {title:'Summer Music Day',month:7,day:15,start:'16:00',end:'18:00'},
 {title:'Autumn Harvest Fair',month:10,day:15,start:'16:00',end:'18:00'},
 {title:'Winter Lantern Festival',month:12,day:21,start:'18:00',end:'20:00'},
] as const;

export type TownEventDraft={title:string;date:string;start:string;end:string;birthdayFor?:TownCharacter};
export type CustomTownEvent=TownEventDraft&{id:string};
const timePattern=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
export function birthdayOwner(event:{id:string}):TownCharacter|undefined{
 return (['mana',...residentIds] as TownCharacter[]).find(owner=>event.id===`birthday-${owner}`);
}
export function birthdayTitle(owner:TownCharacter){return `${owner==='mana'?'Mana':residentProfiles[owner].name}’s birthday`;}

export function validTownEvent(event:TownEventDraft){
 const date=new Date(event.date+'T12:00:00Z');
 if(event.birthdayFor){
  if(!(['mana',...residentIds] as string[]).includes(event.birthdayFor)||event.start<'08:00'||event.end>'21:00')return false;
  const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
  if(minutes(event.end)-minutes(event.start)>60)return false;
 }
 return event.title.trim().length>0&&event.title.length<=80&&/^\d{4}-\d{2}-\d{2}$/.test(event.date)&&
  Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===event.date&&
  timePattern.test(event.start)&&timePattern.test(event.end)&&event.end>event.start;
}

export function validateTownEvents(value:unknown):CustomTownEvent[]{
 if(!Array.isArray(value))return [];
 const events=new Map<string,CustomTownEvent>();
 for(const item of value){
  if(!item||typeof item!=='object')continue;
  const {id,title,date,start,end}=item;
  if(typeof id!=='string'||!id||typeof title!=='string'||typeof date!=='string'||typeof start!=='string'||typeof end!=='string')continue;
  const event={id,title:title.trim(),date,start,end};
  if(validTownEvent(event))events.set(id,event);
 }
 return [...events.values()];
}

export function townEventsForMonth(month:string,custom:readonly CustomTownEvent[],clock:{date:string;time:string}){
 const monthNumber=Number(month.slice(5));
 const recurring=schedule.filter(event=>!('month' in event)||event.month===monthNumber).map(event=>({
  id:event.title,title:event.title,date:month+'-'+String(event.day).padStart(2,'0'),start:event.start,end:event.end,
 }));
 const annual=custom.flatMap(event=>{
  if(event.date.slice(5,7)!==month.slice(5))return [];
  let date=month+'-'+event.date.slice(8);
  if(birthdayOwner(event)&&date.endsWith('-02-29')&&!validTownEvent({...event,date}))date=month+'-28';
  const occurrence={...event,date};
  return validTownEvent(occurrence)?[occurrence]:[];
 });
 return [...recurring,...annual]
  .sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start))
  .map(event=>({...event,active:event.date.slice(5)===clock.date.slice(5)&&clock.time>=event.start&&clock.time<event.end}));
}

export function townEventCalendar(now:Date,timeZone:string,custom:readonly CustomTownEvent[]=[]){
 const clock=journalClock(now,timeZone);
 const active=townEventsForMonth(clock.date.slice(0,7),custom,clock).filter(event=>event.active);
 return {clock,active};
}

export type TownEventCalendar=ReturnType<typeof townEventCalendar>;
