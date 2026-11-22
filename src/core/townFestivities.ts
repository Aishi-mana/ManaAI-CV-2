import type {TownEventCalendar} from './townEvents';
import {TOWN_DECORATIONS,decorationKinds,scheduleDecorationObjects,validateDecorationLayout,type DecorationObject,type TownDecoration} from './townDecorationLayout';
export {TOWN_DECORATIONS,TOWN_TREE_POINT} from './townDecorationLayout';
export type {TownDecoration} from './townDecorationLayout';

export type DecorationSchedule={id:string;name:string;enabled:boolean;decorations:TownDecoration[];
 trigger:'dates'|'event';start:string;end:string;yearly:boolean;event:string;objects?:DecorationObject[]};
export type TownDecorationSettings={schedules:DecorationSchedule[]};
const rule=(id:string,name:string,decorations:TownDecoration[],event:string):DecorationSchedule=>
 ({id,name,decorations,event,enabled:true,trigger:'event',start:'2000-12-01',end:'2000-12-31',yearly:true});
function legacySettings(mode:unknown):TownDecorationSettings{
 const schedules=[rule('town-events','Town events',['garlands','lights'],'@other'),
  rule('new-year','New Year celebrations',['golden-display','fireworks'],'@new-year')];
 if(mode!=='off')schedules.unshift({...rule('christmas','December decorations',['christmas-tree','garlands','lights'],'@christmas'),
  trigger:mode==='event'?'event':'dates',name:mode==='event'?'Christmas events':'December decorations'});
 return {schedules};
}
export const DEFAULT_TOWN_DECORATIONS=legacySettings('december');
export function validDecorationDate(value:unknown):value is string{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T12:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function validateTownDecorations(value:unknown):TownDecorationSettings{
 if(!value||typeof value!=='object')return legacySettings('december');
 if(!('schedules' in value)||!Array.isArray(value.schedules))return legacySettings('christmas' in value?value.christmas:undefined);
 const ids=new Set<string>();
 const schedules:DecorationSchedule[]=[];
 for(const entry of value.schedules.slice(0,200)){
  if(!entry||typeof entry!=='object'||typeof entry.id!=='string'||!entry.id||ids.has(entry.id))continue;
  const decorations:TownDecoration[]=[];
  for(const option of TOWN_DECORATIONS)if(Array.isArray(entry.decorations)&&entry.decorations.includes(option.id))decorations.push(option.id);
  const trigger=entry.trigger==='event'?'event':'dates';
  const objects=Array.isArray(entry.objects)?validateDecorationLayout(entry.objects):undefined;
  if((!decorations.length&&objects===undefined)||!validDecorationDate(entry.start)||!validDecorationDate(entry.end))continue;
  if(trigger==='dates'&&entry.yearly!==true&&entry.start>entry.end)continue;
  if(trigger==='event'&&(typeof entry.event!=='string'||!entry.event.trim()))continue;
  ids.add(entry.id);
  schedules.push({id:entry.id,name:typeof entry.name==='string'?entry.name.slice(0,100):'Decorations',
   decorations,enabled:entry.enabled!==false,trigger,start:entry.start,end:entry.end,yearly:entry.yearly===true,
   event:typeof entry.event==='string'?entry.event.trim().slice(0,120):'',...(objects===undefined?{}:{objects})});
 }
 return {schedules};
}
const normalized=(name:string)=>name.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const christmasTitle=(name:string)=>/\b(?:christmas|xmas)\b/.test(name);
export function activeDecorationSchedules(events:TownEventCalendar['active'],settings:TownDecorationSettings|{christmas:string}=DEFAULT_TOWN_DECORATIONS,date?:string){
 const active=events.filter(event=>event.active),today=date??active[0]?.date??'';
 const names=active.map(event=>normalized(event.title));
 return validateTownDecorations(settings).schedules.filter(schedule=>{
  if(!schedule.enabled)return false;
  let matches=false;
  if(schedule.trigger==='event')matches=names.some(name=>schedule.event==='@other'?!christmasTitle(name):
   schedule.event==='@christmas'?christmasTitle(name):schedule.event==='@new-year'?/\bnew\s*years?\b/.test(name):name===normalized(schedule.event));
  else if(validDecorationDate(today)){
   const [current,start,end]=schedule.yearly?[today.slice(5),schedule.start.slice(5),schedule.end.slice(5)]:[today,schedule.start,schedule.end];
   matches=start<=end?current>=start&&current<=end:current>=start||current<=end;
  }
  return matches;
 });
}
export function townFestivities(events:TownEventCalendar['active'],settings:TownDecorationSettings|{christmas:string}=DEFAULT_TOWN_DECORATIONS,date?:string){
 const selected=new Set(activeDecorationSchedules(events,settings,date).flatMap(schedule=>decorationKinds(scheduleDecorationObjects(schedule))));
 return {active:selected.size>0,christmas:selected.has('christmas-tree'),newYear:selected.has('golden-display'),
  garlands:selected.has('garlands'),lights:selected.has('lights'),fireworks:selected.has('fireworks')};
}
export function activeDecorationObjects(events:TownEventCalendar['active'],settings=DEFAULT_TOWN_DECORATIONS,date?:string){
 return activeDecorationSchedules(events,settings,date).flatMap(schedule=>scheduleDecorationObjects(schedule)
  .filter(object=>!object.hidden&&object.opacity>0).map(object=>({...object,id:`${schedule.id}:${object.id}`})));
}
export function townFestivityContext(events:TownEventCalendar['active'],settings=DEFAULT_TOWN_DECORATIONS,date?:string){
 const theme=townFestivities(events,settings,date);
 if(!theme.active)return '';
 const decorations=[theme.christmas?'a decorated Christmas tree':'',theme.fireworks?'fireworks overhead':'',
  theme.newYear?'golden ornaments':'',theme.garlands?'festive garlands':'',theme.lights?'warm lights':''].filter(Boolean).join(', ');
 const titles=events.filter(event=>event.active).map(event=>event.title).join(', ');
 return `\nTown Square has ${decorations}. ${titles?`Current calendar events: ${titles}.`:'No calendar event is active right now.'} React only if you are in Town Square or are asked about the decorations. Do not claim to have attended, met anyone, or completed an activity just because decorations are up or an event is scheduled.\n`;
}
