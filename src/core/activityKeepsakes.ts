import {isRecord} from './validation';
import {residentIds} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';
import {townGoalChoice,type TownPersonalGoal} from './townPersonalGoals';
import {birthdayOwner} from './townEvents';
import type {TownGuestbookVisit} from './townGuestbook';
import {journalClock} from './clock';

export type ActivityKeepsake={id:string;kind:'sketch'|'bookmark'|'trinket'|'birthday-card';owner:TownCharacter;participants:SharedMemory['with'][];at:string;moment:string;project?:{id:string;title:string;sessions:number};birthday?:{date:string;title:string}};
export const activityKeepsakeNames={sketch:'Pond sketch',bookmark:'Reading bookmark',trinket:'Workshop trinket','birthday-card':'Birthday card'};

export function homeDisplayKeepsakes(history:ActivityKeepsake[],goals:TownPersonalGoal[],now=Date.now(),birthdays:TownGuestbookVisit[]=[],timeZone='Asia/Singapore'):ActivityKeepsake[]{
 const clock=journalClock(new Date(now),timeZone);
 return (['mana',...residentIds] as TownCharacter[]).flatMap(owner=>{
  const goal=goals.filter(goal=>goal.owner===owner&&goal.completedAt&&Date.parse(goal.completedAt)<=now&&goal.evidence.length===townGoalChoice(goal).target)
   .sort((a,b)=>Date.parse(b.completedAt!)-Date.parse(a.completedAt!))[0];
  const baseAt=goal?.completedAt??history.find(keepsake=>keepsake.owner===owner)?.at;
  const base=baseAt?journalClock(new Date(baseAt),timeZone):undefined;
  const ownerName=owner==='mana'?'Mana':owner==='luna'?'Luna':'Lyra';
  const birthday=birthdays.filter(visit=>birthdayOwner(visit)===owner&&
   (visit.celebratedWith?visit.celebratedWith.includes(ownerName)&&visit.celebratedWith.length>1:visit.wishedBy?.some(guest=>guest!==ownerName))&&
   (visit.date<clock.date||visit.date===clock.date&&visit.end<=clock.time)&&
   (!base||visit.date>base.date||visit.date===base.date&&visit.end>=base.time)).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(birthday){
   const name=owner==='mana'?'Mana':owner==='luna'?'Luna':'Lyra';
   const company=birthday.celebratedWith??(birthday.wishedBy?.some(guest=>guest!==name)?[name,...birthday.wishedBy]:[]);
   const people=(['mana',...residentIds] as TownCharacter[]).filter(person=>company.includes(person==='mana'?'Mana':person==='luna'?'Luna':'Lyra'));
   if(people.includes(owner)&&people.length>1)return [{id:`birthday-display-${birthday.id}-${birthday.date}`,kind:'birthday-card',owner,participants:people,at:`${birthday.date}T12:00:00Z`,moment:'A birthday card remembering the friends who celebrated together in Town Square.',birthday:{date:birthday.date,title:`${name}’s birthday card`}}];
  }
  if(!goal){const existing=history.find(keepsake=>keepsake.owner===owner);return existing?[existing]:[];}
  const title=townGoalChoice(goal).title;
  return [{id:`project-display-${goal.id}`,kind:owner==='mana'?'trinket' as const:owner==='luna'?'sketch' as const:'bookmark' as const,owner,
   participants:[owner],at:goal.completedAt!,moment:`A small reminder of “${title}”. All ${goal.evidence.length} planned work sessions were completed.`,
   project:{id:goal.id,title,sessions:goal.evidence.length}}];
 });
}

export function projectKeepsakeReflection(keepsake:ActivityKeepsake){
 if(keepsake.birthday)return `You are at home looking at your birthday card, a symbolic reminder of the celebration on ${keepsake.birthday.date}. Recorded company: ${JSON.stringify(keepsake.participants)}. Give one short warm thought about their company. Do not invent your age, card messages, gift givers, presents, cake, dialogue, or absent guests. This is a keepsake of the celebration, not evidence anyone physically made or delivered a card. Do not propose another activity.`;
 if(!keepsake.project)return;
 return `You are at home reflecting on the displayed reminder of your completed project: ${JSON.stringify(keepsake.project.title)}. Recorded completion: ${keepsake.at}; ${keepsake.project.sessions} work sessions. Say one short, warm thought in first person. The display is a symbolic memento, not proof that a generated picture, book, game or machine exists. Do not invent project details, other participants, gifts or dialogue. Do not propose another activity.`;
}

export function validateActivityKeepsakes(value:unknown):ActivityKeepsake[]{
 if(!Array.isArray(value))return [];
 const people:string[]=['mana',...residentIds,'aishi'];
 const valid:ActivityKeepsake[]=[];
 for(const item of value.slice(-32)){
  if(!isRecord(item)||typeof item.id!=='string'||!item.id||typeof item.at!=='string'||!Number.isFinite(Date.parse(item.at))||
   typeof item.moment!=='string'||!item.moment.trim()||!Array.isArray(item.participants)||
   !item.participants.length||!item.participants.every(person=>typeof person==='string'&&people.includes(person)))continue;
  if(!(item.kind==='sketch'&&item.owner==='luna'||item.kind==='bookmark'&&item.owner==='lyra'||item.kind==='trinket'&&item.owner==='mana')||
   !item.participants.includes(item.owner))continue;
  const keepsake:ActivityKeepsake={id:item.id.slice(0,220),kind:item.kind,owner:item.owner,at:item.at,
   moment:item.moment.trim().slice(0,300),participants:[...new Set(item.participants)] as ActivityKeepsake['participants']};
  const previous=valid.findIndex(saved=>saved.owner===keepsake.owner&&saved.kind===keepsake.kind);
  if(previous>=0)valid.splice(previous,1);
  valid.push(keepsake);
 }
 return valid;
}

export function recordActivityKeepsake(history:ActivityKeepsake[],eventId:string,action:string,moment:string,participants:readonly SharedMemory['with'][],now=new Date()):ActivityKeepsake[]{
 let kind:ActivityKeepsake['kind']|undefined;
 let owner:TownCharacter|undefined;
 if((action==='aishi-sketch'||action==='aishi-group-sketch'||(action==='park-meetup'||action==='resident-park-meetup')&&moment.includes('sketched'))&&participants.includes('luna')){
  kind='sketch';owner='luna';
 }else if((action==='aishi-read'||action==='aishi-group-read'||action.startsWith('aishi-hangout-read-')||(action==='park-meetup'||action==='resident-park-meetup')&&moment.includes('read together'))&&participants.includes('lyra')){
  kind='bookmark';owner='lyra';
 }else if((action==='aishi-tinker'||action==='workshop-tinkering')&&participants.includes('mana')){
  kind='trinket';owner='mana';
 }
 if(!kind||!owner||history.some(keepsake=>keepsake.id===eventId))return history;
 return validateActivityKeepsakes([...history,{id:eventId,kind,owner,participants:[...participants],at:now.toISOString(),moment}]);
}
