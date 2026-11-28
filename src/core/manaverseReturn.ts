import {isRecord} from './validation';
import {journalClock,validTimeZone} from './clock';
import {readStored,writeStored} from './persistence';
import {roomSleepNight,type RoomState} from './companionRoom';
import {manaRoutine,residentOutingSlot} from './manaverseRoutine';
import {townWeather,weatherNeedsShelter,weatherShelterDestination,DEFAULT_TOWN_WEATHER} from './townWeather';
import {residentProfiles} from './residentProfiles';
import {pendingVisitRequest,pendingHostVisit} from './roomPhone';
import type {ManaverseArea} from '../components/ManaverseMap';

export const MANAVERSE_CHECKPOINT_EVENT='mana:manaverse-checkpoint';
export const MANAVERSE_RETURN_KEY='mana.manaverse-return.v1';
export const MIN_MANAVERSE_AWAY_MS=5*60_000;
export type ReturnTargets={mana:ManaverseArea;luna:ManaverseArea;lyra:ManaverseArea};
export type AwayReport={from:string;to:string;timeZone:string;energyAdded:number;missedGatherings:number;expiredVisits:number;targets:ReturnTargets;sleeping:boolean;zoneChanged:boolean;dismissed?:true};
export type ManaverseReturnState={checkpoint?:{at:string;timeZone:string};report?:AwayReport};
const areas=['bedroom','living','office','workshop','cafe','park','square','town-hall','library','lyra-room','luna-home'];
const stamp=(value:unknown):value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export function validateManaverseReturn(value:unknown):ManaverseReturnState{
 if(!isRecord(value))return {};
 const result:ManaverseReturnState={};
 if(isRecord(value.checkpoint)&&stamp(value.checkpoint.at)&&validTimeZone(value.checkpoint.timeZone))result.checkpoint={at:value.checkpoint.at,timeZone:value.checkpoint.timeZone};
 const r=value.report;
 if(isRecord(r)&&stamp(r.from)&&stamp(r.to)&&Date.parse(r.to)>Date.parse(r.from)&&validTimeZone(r.timeZone)&&typeof r.sleeping==='boolean'&&typeof r.zoneChanged==='boolean'&&isRecord(r.targets)&&['mana','luna','lyra'].every(id=>typeof (r.targets as Record<string,unknown>)[id]==='string'&&areas.includes((r.targets as Record<string,string>)[id]))&&['energyAdded','missedGatherings','expiredVisits'].every(key=>typeof r[key]==='number'&&Number.isFinite(r[key])&&Number(r[key])>=0)&&Number(r.energyAdded)<=35){
  result.report={from:r.from,to:r.to,timeZone:r.timeZone,energyAdded:r.energyAdded as number,missedGatherings:Math.floor(r.missedGatherings as number),expiredVisits:Math.floor(r.expiredVisits as number),targets:{mana:r.targets.mana as ManaverseArea,luna:r.targets.luna as ManaverseArea,lyra:r.targets.lyra as ManaverseArea},sleeping:r.sleeping,zoneChanged:r.zoneChanged,...(r.dismissed===true?{dismissed:true}:{})};
 }
 return result;
}
export function loadManaverseReturn(){try{return validateManaverseReturn(JSON.parse(readStored(MANAVERSE_RETURN_KEY)??'null'));}catch{return {};}}
export const saveManaverseReturn=(state:ManaverseReturnState)=>writeStored(MANAVERSE_RETURN_KEY,JSON.stringify(validateManaverseReturn(state)));
/** A bounded scheduled-rest allowance, never evidence of observed sleep or work. */
export function scheduledRestMinutes(from:number,to:number,timeZone:string,skipNight?:string){
 let at=Math.max(from,to-7*24*60*60_000),minutes=0;
 while(at<to&&minutes<480){
  const end=Math.min(to,(Math.floor(at/900_000)+1)*900_000),night=roomSleepNight(new Date((at+end)/2),timeZone);
  if(night&&night!==skipNight)minutes+=(end-at)/60_000;
  at=end;
 }
 return Math.min(480,minutes);
}
export function currentReturnTargets(room:RoomState,timeZone:string,now=new Date()):ReturnTargets{
 const clock=journalClock(now,timeZone),night=roomSleepNight(now,timeZone),shelter=weatherNeedsShelter(townWeather(clock,room.weather??DEFAULT_TOWN_WEATHER));
 const manaNight=!!night&&room.skipSleepNight!==night;
 const mana=manaNight?'bedroom':weatherShelterDestination(manaRoutine(clock).place,manaRoutine(clock).place,shelter);
 const resident=(id:'luna'|'lyra'):ManaverseArea=>{
  if(night)return id==='lyra'?'lyra-room':'luna-home';
  const target=residentOutingSlot(id,clock)?.place;
  return shelter&&target==='park'||!target?residentProfiles[id].home:target;
 };
 return {mana,luna:resident('luna'),lyra:resident('lyra')};
}
export function prepareManaverseReturn(room:RoomState,state:ManaverseReturnState,timeZone:string,now=new Date()){
 const checkpoint=state.checkpoint,elapsed=checkpoint?now.getTime()-Date.parse(checkpoint.at):0;
 if(!checkpoint||!Number.isFinite(elapsed)||elapsed<MIN_MANAVERSE_AWAY_MS)return {room,state,reconciled:false,targets:undefined as ReturnTargets|undefined};
 const zoneChanged=checkpoint.timeZone!==timeZone;
 const energyAdded=zoneChanged?0:Math.max(0,Math.min(100-(room.energy??100),Math.floor(scheduledRestMinutes(Date.parse(checkpoint.at),now.getTime(),timeZone,room.skipSleepNight)/480*35)));
 const night=roomSleepNight(now,timeZone),sleeping=!!night&&room.skipSleepNight!==night;
 let missedGatherings=0,expiredVisits=0;
 const characterGatherings=room.characterGatherings?.map(plan=>{
  if(plan.status==='going'||plan.status==='planned'&&(Date.parse(plan.endsAt)<=now.getTime()||now.getTime()>Date.parse(plan.startsAt)+10*60_000)){
   missedGatherings++;return {...plan,status:'cancelled' as const,reason:'The app was away before this gathering could finish.'};
  }return plan;
 });
 const pending=[pendingVisitRequest(room.phoneMessages??[]),pendingHostVisit(room.phoneMessages??[])].filter(Boolean);
 const phoneMessages=room.phoneMessages?.map(message=>{
  if(!pending.some(request=>request?.at===message.at&&request.contact===message.contact&&request.kind===message.kind))return message;
  const due=Date.parse(message.scheduledFor??message.at);
  if(due>now.getTime()||now.getTime()-due<30*60_000)return message;
  expiredVisits++;return {...message,expiredAt:now.toISOString()};
 });
 const pondSketch=room.pondSketch?.status==='invited'?{...room.pondSketch,status:'deferred' as const,updatedAt:now.toISOString()}:room.pondSketch;
 const next:RoomState={...room,...(pondSketch?{pondSketch}:{}),...(energyAdded?{energy:(room.energy??100)+energyAdded}:{}),sleep:sleeping?{night:night!,startedAt:now.toISOString()}:undefined,...(phoneMessages?{phoneMessages}:{}),...(characterGatherings?{characterGatherings}:{})};
 const targets=currentReturnTargets(next,timeZone,now);
 const report:AwayReport={from:checkpoint.at,to:now.toISOString(),timeZone,energyAdded,missedGatherings,expiredVisits,targets,sleeping,zoneChanged};
 return {room:next,state:{...state,report},reconciled:true,targets};
}
