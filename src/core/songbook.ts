import {journalClock,validTimeZone} from './clock';
import {generatedAudioPath} from './musicStudio';
import {validateOriginalBrief,type OriginalBrief} from './originalSong';
import {readStored,writeStored} from './persistence';
import {isRecord,validDate} from './validation';

export const SONGBOOK_KEY='mana.songbook.v1';
export const SONGBOOK_LIMIT=100;
export const SONGBOOK_TIME='12:00';
export const SONGBOOK_DAY=0; // Sunday, at local noon
const manualId=/^manual-[a-zA-Z0-9_-]{1,64}$/;
const songId=/^song-[a-zA-Z0-9_-]{1,80}$/;
const projectId=/^studio-[a-zA-Z0-9-]{1,80}$/;

export interface SongbookEntry {
 id:string;
 slotId:string;
 source:'weekly'|'manual';
 createdAt:string;
 title:string;
 concept:string;
 creativeReason:string;
 brief:OriginalBrief;
 /** Drafts and failed audio keep their original lyrics and musical direction. */
 status:'draft'|'ready'|'error';
 audioPath?:string;
 generatedLyrics?:string;
 seconds?:number;
 projectId?:string;
 error?:string;
}
export interface SongbookState {
 settings:{enabled:boolean;timeZone:string;enabledAt:string|null;catchUp:boolean};
 entries:SongbookEntry[];
 lastAttempt?:{slotId:string;at:string};
 lastOutcome?:{at:string;message:string};
}
export const DEFAULT_SONGBOOK_SETTINGS:SongbookState['settings']={
 enabled:false,timeZone:'Asia/Singapore',enabledAt:null,catchUp:true,
};
function validTime(value:unknown):value is string{
 return typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
}
function isSunday(date:string):boolean{
 return validDate(date)&&new Date(date+'T12:00:00Z').getUTCDay()===SONGBOOK_DAY;
}
function normalizedEntry(raw:unknown):SongbookEntry|undefined{
 if(!isRecord(raw)||typeof raw.id!=='string'||!songId.test(raw.id)||
    !validTime(raw.createdAt)||typeof raw.slotId!=='string')return;
 const source=raw.source;
 if(source!=='weekly'&&source!=='manual')return;
 if(source==='weekly'?!isSunday(raw.slotId):!manualId.test(raw.slotId))return;
 const brief=validateOriginalBrief(raw.brief);
 if(!brief||typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>120||
    typeof raw.concept!=='string'||!raw.concept.trim()||raw.concept.length>500||
    typeof raw.creativeReason!=='string'||raw.creativeReason.length>220)return;
 const status=raw.status;
 if(status!=='draft'&&status!=='ready'&&status!=='error')return;
 const path=generatedAudioPath(raw.audioPath);
 if(status==='ready'&&!path)return;
 return {
  id:raw.id,slotId:raw.slotId,source,createdAt:raw.createdAt,
  title:raw.title.trim(),concept:raw.concept.trim(),
  creativeReason:raw.creativeReason.trim(),brief,status,
  ...(path?{audioPath:path}:{}),
  ...(typeof raw.generatedLyrics==='string'&&raw.generatedLyrics.length<=6000?{generatedLyrics:raw.generatedLyrics}:{}),
  ...(typeof raw.seconds==='number'&&Number.isFinite(raw.seconds)&&raw.seconds>0&&raw.seconds<=180?{seconds:raw.seconds}:{}),
  ...(typeof raw.projectId==='string'&&projectId.test(raw.projectId)?{projectId:raw.projectId}:{}),
  ...(typeof raw.error==='string'&&raw.error.trim()?{error:raw.error.slice(0,400)}:{}),
 };
}
/** Strict loading keeps untrusted model output out of persistence. */
export function validateSongbook(value:unknown):SongbookState {
 const settings=isRecord(value)&&isRecord(value.settings)?value.settings:{};
 const zone=validTimeZone(settings.timeZone)?settings.timeZone:'Asia/Singapore';
 const at=validTime(settings.enabledAt)?settings.enabledAt:null;
 const state:SongbookState={
  settings:{enabled:settings.enabled===true&&!!at,timeZone:zone,enabledAt:at,catchUp:settings.catchUp!==false},
  entries:[],
 };
 const unique=new Set<string>(),slots=new Set<string>();
 if(isRecord(value)&&Array.isArray(value.entries)){
  for(const item of value.entries.slice(0,SONGBOOK_LIMIT)){
   const entry=normalizedEntry(item);
   if(!entry||unique.has(entry.id)||slots.has(entry.slotId))continue;
   unique.add(entry.id);slots.add(entry.slotId);state.entries.push(entry);
  }
 }
 if(isRecord(value)&&isRecord(value.lastAttempt)&&isSunday(String(value.lastAttempt.slotId))&&
    validTime(value.lastAttempt.at))
  state.lastAttempt={slotId:String(value.lastAttempt.slotId),at:value.lastAttempt.at};
 if(isRecord(value)&&isRecord(value.lastOutcome)&&validTime(value.lastOutcome.at)&&
    typeof value.lastOutcome.message==='string'&&value.lastOutcome.message.length<=360)
  state.lastOutcome={at:value.lastOutcome.at,message:value.lastOutcome.message};
 return state;
}
export function setSongbookEnabled(state:SongbookState,enabled:boolean,now=new Date()):SongbookState{
 if(state.settings.enabled===enabled)return state;
 if(!Number.isFinite(now.getTime()))throw Error('Invalid Songbook time.');
 return {...state,settings:{...state.settings,enabled,enabledAt:enabled?now.toISOString():null},lastAttempt:undefined};
}
/** One eligible Sunday per week, optionally caught up only within the same week. */
export function dueWeeklySong(state:SongbookState,now=new Date()):string|null{
 if(!state.settings.enabled||!state.settings.enabledAt||!Number.isFinite(now.getTime()))return null;
 const local=journalClock(now,state.settings.timeZone);
 const today=new Date(local.date+'T12:00:00Z');
 const slot=new Date(today);slot.setUTCDate(today.getUTCDate()-today.getUTCDay());
 const slotId=slot.toISOString().slice(0,10);
 if(local.date===slotId&&local.time<SONGBOOK_TIME)return null;
 if(!state.settings.catchUp&&local.date!==slotId)return null;
 const enabled=journalClock(new Date(state.settings.enabledAt),state.settings.timeZone);
 if(enabled.date+'T'+enabled.time>slotId+'T'+SONGBOOK_TIME)return null;
 if(state.entries.some(e=>e.source==='weekly'&&e.slotId===slotId)||state.lastAttempt?.slotId===slotId)return null;
 return slotId;
}
/** Reserve before contacting any AI; never retry automatically every minute. */
export function reserveWeeklySong(state:SongbookState,slotId:string,now=new Date()):SongbookState {
 if(dueWeeklySong(state,now)!==slotId)throw Error('Weekly Songbook slot is not available.');
 return {...state,lastAttempt:{slotId,at:now.toISOString()}};
}
export function nextWeeklySong(state:SongbookState,now=new Date()):{date:string;time:string;note:string}{
 const due=dueWeeklySong(state,now);
 if(due)return {date:due,time:SONGBOOK_TIME,note:'A weekly composition is due when Mana is open, visible and idle.'};
 const local=journalClock(now,state.settings.timeZone);
 const cursor=new Date(local.date+'T12:00:00Z');
 const weekday=cursor.getUTCDay();
 let days=(7-weekday)%7;
 if(days===0&&(local.time>=SONGBOOK_TIME||state.lastAttempt?.slotId===local.date||
    state.entries.some(e=>e.source==='weekly'&&e.slotId===local.date)))days=7;
 cursor.setUTCDate(cursor.getUTCDate()+days);
 return {date:cursor.toISOString().slice(0,10),time:SONGBOOK_TIME,note:state.settings.enabled?
  'Next scheduled Sunday. Offline or busy weeks never create a backlog of songs.':
  'Automatic weekly songwriting is off.'};
}
export function addSongDraft(state:SongbookState,value:SongbookEntry):SongbookState{
 if(state.entries.length>=SONGBOOK_LIMIT)throw Error('Songbook is full.');
 const entry=normalizedEntry(value);
 if(!entry||entry.status!=='draft')throw Error('Invalid original song draft.');
 if(entry.source==='weekly'&&state.lastAttempt?.slotId!==entry.slotId)
  throw Error('Weekly song was not reserved before composition.');
 if(state.entries.some(e=>e.id===entry.id||e.slotId===entry.slotId))
  throw Error('This song or weekly slot is already saved.');
 return {...state,entries:[entry,...state.entries]};
}
export function completeSongAudio(
 state:SongbookState,id:string,result:{mix:string;seconds:number;generatedLyrics?:string;projectId?:string},
):SongbookState {
 const path=generatedAudioPath(result.mix);
 if(!path||!Number.isFinite(result.seconds)||result.seconds<=0||result.seconds>180)
  throw Error('The original-song generator did not return a valid completed WAV.');
 if(!state.entries.some(e=>e.id===id))throw Error('The song draft was removed.');
 return {...state,entries:state.entries.map(entry=>entry.id===id?{
  ...entry,status:'ready' as const,audioPath:path,seconds:result.seconds,error:undefined,
  ...(typeof result.generatedLyrics==='string'&&result.generatedLyrics.length<=6000?{generatedLyrics:result.generatedLyrics}:{}),
  ...(typeof result.projectId==='string'&&projectId.test(result.projectId)?{projectId:result.projectId}:{}),
 }:entry)};
}
export function markSongAudioError(state:SongbookState,id:string,error:string):SongbookState{
 if(!state.entries.some(e=>e.id===id))return state;
 return {...state,entries:state.entries.map(entry=>entry.id===id?{
  ...entry,status:'error' as const,error:error.slice(0,400),
 }:entry)};
}
export function recordSongbookOutcome(state:SongbookState,message:string,now=new Date()):SongbookState{
 return {...state,lastOutcome:{at:now.toISOString(),message:message.slice(0,360)}};
}
export function loadSongbook():SongbookState{
 try{return validateSongbook(JSON.parse(readStored(SONGBOOK_KEY)??'null'));}
 catch{return validateSongbook(null);}
}
export function saveSongbook(state:SongbookState){
 const value=JSON.stringify(validateSongbook(state));
 if(readStored(SONGBOOK_KEY)!==value)writeStored(SONGBOOK_KEY,value);
}
