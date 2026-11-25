import {journalClock,validTimeZone} from './clock';
import {generatedAudioPath} from './musicStudio';

export type WeeklyCoverKind='local'|'web';
export interface WeeklyCoverRecord{
 id:string;kind:WeeklyCoverKind;week:string;at:string;title:string;
 sourceLabel:string;projectId:string;mix:string;vocal:string;seconds:number;
 sourceUrl?:string;
}
export interface WeeklyCovers{
 timeZone:string;
 local:{enabled:boolean;enabledAt:string|null;folder:string;rightsApproved:boolean;used:string[];lastSlot?:{week:string;at:string}};
 web:{enabled:boolean;enabledAt:string|null;lastSlot?:{week:string;at:string}};
 records:WeeklyCoverRecord[];
 lastOutcome?:{at:string;message:string};
}
export const COVER_WEEKDAY:Record<WeeklyCoverKind,number>={local:2,web:5}; // Tuesday and Friday
export const COVER_TIME='12:00';
export const COVER_RECORD_LIMIT=40;
const stamp=(x:unknown):x is string=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const weekId=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s&&new Date(s+'T12:00:00Z').getUTCDay()===0;
const folderName=(s:unknown):s is string=>typeof s==='string'&&s.length>=3&&s.length<=1200&&
 /^[a-zA-Z]:[\\/]/.test(s)&&!s.includes('\0')&&!s.split(/[\\/]/).some(part=>part==='..');
const lastSlot=(v:unknown):{week:string;at:string}|undefined=>{
 const p=v&&typeof v==='object'?v as Record<string,unknown>:{};
 return weekId(p.week)&&stamp(p.at)?{week:p.week,at:p.at}:undefined;
};
const stringSet=(value:unknown,max:number)=>Array.isArray(value)?[...new Set(
 value.filter(x=>typeof x==='string'&&x.length<1200).slice(0,max) as string[])]:[];
export function defaultWeeklyCovers(timeZone='Asia/Singapore'):WeeklyCovers{
 return {timeZone,local:{enabled:false,enabledAt:null,folder:'',rightsApproved:false,used:[]},
  web:{enabled:false,enabledAt:null},records:[]};
}
export function validateWeeklyCovers(value:unknown,timeZone='Asia/Singapore'):WeeklyCovers{
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const zone=validTimeZone(raw.timeZone)?raw.timeZone:timeZone;
 const local=raw.local&&typeof raw.local==='object'?raw.local as Record<string,unknown>:{};
 const web=raw.web&&typeof raw.web==='object'?raw.web as Record<string,unknown>:{};
 const folder=folderName(local.folder)?local.folder:'';
 const rightsApproved=!!folder&&local.rightsApproved===true;
 const atLocal=stamp(local.enabledAt)?local.enabledAt:null;
 const atWeb=stamp(web.enabledAt)?web.enabledAt:null;
 const state:WeeklyCovers={
  timeZone:zone,
  local:{enabled:local.enabled===true&&rightsApproved&&!!atLocal,enabledAt:atLocal,
   folder,rightsApproved,used:stringSet(local.used,100),...(lastSlot(local.lastSlot)?{lastSlot:lastSlot(local.lastSlot)}:{})},
  web:{enabled:web.enabled===true&&!!atWeb,enabledAt:atWeb,...(lastSlot(web.lastSlot)?{lastSlot:lastSlot(web.lastSlot)}:{})},
  records:[],
 };
 const ids=new Set<string>(),slots=new Set<string>();
 if(Array.isArray(raw.records))for(const item of raw.records.slice(0,COVER_RECORD_LIMIT)){
  if(!item||typeof item!=='object'||Array.isArray(item))continue;
  const r=item as Record<string,unknown>;
  if(typeof r.id!=='string'||!/^cover-record-[a-zA-Z0-9_-]{1,80}$/.test(r.id)||ids.has(r.id)||
   (r.kind!=='local'&&r.kind!=='web')||!weekId(r.week)||slots.has(r.kind+':'+r.week)||
   !stamp(r.at)||typeof r.title!=='string'||!r.title.trim()||r.title.length>120||
   typeof r.sourceLabel!=='string'||r.sourceLabel.length>180||
   typeof r.projectId!=='string'||!/^studio-[a-z0-9-]{1,80}$/.test(r.projectId)||
   typeof r.seconds!=='number'||!Number.isFinite(r.seconds)||r.seconds<=0||r.seconds>3600)continue;
  const mix=generatedAudioPath(r.mix),vocal=generatedAudioPath(r.vocal);
  if(!mix||!vocal)continue;
  ids.add(r.id);slots.add(r.kind+':'+r.week);
  state.records.push({id:r.id,kind:r.kind,week:r.week,at:r.at,title:r.title,sourceLabel:r.sourceLabel,
   projectId:r.projectId,mix,vocal,seconds:r.seconds,
   ...(typeof r.sourceUrl==='string'&&r.sourceUrl.startsWith('https://')&&r.sourceUrl.length<=2048?
    {sourceUrl:r.sourceUrl}:{})});
 }
 if(raw.lastOutcome&&typeof raw.lastOutcome==='object'){
  const outcome=raw.lastOutcome as Record<string,unknown>;
  if(stamp(outcome.at)&&typeof outcome.message==='string'&&outcome.message.length<=360)
   state.lastOutcome={at:outcome.at,message:outcome.message};
 }
 return state;
}
export function configureWeeklyCover(state:WeeklyCovers,kind:WeeklyCoverKind,enabled:boolean,now=new Date()):WeeklyCovers{
 if(!Number.isFinite(now.getTime()))throw Error('Invalid cover schedule time.');
 if(kind==='local'&&enabled&&(!state.local.folder||!state.local.rightsApproved))
  throw Error('Choose and approve a local folder before scheduling covers.');
 if(state[kind].enabled===enabled)return state;
 return {...state,[kind]:{...state[kind],enabled,enabledAt:enabled?now.toISOString():null}};
}
export function setLocalCoverFolder(state:WeeklyCovers,folder:string):WeeklyCovers{
 if(!folderName(folder))throw Error('Choose a valid Windows music folder.');
 return {...state,local:{...state.local,folder,rightsApproved:false,enabled:false,enabledAt:null,used:[]}};
}
export function approveLocalCoverFolder(state:WeeklyCovers,approved:boolean):WeeklyCovers{
 if(!state.local.folder)throw Error('Choose a local music folder first.');
 return {...state,local:{...state.local,rightsApproved:approved,enabled:approved?state.local.enabled:false,
  enabledAt:approved?state.local.enabledAt:null}};
}
export function dueWeeklyCover(state:WeeklyCovers,kind:WeeklyCoverKind,now=new Date()):string|null{
 const cfg=state[kind];
 if(!cfg.enabled||!cfg.enabledAt||!Number.isFinite(now.getTime())||
   (kind==='local'&&(!state.local.folder||!state.local.rightsApproved)))return null;
 const local=journalClock(now,state.timeZone);
 const today=new Date(local.date+'T12:00:00Z');
 const week=new Date(today);week.setUTCDate(week.getUTCDate()-week.getUTCDay());
 const slot=week.toISOString().slice(0,10);
 const due=new Date(week);due.setUTCDate(due.getUTCDate()+COVER_WEEKDAY[kind]);
 const date=due.toISOString().slice(0,10);
 if(local.date+'T'+local.time<date+'T'+COVER_TIME)return null;
 const enabledAt=journalClock(new Date(cfg.enabledAt),state.timeZone);
 if(enabledAt.date+'T'+enabledAt.time>date+'T'+COVER_TIME)return null;
 if(cfg.lastSlot?.week===slot||state.records.some(r=>r.kind===kind&&r.week===slot))return null;
 return slot;
}
export function reserveWeeklyCover(state:WeeklyCovers,kind:WeeklyCoverKind,week:string,now=new Date()):WeeklyCovers{
 if(dueWeeklyCover(state,kind,now)!==week)throw Error('Weekly cover slot is not due.');
 return {...state,[kind]:{...state[kind],lastSlot:{week,at:now.toISOString()}}};
}
export function recordWeeklyCover(state:WeeklyCovers,record:WeeklyCoverRecord,usedSource?:string):WeeklyCovers{
 const validated=validateWeeklyCovers({...state,records:[record,...state.records]},state.timeZone);
 if(validated.records[0]?.id!==record.id)throw Error('Invalid completed weekly cover.');
 if(record.kind==='local'&&usedSource)
  return {...validated,local:{...validated.local,used:[usedSource,...validated.local.used.filter(x=>x!==usedSource)].slice(0,100)}};
 return validated;
}
export function recordCoverOutcome(state:WeeklyCovers,message:string,now=new Date()):WeeklyCovers{
 return {...state,lastOutcome:{at:now.toISOString(),message:message.slice(0,360)}};
}
export function nextCoverDay(state:WeeklyCovers,kind:WeeklyCoverKind,now=new Date()):string{
 const local=journalClock(now,state.timeZone),base=new Date(local.date+'T12:00:00Z');
 const diff=(COVER_WEEKDAY[kind]-base.getUTCDay()+7)%7;
 base.setUTCDate(base.getUTCDate()+diff);
 let date=base.toISOString().slice(0,10);
 if(diff===0&&local.time>=COVER_TIME){
  base.setUTCDate(base.getUTCDate()+7);date=base.toISOString().slice(0,10);
 }
 return date;
}
