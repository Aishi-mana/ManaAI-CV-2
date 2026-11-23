import {journalClock,validTimeZone} from './clock';
import {isRecord,validDate} from './validation';
import {readStored,writeStored} from './persistence';

/**
 * Mana's scheduled drawings are imagined pictures, not diary illustrations.
 * Core scheduling and validation are pure. Only the explicit load/save helpers
 * touch Mana's existing persistence; there are no image jobs or timers here.
 */
export const SKETCHBOOK_KEY='mana.sketchbook.v1';
export const SKETCHBOOK_LIMIT=300;
export const SKETCHBOOK_REMOVED_SLOT_LIMIT=512;
export const SKETCHBOOK_DRAW_TIME='12:00';
export const SKETCHBOOK_DAYS=[2,4,6] as const; // Tuesday, Thursday, Saturday

export type SketchbookInspiration='imagination'|'mood'|'interest'|'memory'|'season';

export interface SketchbookEntry {
 id:string;
 imageId:string;
 slotId:string; // YYYY-MM-DD in the configured time zone
 createdAt:string;
 title:string;
 concept:string;
 prompt:string;
 sourceType:'scheduled-drawing';
 imagined:true;
 inspiration:SketchbookInspiration;
 relatedMemoryIds?:string[];
 model?:string;
 seed?:number;
}

export interface SketchbookSettings {
 enabled:boolean;
 frequencyPerWeek:3;
 announceInChat:boolean;
 catchUp:boolean;
 timeZone:string;
 enabledAt:string|null;
}

export interface SketchbookAttempt {
 slotId:string;
 at:string;
 count:number;
}

export interface SketchbookState {
 settings:SketchbookSettings;
 entries:SketchbookEntry[];
 /** Retain removed drawing slots so deleting an image cannot trigger a redraw. */
 removedSlots?:string[];
 lastAttempt?:SketchbookAttempt;
}

export const DEFAULT_SKETCHBOOK_SETTINGS:SketchbookSettings={
 enabled:false,
 frequencyPerWeek:3,
 announceInChat:false,
 catchUp:true,
 timeZone:'Asia/Singapore',
 enabledAt:null,
};

const imageIdPattern=/^[a-zA-Z0-9_-]{1,64}$/;
const inspirations:readonly SketchbookInspiration[]=['imagination','mood','interest','memory','season'];
const RETRY_DELAY_MS=30*60_000;
const MAX_ATTEMPTS_PER_SLOT=2;

function validTimestamp(value:unknown):value is string {
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return false;
 return new Date(value).toISOString()===value;
}

function validSlotId(value:unknown):value is string {
 return validDate(value)&&SKETCHBOOK_DAYS.some(day=>new Date(value+'T12:00:00Z').getUTCDay()===day);
}

function localWeekStart(date:string):string {
 const day=new Date(date+'T12:00:00Z');
 day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
 return day.toISOString().slice(0,10);
}

function completedThisWeek(entries:readonly SketchbookEntry[],now:Date,timeZone:string):number {
 const week=localWeekStart(journalClock(now,timeZone).date);
 return entries.filter(entry=>localWeekStart(journalClock(new Date(entry.createdAt),timeZone).date)===week).length;
}

/** Normalize saved metadata. Never infer a drawing from a diary entry or an image file. */
export function validateSketchbook(value:unknown):SketchbookState {
 const rawSettings:Record<string,unknown>=isRecord(value)&&isRecord(value.settings)?value.settings:{};
 const enabledAt=validTimestamp(rawSettings.enabledAt)?rawSettings.enabledAt:null;
 const settings:SketchbookSettings={
  enabled:rawSettings.enabled===true&&enabledAt!==null,
  frequencyPerWeek:3,
  announceInChat:rawSettings.announceInChat===true,
  catchUp:rawSettings.catchUp!==false,
  timeZone:validTimeZone(rawSettings.timeZone)?rawSettings.timeZone:DEFAULT_SKETCHBOOK_SETTINGS.timeZone,
  enabledAt,
 };
 const entries:SketchbookEntry[]=[];
 const ids=new Set<string>(),slots=new Set<string>();
 if(isRecord(value)&&Array.isArray(value.entries)){
  for(const raw of value.entries){
   if(!isRecord(raw))continue;
   const {id,imageId,slotId,createdAt,title,concept,prompt}=raw;
   const inspiration=inspirations.find(kind=>kind===raw.inspiration);
   if(typeof id!=='string'||!imageIdPattern.test(id)||ids.has(id)||
      typeof imageId!=='string'||!imageIdPattern.test(imageId)||
      !validSlotId(slotId)||slots.has(slotId)||!validTimestamp(createdAt)||
      typeof title!=='string'||!title.trim()||title.length>120||
      typeof concept!=='string'||!concept.trim()||concept.length>500||
      typeof prompt!=='string'||!prompt.trim()||prompt.length>1500||
      raw.sourceType!=='scheduled-drawing'||raw.imagined!==true||!inspiration)continue;
   ids.add(id);slots.add(slotId);
   const relatedMemoryIds=Array.isArray(raw.relatedMemoryIds)?
    [...new Set(raw.relatedMemoryIds.filter((memoryId:unknown):memoryId is string=>
     typeof memoryId==='string'&&imageIdPattern.test(memoryId)))].slice(0,3):[];
   entries.push({
    id,imageId,slotId,createdAt,title:title.trim(),concept:concept.trim(),prompt:prompt.trim(),
    sourceType:'scheduled-drawing',imagined:true,inspiration,
    ...(relatedMemoryIds.length?{relatedMemoryIds}:{}),
    ...(typeof raw.model==='string'&&raw.model.trim()&&raw.model.length<=200?{model:raw.model}:{}),
    ...(typeof raw.seed==='number'&&Number.isInteger(raw.seed)&&raw.seed>=0&&raw.seed<=0xffffffff?{seed:raw.seed}:{}),
   });
   if(entries.length>=SKETCHBOOK_LIMIT)break;
  }
 }
 const state:SketchbookState={settings,entries};
 const removed=isRecord(value)?value.removedSlots:undefined;
 if(Array.isArray(removed)){
  const history=[...new Set(removed.filter((slot:unknown):slot is string=>validSlotId(slot)&&!slots.has(slot)))];
  if(history.length)state.removedSlots=history.slice(-SKETCHBOOK_REMOVED_SLOT_LIMIT);
 }
 const attempt=isRecord(value)?value.lastAttempt:undefined;
 if(isRecord(attempt)&&validSlotId(attempt.slotId)&&validTimestamp(attempt.at)&&
    typeof attempt.count==='number'&&Number.isInteger(attempt.count)&&
    attempt.count>=1&&attempt.count<=MAX_ATTEMPTS_PER_SLOT){
  state.lastAttempt={slotId:attempt.slotId,at:attempt.at,count:attempt.count};
 }
 return state;
}

/** Enabling starts a fresh schedule; missed slots from a disabled period are not replayed. */
export function setSketchbookEnabled(state:SketchbookState,enabled:boolean,now=new Date()):SketchbookState {
 if(state.settings.enabled===enabled)return state;
 if(!Number.isFinite(now.getTime()))throw Error('Invalid drawing schedule time.');
 return {...state,settings:{...state.settings,enabled,enabledAt:enabled?now.toISOString():null},
  lastAttempt:undefined};
}

/**
 * Return only the MOST RECENT due slot. Never walk backwards through a backlog:
 * a missed week can create at most one catch-up drawing, not a burst.
 * The caller must also check model readiness, resource gates and app visibility.
 */
export function dueSketchbookSlot(state:SketchbookState,now=new Date()):string|null {
 const {settings,entries,lastAttempt}=state;
 if(!settings.enabled||!settings.enabledAt||!Number.isFinite(now.getTime()))return null;
 const clock=journalClock(now,settings.timeZone);
 const today=new Date(clock.date+'T12:00:00Z');
 let slotId:string|undefined;
 for(let daysAgo=0;daysAgo<7;daysAgo++){
  const day=new Date(today);
  day.setUTCDate(day.getUTCDate()-daysAgo);
  if(!SKETCHBOOK_DAYS.some(weekday=>weekday===day.getUTCDay()))continue;
  if(daysAgo===0&&clock.time<SKETCHBOOK_DRAW_TIME)continue;
  slotId=day.toISOString().slice(0,10);
  break;
 }
 if(!slotId||(!settings.catchUp&&slotId!==clock.date))return null;
 const enabledClock=journalClock(new Date(settings.enabledAt),settings.timeZone);
 if(enabledClock.date+'T'+enabledClock.time>slotId+'T'+SKETCHBOOK_DRAW_TIME)return null;
 if(entries.some(entry=>entry.slotId===slotId)||state.removedSlots?.includes(slotId))return null;
 if(completedThisWeek(entries,now,settings.timeZone)>=settings.frequencyPerWeek)return null;
 if(lastAttempt?.slotId===slotId&&
    (lastAttempt.count>=MAX_ATTEMPTS_PER_SLOT||
     now.getTime()-Date.parse(lastAttempt.at)<RETRY_DELAY_MS))return null;
 return slotId;
}

/** Persist this reservation before launching any model work. */
export function beginSketchbookAttempt(state:SketchbookState,slotId:string,now=new Date()):SketchbookState {
 if(dueSketchbookSlot(state,now)!==slotId)throw Error('This Sketchbook slot is not ready.');
 return {...state,lastAttempt:{
  slotId,at:now.toISOString(),
  count:state.lastAttempt?.slotId===slotId?state.lastAttempt.count+1:1,
 }};
}

/** Call only after the image and its gallery reference have been saved successfully. */
export function addSketchbookEntry(state:SketchbookState,entry:SketchbookEntry):SketchbookState {
 if(state.entries.length>=SKETCHBOOK_LIMIT)throw Error('Mana’s Sketchbook is full.');
 const candidate=validateSketchbook({settings:state.settings,entries:[entry]}).entries[0];
 if(!candidate)throw Error('Invalid Sketchbook drawing metadata.');
 if(state.removedSlots?.includes(candidate.slotId))throw Error('This scheduled drawing was already removed.');
 if(state.entries.some(existing=>existing.id===candidate.id||existing.slotId===candidate.slotId||existing.imageId===candidate.imageId))
  throw Error('This drawing or scheduled slot is already saved.');
 const week=localWeekStart(journalClock(new Date(entry.createdAt),state.settings.timeZone).date);
 const inWeek=state.entries.filter(existing=>
  localWeekStart(journalClock(new Date(existing.createdAt),state.settings.timeZone).date)===week).length;
 if(inWeek>=state.settings.frequencyPerWeek)throw Error('The weekly Sketchbook limit has been reached.');
 return {...state,entries:[...state.entries,candidate]};
}

/** A pending image belongs only to the schedule activation that created it. */
export function canSaveScheduledSketchbook(
 state:SketchbookState,slotId:string,enabledAt:string|null,
):boolean {
 return state.settings.enabled&&enabledAt!==null&&
  state.settings.enabledAt===enabledAt&&validSlotId(slotId)&&
  !state.entries.some(entry=>entry.slotId===slotId)&&
  !state.removedSlots?.includes(slotId);
}

/** Unlink from Sketchbook without removing a shared gallery image or reopening its slot. */
export function removeSketchbookEntry(state:SketchbookState,id:string):SketchbookState {
 const existing=state.entries.find(entry=>entry.id===id);
 if(!existing)return state;
 const removedSlots=[...(state.removedSlots??[]).filter(slot=>slot!==existing.slotId),existing.slotId]
  .slice(-SKETCHBOOK_REMOVED_SLOT_LIMIT);
 return {...state,entries:state.entries.filter(entry=>entry.id!==id),removedSlots};
}

/** Load from Mana's existing SQLite-backed store (localStorage in web preview). */
export function loadSketchbook():SketchbookState {
 try { return validateSketchbook(JSON.parse(readStored(SKETCHBOOK_KEY)??'null')); }
 catch { return validateSketchbook(null); }
}

/** Persist only validated drawing metadata; images remain in the disk gallery. */
export function saveSketchbook(state:SketchbookState):void {
 writeStored(SKETCHBOOK_KEY,JSON.stringify(validateSketchbook(state)));
}
