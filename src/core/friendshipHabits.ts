import {trackedTownIds,townActors} from './townCharacters';
import {residentIds} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';

export type Friend=TownCharacter|'aishi';
export type FriendshipPair={first:TownCharacter;second:TownCharacter};
const people:readonly Friend[]=trackedTownIds;
export const friendName=(person:Friend)=>townActors[person].name;
export function sharedFriendMoments(memories:readonly SharedMemory[],first:Friend,second:Friend,now=Date.now()){
 const events=new Map<string,{id:string;memoryId:string;at:number;activity:string;fact:string}>();
 if(first===second)return [];
 for(const memory of memories){
  if(!(memory.owner===first&&memory.with===second||memory.owner===second&&memory.with===first))continue;
  const at=Date.parse(memory.at);
  if(!Number.isFinite(at)||at>now||/cancel|declin|invit|request|while-mana-slept|sleep-followup/i.test(`${memory.id} ${memory.activity}`))continue;
  const suffix=`:${memory.owner}:${memory.with}`;
  const id=memory.id.endsWith(suffix)?memory.id.slice(0,-suffix.length):memory.id;
  if(!events.has(id))events.set(id,{id,memoryId:memory.id,at,activity:memory.activity,fact:memory.fact});
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
 const apart=last===undefined?0:Math.max(0,(now-last)/(24*60*60_000)-2);
 const catchingUp=1+Math.min(.12,apart*.024);
 return familiar*catchingUp*(last!==undefined&&now-last<30*60_000? .6:1);
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
  return moments.length?[{first,second,profile:friendshipActivityProfile(memories,first,second,now),lastTogether:new Date(moments[moments.length-1].at).toISOString(),catchingUp:now-moments[moments.length-1].at>=2*24*60*60_000,moments:moments.length,activities:[...new Set(moments.map(moment=>moment.activity))].slice(-3)}]:[];
 }));
}
export function friendshipHabitContext(owner:TownCharacter,memories:readonly SharedMemory[],now=Date.now()){
 const habits=friendshipHabitSummaries(memories.filter(memory=>memory.owner===owner),now).filter(habit=>habit.first===owner||habit.second===owner);
 return habits.length?`\nFamiliar shared experiences (recorded facts, not feelings or commitments): ${JSON.stringify(habits.map(habit=>({friend:friendName(habit.first===owner?habit.second:habit.first),sharedMoments:habit.moments,activities:habit.activities,familiarActivities:habit.profile.filter(item=>item.sessions>=2).map(item=>({activity:friendActivityLabels[item.activity],separateSessions:item.sessions})),lastTogether:habit.lastTogether,catchingUpOpportunity:habit.catchingUp})))}. These may gently inform optional free-time invitations. Repeated activities suggest familiar options, never a proven favorite or an exclusive bond. Time apart only suggests an opportunity to catch up when both are free; never imply anyone missed, neglected or owes another person company. Keep variety and respect current availability. Do not infer affection levels, dislikes, loneliness, exclusivity, promises or automatic acceptance. Past company never proves anyone is present now.\n`:'';
}

export type FriendActivity='sketch'|'read'|'quiet'|'cafe'|'tinker'|'stars';
export const friendActivityLabels:Record<FriendActivity,string>={sketch:'Sketching',read:'Reading',quiet:'Quiet company',cafe:'Café breaks',tinker:'Workbench time',stars:'Stargazing'};
function rememberedActivity(moment:ReturnType<typeof sharedFriendMoments>[number]):FriendActivity|undefined{
 // Dialogue about a project is not evidence that its activity happened together.
 if(/project-update:|project-news:|phone|check-in|small-favor/i.test(`${moment.id} ${moment.activity}`))return;
 const identity=`${moment.id} ${moment.activity}`;
 const text=`${identity} ${moment.fact}`;
 if(/quiet[- ]company|quiet companionship/i.test(identity))return 'quiet';
 if(/cafe|café|coffee shop/i.test(identity))return 'cafe';
 if(/tinker|workbench|workshop/i.test(identity))return 'tinker';
 if(/sketch/i.test(identity))return 'sketch';
 if(/reading|aishi-(?:group-)?read|hangout-read/i.test(identity))return 'read';
 if(/stargaz/i.test(identity))return 'stars';
 // A generic park meeting needs its recorded completed outcome to identify the activity.
 if(/park-meetup|park meetup/i.test(identity)){
  if(/sketched/i.test(moment.fact))return 'sketch';
  if(/read together/i.test(moment.fact))return 'read';
  if(/watched the stars/i.test(moment.fact))return 'stars';
  if(/quiet break together|quiet time together/i.test(text))return 'quiet';
 }

}
export function friendshipActivityProfile(memories:readonly SharedMemory[],first:Friend,second:Friend,now=Date.now()){
 const grouped=new Map<FriendActivity,{sessions:number;lastSessionAt:number;lastAt:number}>();
 for(const moment of sharedFriendMoments(memories,first,second,now)){
  const activity=rememberedActivity(moment);if(!activity)continue;
  const entry=grouped.get(activity)??{sessions:0,lastSessionAt:0,lastAt:0};
  if(!entry.sessions||moment.at-entry.lastSessionAt>=6*60*60_000){entry.sessions++;entry.lastSessionAt=moment.at;}
  entry.lastAt=Math.max(entry.lastAt,moment.at);grouped.set(activity,entry);
 }
 return [...grouped].map(([activity,value])=>({activity,sessions:value.sessions,lastAt:value.lastAt})).sort((a,b)=>b.sessions-a.sessions||b.lastAt-a.lastAt);
}
export function chooseFriendActivity(memories:readonly SharedMemory[],first:Friend,second:Friend,allowed:readonly FriendActivity[],roll=Math.random(),now=Date.now()){
 const choices=[...new Set(allowed)];if(!choices.length)return;
 const profile=friendshipActivityProfile(memories,first,second,now);
 const weights=choices.map(activity=>{const history=profile.find(item=>item.activity===activity);return (1+(history&&history.sessions>=2?Math.min(.6,history.sessions*.15):0))*(history&&now-history.lastAt<30*60_000?.75:1);});
 let remaining=Math.max(0,Math.min(.999999,roll))*weights.reduce((a,b)=>a+b,0);
 return choices.find((_,index)=>(remaining-=weights[index])<0)??choices[0];
}

export function friendshipQuietCompanyChance(memories:readonly SharedMemory[],first:Friend,second:Friend,now=Date.now()){
 const quiet=friendshipActivityProfile(memories,first,second,now).find(item=>item.activity==='quiet');
 return .5+(quiet&&quiet.sessions>=2?Math.min(.15,quiet.sessions*.04):0);
}
