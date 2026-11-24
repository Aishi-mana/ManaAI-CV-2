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
 sourceType:'scheduled-drawing'|'manual-drawing';
 imagined:true;
 inspiration:SketchbookInspiration;
 relatedMemoryIds?:string[];
 /** Model-written, bounded creative explanation. Never a claim of real experiences. */
 creativeReason?:string;
 /** Concrete visual themes extracted from Mana's own completed artwork ideas. */
 motifs?:string[];
 /** A previously saved drawing that influenced this one, not an external memory. */
 revisitedDrawingId?:string;
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

export interface SketchbookOutcome {
 at:string;
 kind:'saved'|'postponed'|'failed'|'cancelled';
 message:string;
}

export interface SketchbookState {
 settings:SketchbookSettings;
 entries:SketchbookEntry[];
 /** Most recent drawing outcome survives app restarts, including failures. */
 lastOutcome?:SketchbookOutcome;
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
const manualSlotPattern=/^manual-[a-zA-Z0-9_-]{1,64}$/;
const motifPattern=/^[a-z][a-z0-9 -]{1,31}$/;
const REVISIT_AGE_MS=7*24*60*60_000;

/** Optional model notes are artwork metadata, not evidence of lived experiences. */
function safeCreativeReason(value:unknown):string|undefined {
 if(typeof value!=='string')return undefined;
 const note=value.trim();
 if(!note||note.length>220||/\bI\s+(?:saw|visited|went|met|photographed|remembered|witnessed|traveled|travelled)\b/i.test(note))return undefined;
 return note;
}

function safeSketchbookMotifs(value:unknown):string[] {
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter((item:unknown):item is string=>typeof item==='string')
  .map(item=>item.trim().toLowerCase()).filter(item=>motifPattern.test(item)))].slice(0,3);
}
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
 return entries.filter(entry=>entry.sourceType==='scheduled-drawing'&&localWeekStart(journalClock(new Date(entry.createdAt),timeZone).date)===week).length;
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
      typeof slotId!=='string'||!(raw.sourceType==='scheduled-drawing'?validSlotId(slotId):raw.sourceType==='manual-drawing'&&manualSlotPattern.test(slotId))||slots.has(slotId)||!validTimestamp(createdAt)||
      typeof title!=='string'||!title.trim()||title.length>120||
      typeof concept!=='string'||!concept.trim()||concept.length>500||
      typeof prompt!=='string'||!prompt.trim()||prompt.length>1500||
      raw.imagined!==true||!inspiration)continue;
   ids.add(id);slots.add(slotId);
   const relatedMemoryIds=Array.isArray(raw.relatedMemoryIds)?
    [...new Set(raw.relatedMemoryIds.filter((memoryId:unknown):memoryId is string=>
     typeof memoryId==='string'&&imageIdPattern.test(memoryId)))].slice(0,3):[];
   entries.push({
    id,imageId,slotId,createdAt,title:title.trim(),concept:concept.trim(),prompt:prompt.trim(),
    sourceType:raw.sourceType as 'scheduled-drawing'|'manual-drawing',imagined:true,inspiration,
    ...(relatedMemoryIds.length?{relatedMemoryIds}:{}),
    ...(safeCreativeReason(raw.creativeReason)?{creativeReason:safeCreativeReason(raw.creativeReason)}:{}),
    ...(safeSketchbookMotifs(raw.motifs).length?{motifs:safeSketchbookMotifs(raw.motifs)}:{}),
    ...(typeof raw.revisitedDrawingId==='string'&&imageIdPattern.test(raw.revisitedDrawingId)&&raw.revisitedDrawingId!==id
      ?{revisitedDrawingId:raw.revisitedDrawingId}:{}),
    ...(typeof raw.model==='string'&&raw.model.trim()&&raw.model.length<=200?{model:raw.model}:{}),
    ...(typeof raw.seed==='number'&&Number.isInteger(raw.seed)&&raw.seed>=0&&raw.seed<=0xffffffff?{seed:raw.seed}:{}),
   });
   if(entries.length>=SKETCHBOOK_LIMIT)break;
  }
 }
 const state:SketchbookState={settings,entries};
 const outcome=isRecord(value)?value.lastOutcome:undefined;
 if(isRecord(outcome)&&validTimestamp(outcome.at)&&
    (outcome.kind==='saved'||outcome.kind==='postponed'||outcome.kind==='failed'||outcome.kind==='cancelled')&&
    typeof outcome.message==='string'&&!!outcome.message.trim()&&outcome.message.length<=360){
  state.lastOutcome={at:outcome.at,kind:outcome.kind,message:outcome.message};
 }
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
 if(candidate.sourceType==='scheduled-drawing'&&state.removedSlots?.includes(candidate.slotId))throw Error('This scheduled drawing was already removed.');
 if(state.entries.some(existing=>existing.id===candidate.id||existing.slotId===candidate.slotId||existing.imageId===candidate.imageId))
  throw Error('This drawing or scheduled slot is already saved.');
 const week=localWeekStart(journalClock(new Date(entry.createdAt),state.settings.timeZone).date);
 const inWeek=state.entries.filter(existing=>existing.sourceType==='scheduled-drawing'&&
  localWeekStart(journalClock(new Date(existing.createdAt),state.settings.timeZone).date)===week).length;
 if(candidate.sourceType==='scheduled-drawing'&&inWeek>=state.settings.frequencyPerWeek)throw Error('The weekly Sketchbook limit has been reached.');
 return {...state,entries:[...state.entries,candidate]};
}

/** Recurring motifs are observed only across saved drawings, not inferred biography. */
export function sketchbookCreativePatterns(
 entries:readonly Pick<SketchbookEntry,'motifs'>[],
):{motif:string;count:number}[] {
 const counts=new Map<string,number>();
 for(const entry of entries){
  for(const motif of safeSketchbookMotifs(entry.motifs)){
   counts.set(motif,(counts.get(motif)??0)+1);
  }
 }
 return [...counts].filter(([,count])=>count>=2)
  .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
  .slice(0,5).map(([motif,count])=>({motif,count}));
}

/** Every fifth completed drawing may reinterpret a genuine, older saved picture.
 * No fabricated recollections and no reliance on user chat or diary records.
 * Pure and deterministic across retries and restarts.
 */
export function sketchbookRevisitCandidate(
 entries:readonly Pick<SketchbookEntry,'id'|'title'|'concept'|'createdAt'|'revisitedDrawingId'>[],
 now=new Date(),
):Pick<SketchbookEntry,'id'|'title'|'concept'>|null {
 if(!Number.isFinite(now.getTime())||entries.length<4||entries.length%4!==0)return null;
 const already=new Set(entries.map(entry=>entry.revisitedDrawingId).filter(Boolean));
 const eligible=entries.filter(entry=>
  imageIdPattern.test(entry.id)&&typeof entry.title==='string'&&typeof entry.concept==='string'&&
  Number.isFinite(Date.parse(entry.createdAt))&&
  now.getTime()-Date.parse(entry.createdAt)>=REVISIT_AGE_MS);
 if(!eligible.length)return null;
 const unused=eligible.filter(entry=>!already.has(entry.id));
 const source=[...(unused.length?unused:eligible)]
  .sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))[0];
 return {id:source.id,title:source.title.slice(0,120),concept:source.concept.slice(0,500)};
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
 const removedSlots=existing.sourceType==='scheduled-drawing'
  ?[...(state.removedSlots??[]).filter(slot=>slot!==existing.slotId),existing.slotId].slice(-SKETCHBOOK_REMOVED_SLOT_LIMIT)
  :state.removedSlots;
 return {...state,entries:state.entries.filter(entry=>entry.id!==id),...(removedSlots?{removedSlots}:{})};
}

/** Persist brief outcome metadata, never the raw language-model output. */
export function recordSketchbookOutcome(
 state:SketchbookState,kind:SketchbookOutcome['kind'],message:string,at=new Date(),
):SketchbookState {
 if(!Number.isFinite(at.getTime()))throw Error('Invalid Sketchbook outcome time.');
 return {...state,lastOutcome:{kind,at:at.toISOString(),message:message.trim().slice(0,360)||'Drawing status updated.'}};
}

/** A local-calendar summary, independent of whether the running app is idle. */
export function sketchbookScheduleSummary(state:SketchbookState,now=new Date()):{
 date:string;time:string;status:'off'|'due'|'upcoming'|'retry-wait';note:string;
} {
 const zone=state.settings.timeZone;
 const local=journalClock(now,zone);
 const due=dueSketchbookSlot(state,now);
 if(due)return {date:due,time:SKETCHBOOK_DRAW_TIME,status:'due',
  note:due===local.date?'Due now when Mana is idle.':'Missed drawing available for catch-up when Mana is idle.'};
 const day=new Date(local.date+'T12:00:00Z');
 const last=state.lastAttempt;
 // Show backoff only if the previous slot is still the most recent eligible day.
 if(state.settings.enabled&&last&&last.count<MAX_ATTEMPTS_PER_SLOT&&
    !state.entries.some(e=>e.slotId===last.slotId)&&!state.removedSlots?.includes(last.slotId)){
  const retryTime=Date.parse(last.at)+RETRY_DELAY_MS;
  if(Number.isFinite(retryTime)&&retryTime>now.getTime()){
   for(let i=0;i<7;i++){
    const candidate=new Date(day);candidate.setUTCDate(candidate.getUTCDate()-i);
    if(!SKETCHBOOK_DAYS.some(d=>d===candidate.getUTCDay()))continue;
    if(candidate.toISOString().slice(0,10)===last.slotId){
     const retry=journalClock(new Date(retryTime),zone);
     return {date:retry.date,time:retry.time,status:'retry-wait',
      note:'Retry eligible after '+retry.date+' '+retry.time+' if Mana is idle.'};
    }
    break;
   }
  }
 }
 for(let i=0;i<8;i++){
  const candidate=new Date(day);candidate.setUTCDate(candidate.getUTCDate()+i);
  if(!SKETCHBOOK_DAYS.some(d=>d===candidate.getUTCDay()))continue;
  if(i===0&&local.time>=SKETCHBOOK_DRAW_TIME)continue;
  return {date:candidate.toISOString().slice(0,10),time:SKETCHBOOK_DRAW_TIME,
   status:state.settings.enabled?'upcoming':'off',
   note:state.settings.enabled?'Next scheduled opportunity; Mana must be open and idle.':'Automatic drawings are off.'};
 }
 const future=new Date(day);future.setUTCDate(day.getUTCDate()+7);
 return {date:future.toISOString().slice(0,10),time:SKETCHBOOK_DRAW_TIME,status:'upcoming',
  note:'Next scheduled opportunity when Mana is open and idle.'};
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
