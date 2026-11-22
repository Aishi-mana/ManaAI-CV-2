import {isRecord} from './validation';
import {residentIds} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';

export type ActivityKeepsake={id:string;kind:'sketch'|'bookmark'|'trinket';owner:TownCharacter;participants:SharedMemory['with'][];at:string;moment:string};
export const activityKeepsakeNames={sketch:'Pond sketch',bookmark:'Reading bookmark',trinket:'Workshop trinket'};

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
 }else if((action==='aishi-read'||action==='aishi-group-read'||(action==='park-meetup'||action==='resident-park-meetup')&&moment.includes('read together'))&&participants.includes('lyra')){
  kind='bookmark';owner='lyra';
 }else if((action==='aishi-tinker'||action==='workshop-tinkering')&&participants.includes('mana')){
  kind='trinket';owner='mana';
 }
 if(!kind||!owner||history.some(keepsake=>keepsake.id===eventId))return history;
 return validateActivityKeepsakes([...history,{id:eventId,kind,owner,participants:[...participants],at:now.toISOString(),moment}]);
}
