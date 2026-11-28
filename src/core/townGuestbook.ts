import {townCharacterIds,townCharacterName,type TownCharacterName} from './townCharacters';
import {isRecord} from './validation';
import {validTownEvent,birthdayOwner,type CustomTownEvent} from './townEvents';

export type TownGuest=TownCharacterName;
const guestNames:TownGuest[]=townCharacterIds.map(townCharacterName);
export type TownGuestbookVisit=CustomTownEvent&{guests:TownGuest[];wishedBy?:TownGuest[];celebratedWith?:TownGuest[]};

export function validateTownGuestbook(raw:unknown):TownGuestbookVisit[]{
 if(!Array.isArray(raw))return [];
 return raw.flatMap(item=>{
  if(!isRecord(item))return [];
  const {id,title,date,start,end,guests}=item;
  if(typeof id!=='string'||!id||typeof title!=='string'||typeof date!=='string'||typeof start!=='string'||typeof end!=='string'||!Array.isArray(guests))return [];
  const event={id,title,date,start,end};
  const visitors=guestNames.filter(guest=>guests.includes(guest));
  const wishes=Array.isArray(item.wishedBy)?item.wishedBy:[];
  const wishedBy=birthdayOwner(event)?visitors.filter(guest=>wishes.includes(guest)):[];
  const company=Array.isArray(item.celebratedWith)?item.celebratedWith:[];
  const celebratedWith=birthdayOwner(event)?visitors.filter(guest=>company.includes(guest)):[];
  return visitors.length&&validTownEvent(event)?[{...event,guests:visitors,...(wishedBy.length?{wishedBy}:{}),...(celebratedWith.length?{celebratedWith}:{})}]:[];
 });
}

export function recordTownAttendance(visits:TownGuestbookVisit[],events:readonly CustomTownEvent[],present:readonly TownGuest[]){
 if(!events.length||!present.length)return visits;
 let updated=visits;
 for(const {id,title,date,start,end} of events){
  const visit=updated.find(entry=>entry.id===id&&entry.date===date);
  const guests=guestNames.filter(guest=>present.includes(guest)||visit?.guests.includes(guest));
  const owner=birthdayOwner({id});
  const celebratedWith=owner?guestNames.filter(guest=>visit?.celebratedWith?.includes(guest)||present.includes(townCharacterName(owner))&&present.includes(guest)):[];
  if(visit?.guests.length===guests.length&&(visit.celebratedWith?.length??0)===celebratedWith.length)continue;
  updated=[...updated.filter(entry=>entry!==visit),{...visit,id,title,date,start,end,guests,...(celebratedWith.length?{celebratedWith}:{})}];
 }
 return updated;
}

export function townGuestbookEntries(visits:readonly TownGuestbookVisit[],clock:{date:string;time:string}){
 return visits.filter(visit=>visit.date<clock.date||(visit.date===clock.date&&visit.end<=clock.time))
  .sort((a,b)=>b.date.localeCompare(a.date)||b.end.localeCompare(a.end));
}

export function townGuestbookNote(guest:TownGuest,visit:TownGuestbookVisit){
 const others=visit.guests.filter(name=>name!==guest);
 const company=others.join(' and ');
 switch(guest){
  case 'Mana':return company?`I took a break in Town Square for this one. ${company} signed the guestbook too.`:
   'I stopped by Town Square for this one. It felt good to step away from my usual routine.';
  case 'Luna':return company?`I spent part of the gathering in the square. I’m glad ${company} made it too.`:
   'I spent a little time in the square. I’m leaving a note so I’ll remember to come back.';
  case 'Lyra':return company?`I made it to Town Square, and so did ${company}. I’m marking the date here like a bookmark.`:
   'I made it to the gathering in Town Square. This little note is my bookmark for the day.';
 }
}
