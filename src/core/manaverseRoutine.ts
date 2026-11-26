import {residentProfiles,type ResidentId} from './residentProfiles';
import {pendingVisitRequest,visitIsDue,type PhoneMessage} from './roomPhone';

const manaDay=[
 {start:'00:00',place:'bedroom'},
 {start:'06:00',place:'living'},
 {start:'08:00',place:'office'},
 {start:'12:00',place:'cafe'},
 {start:'14:00',place:'workshop'},
 {start:'16:00',place:'park'},
 {start:'18:00',place:'square'},
 {start:'20:00',place:'bedroom'},
 {start:'22:00',place:'bedroom'},
] as const;

type ManaDay=readonly {start:string;place:(typeof manaDay)[number]['place']}[];
type ResidentDay=readonly {start:string;end:string;place:'park'|'cafe'|'library'}[];
const weekendMana:Record<0|6,ManaDay>={
 6:[{start:'00:00',place:'bedroom'},{start:'06:00',place:'living'},{start:'08:00',place:'bedroom'},{start:'10:00',place:'park'},{start:'12:00',place:'cafe'},{start:'14:00',place:'living'},{start:'16:00',place:'park'},{start:'18:00',place:'square'},{start:'20:00',place:'bedroom'},{start:'22:00',place:'bedroom'}],
 0:[{start:'00:00',place:'bedroom'},{start:'06:00',place:'living'},{start:'08:00',place:'bedroom'},{start:'10:00',place:'living'},{start:'12:00',place:'cafe'},{start:'14:00',place:'park'},{start:'16:00',place:'bedroom'},{start:'18:00',place:'living'},{start:'20:00',place:'bedroom'},{start:'22:00',place:'bedroom'}],
};
function weekday(date:string){return new Date(date+'T12:00:00Z').getUTCDay();}
function followingDate(date:string){const next=new Date(date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);return next.toISOString().slice(0,10);}
export function manaDayForDate(date?:string):ManaDay{
 if(!date)return manaDay;
 const day=weekday(date);
 if(day===0||day===6)return weekendMana[day];
 return day===1||day===3?manaDay.map(slot=>slot.start==='14:00'?{...slot,place:'bedroom' as const}:slot):manaDay;
}
export function residentDayForDate(resident:ResidentId,date?:string):ResidentDay{
 const ordinary=residentProfiles[resident].outings;if(!date)return ordinary;
 const day=weekday(date);
 if(resident==='luna'){
  if(day===6)return [{start:'09:30',end:'11:00',place:'park'},{start:'13:30',end:'14:30',place:'cafe'},{start:'16:00',end:'17:30',place:'library'}];
  if(day===0)return [{start:'11:00',end:'12:30',place:'park'}];
  if(day===2||day===3)return ordinary.filter(slot=>slot.place==='park');
 }else{
  if(day===6)return [{start:'12:30',end:'13:30',place:'park'},{start:'14:30',end:'15:30',place:'cafe'}];
  if(day===0)return [{start:'11:30',end:'12:30',place:'cafe'}];
  if(day===1||day===3)return ordinary.filter(slot=>slot.place==='cafe');
 }
 return ordinary;
}
export function residentOutingSlot(resident:ResidentId,clock:{date:string;time:string}){
 const slot=residentDayForDate(resident,clock.date).find(slot=>clock.time>=slot.start&&clock.time<slot.end);
 return slot?{...slot,key:`${clock.date}T${slot.start}:${slot.place}`}:undefined;
}

export function manaRoutine({date,time}:{date:string;time:string}){
 const day=manaDayForDate(date),elapsed=day.filter(entry=>entry.start<=time);
 const slot=elapsed[elapsed.length-1]??day[0];
 return {...slot,key:`${date}T${slot.start}`};
}

// A home invitation changes the walking destination; it must not freeze an
// actor who is away from home waiting for the at-home acceptance handler.
export function manaRoutineDestination(clock:{date:string;time:string},messages:readonly PhoneMessage[],night=false,now=Date.now()){
 if(night)return 'bedroom';
 const invitation=pendingVisitRequest(messages);
 return invitation&&visitIsDue(invitation,now)?'living':manaRoutine(clock).place;
}

// A new completion timestamp opens a new home cycle after its quiet break.
// Only an already-planned stay at home may start one; never delay a departure.
export function homeActivityCycleKey({place,destination,slot,night=false,busy=false,cooldownUntil,now=Date.now()}:{place:string;destination:string;slot:string;night?:boolean;busy?:boolean;cooldownUntil?:string;now?:number}){
 if((place!=='bedroom'&&place!=='living')||place!==destination||night||busy||Date.parse(cooldownUntil??'')>now)return;
 return `${slot}:${place}:${cooldownUntil??'first'}`;
}

export function nextManaStop(time:string,place:string,date?:string){
 return manaDayForDate(date).find(slot=>slot.start>time&&slot.place!==place)??manaDayForDate(date?followingDate(date):undefined).find(slot=>slot.place!==place);
}

export function residentOutingPlan(resident:ResidentId,time:string,date?:string){
 return residentDayForDate(resident,date).find(slot=>time>=slot.start&&time<slot.end)?.place;
}

export function nextResidentStop(resident:ResidentId,time:string,date?:string){
 return residentDayForDate(resident,date).find(slot=>slot.start>time)??residentDayForDate(resident,date?followingDate(date):undefined)[0];
}
