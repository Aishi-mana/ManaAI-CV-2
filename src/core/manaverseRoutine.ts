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

export function manaRoutine({date,time}:{date:string;time:string}){
 const elapsed=manaDay.filter(entry=>entry.start<=time);
 const slot=elapsed[elapsed.length-1]??manaDay[0];
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

export function nextManaStop(time:string,place:string){
 return manaDay.find(slot=>slot.start>time&&slot.place!==place)??manaDay.find(slot=>slot.place!==place);
}

export function residentOutingPlan(resident:ResidentId,time:string){
 return residentProfiles[resident].outings.find(slot=>time>=slot.start&&time<slot.end)?.place;
}

export function nextResidentStop(resident:ResidentId,time:string){
 const {outings}=residentProfiles[resident];
 return outings.find(slot=>slot.start>time)??outings[0];
}
