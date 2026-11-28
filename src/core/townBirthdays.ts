import {townCharacterName} from './townCharacters';
import {birthdayOwner,birthdayTitle,type CustomTownEvent} from './townEvents';
import type {TownGuest,TownGuestbookVisit} from './townGuestbook';
import type {TownCharacter} from './residentRelationships';
export const birthdayGuest=(owner:TownCharacter):TownGuest=>townCharacterName(owner);
export function birthdayWishPrompt(event:CustomTownEvent,speaker:TownCharacter){
 const owner=birthdayOwner(event);if(!owner)return;
 return `NPC conversation: It is ${birthdayTitle(owner)} in Town Square. You and ${birthdayGuest(owner)} are both here at the celebration. ${speaker===owner?'Give one short, warm thank-you for the birthday company.':'Wish the birthday character well in one short, warm sentence, speaking directly to them.'} Do not invent an age, gift, cake, past party, promise or absent participant. Return only the spoken line.`;
}
export function recordBirthdayWish(visits:TownGuestbookVisit[],event:CustomTownEvent,speaker:TownCharacter){
 const owner=birthdayOwner(event),name=birthdayGuest(speaker);
 const visit=visits.find(visit=>visit.id===event.id&&visit.date===event.date);
 if(!owner||!visit||!visit.guests.includes(birthdayGuest(owner))||!visit.guests.includes(name)||visit.wishedBy?.includes(name))return visits;
 return visits.map(item=>item===visit?{...item,wishedBy:[...(item.wishedBy??[]),name]}:item);
}
