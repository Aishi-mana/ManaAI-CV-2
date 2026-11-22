import type {MapCharacters,ManaverseArea} from '../components/ManaverseMap';
import {aishiActivities} from './aishiActivities';
import type {MemoryInvitation} from './memoryInvitations';
import {journalClock} from './clock';
import {residentProfiles,type ResidentId} from './residentProfiles';
import {townGoalChoice,type TownPersonalGoal} from './townPersonalGoals';
import type {TownEventCalendar} from './townEvents';
import type {PhoneMessage} from './roomPhone';

export type TownTodayCard={id:string;title:string;detail:string;area:ManaverseArea};
export type TownTodayState={
 characters:MapCharacters;activeEvents:TownEventCalendar['active'];goals:TownPersonalGoal[];
 meetup?:{contact:ResidentId;place:'park'|'cafe'};
 friends?:{host:ResidentId;activity:'sketch'|'read';ready:boolean;joining:boolean};
 offer?:{owner:'mana'|ResidentId;activity:MemoryInvitation['activity'];text:string};
};
export function townTodayCards(state:TownTodayState,pendingVisit:PhoneMessage|undefined,hostVisit:(PhoneMessage&{confirmed:boolean})|undefined,timeZone:string,now=new Date()):TownTodayCard[]{
 const cards:TownTodayCard[]=state.activeEvents.map(event=>({id:`event-${event.id}`,title:event.title,
  detail:`${event.start}–${event.end} · Gathering in Town Square`,area:'square'}));
 if(state.friends){
  cards.push({id:'resident-friends',title:`Luna and Lyra · ${state.friends.activity==='sketch'?'Sketching':'Reading'}`,
   detail:state.friends.joining?'Aishi is joining their activity':state.friends.ready?'Together by the park pond':'On their way to the park pond',area:'park'});
 }
 if(state.meetup)cards.push({id:'mana-meetup',title:`Mana and ${residentProfiles[state.meetup.contact].name}`,
  detail:state.meetup.place==='cafe'?'Arranged a meetup at the Coffee Shop':'Arranged a meetup by the park pond',area:state.meetup.place});
 if(state.offer)cards.push({id:'aishi-invitation',title:`Invitation from ${state.offer.owner==='mana'?'Mana':residentProfiles[state.offer.owner].name}`,
  detail:state.offer.text,area:state.offer.activity==='park'||state.offer.activity==='cafe'?state.offer.activity:aishiActivities[state.offer.activity].area});
 const date=journalClock(now,timeZone).date;
 const scheduledTime=(message:PhoneMessage)=>message.scheduledFor?new Intl.DateTimeFormat(undefined,{timeZone,hour:'numeric',minute:'2-digit'}).format(new Date(message.scheduledFor)):undefined;
 const isToday=(message:PhoneMessage)=>!message.scheduledFor||journalClock(new Date(message.scheduledFor),timeZone).date===date;
 if(pendingVisit&&isToday(pendingVisit))cards.push({id:'home-invitation',title:`Visit with ${residentProfiles[pendingVisit.contact].name}`,
  detail:`Proposed visit to Mana’s living space${scheduledTime(pendingVisit)?` · ${scheduledTime(pendingVisit)}`:''}`,area:'living'});
 if(hostVisit&&isToday(hostVisit))cards.push({id:'resident-home-invitation',title:`${residentProfiles[hostVisit.contact].name}’s invitation`,
  detail:`${hostVisit.confirmed?'Confirmed':'Proposed'} home visit${scheduledTime(hostVisit)?` · ${scheduledTime(hostVisit)}`:''}`,area:residentProfiles[hostVisit.contact].home});
 for(const goal of state.goals.filter(goal=>!goal.completedAt)){
  const choice=townGoalChoice(goal);
  cards.push({id:goal.id,title:`${goal.owner==='mana'?'Mana':residentProfiles[goal.owner].name} · ${choice.title}`,
   detail:`${goal.evidence.length} of ${choice.target} sessions completed`,
   area:state.characters[goal.owner]?.location??(goal.owner==='mana'?'bedroom':residentProfiles[goal.owner].home)});
 }
 return cards;
}
