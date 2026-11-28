import {trackedTownIds,townActors} from './townCharacters';
import {residentIds,residentProfiles} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';

export type Friend=TownCharacter|'aishi';
export type FriendshipPair={first:TownCharacter;second:TownCharacter};
const people:readonly Friend[]=trackedTownIds;
export const friendName=(person:Friend)=>townActors[person].name;
export function sharedFriendMoments(memories:readonly SharedMemory[],first:Friend,second:Friend,now=Date.now()){
 const events=new Map<string,{id:string;at:number;activity:string}>();
 if(first===second)return [];
 for(const memory of memories){
  if(!(memory.owner===first&&memory.with===second||memory.owner===second&&memory.with===first))continue;
  const at=Date.parse(memory.at);
  if(!Number.isFinite(at)||at>now||/cancel|declin|invit|request|while-mana-slept|sleep-followup/i.test(`${memory.id} ${memory.activity}`))continue;
  const suffix=`:${memory.owner}:${memory.with}`;
  const id=memory.id.endsWith(suffix)?memory.id.slice(0,-suffix.length):memory.id;
  if(!events.has(id))events.set(id,{id,at,activity:memory.activity});
 }
 return [...events.values()].sort((a,b)=>a.at-b.at);
}
export function friendshipPairWeight(memories:readonly SharedMemory[],pair:{first:Friend;second:Friend},now=Date.now()){
 const moments=sharedFriendMoments(memories,pair.first,pair.second,now);
 // Repeated records in a short session do not build an unlimited preference.
 const sessions=new Set(moments.map(moment=>Math.floor(moment.at/(6*60*60_000)))).size;
 const activities=new Set(moments.map(moment=>moment.activity)).size;
 const familiar=1+Math.min(.65,sessions*.12+activities*.08);
 const last=moments[moments.length-1]?.at;
 return familiar*(last!==undefined&&now-last<30*60_000? .6:1);
}
export function chooseFriendshipPair(memories:readonly SharedMemory[],candidates:readonly FriendshipPair[],roll=Math.random(),now=Date.now()){
 if(!candidates.length)return;
 const weights=candidates.map(pair=>friendshipPairWeight(memories,pair,now));
 let remaining=Math.max(0,Math.min(.999999,roll))*weights.reduce((a,b)=>a+b,0);
 return candidates.find((_,index)=>(remaining-=weights[index])<0)??candidates[candidates.length-1];
}
export function availableFriendshipPairs(mana:boolean,friends:boolean):FriendshipPair[]{
 return [...(mana?residentIds.map(second=>({first:'mana' as const,second})):[]),...(friends?[{first:'luna' as const,second:'lyra' as const}]:[])];
}
export function friendshipHabitSummaries(memories:readonly SharedMemory[],now=Date.now()){
 return people.flatMap((first,index)=>people.slice(index+1).flatMap(second=>{
  const moments=sharedFriendMoments(memories,first,second,now);
  return moments.length?[{first,second,moments:moments.length,activities:[...new Set(moments.map(moment=>moment.activity))].slice(-3)}]:[];
 }));
}
export function friendshipHabitContext(owner:TownCharacter,memories:readonly SharedMemory[],now=Date.now()){
 const habits=friendshipHabitSummaries(memories.filter(memory=>memory.owner===owner),now).filter(habit=>habit.first===owner||habit.second===owner);
 return habits.length?`\nFamiliar shared experiences (recorded facts, not feelings or commitments): ${JSON.stringify(habits.map(habit=>({friend:friendName(habit.first===owner?habit.second:habit.first),sharedMoments:habit.moments,activities:habit.activities})))}. These may gently inform optional free-time invitations. Keep variety and respect current availability. Do not infer affection levels, dislikes, loneliness, exclusivity, promises or automatic acceptance. Past company never proves anyone is present now.\n`:'';
}
