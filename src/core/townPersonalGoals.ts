import {isRecord} from './validation';
import {residentProfiles} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';

export const townGoalChoices={
 luna:[{id:'sketch-collection',title:'Collect three sketches',target:3,activity:'sketch'},
  {id:'sketch-with-friends',title:'Share two sketching afternoons',target:2,activity:'shared-sketch'}],
 lyra:[{id:'reading-notes',title:'Make notes from three reading sessions',target:3,activity:'read'},
  {id:'reading-afternoon',title:'Share two reading sessions',target:2,activity:'shared-read'}],
 mana:[{id:'wind-up-collection',title:'Make three workshop trinkets',target:3,activity:'tinker'},
  {id:'shared-workbench',title:'Build something together at the workshop',target:1,activity:'shared-tinker'}],
} as const;
type Choice=(typeof townGoalChoices)[TownCharacter][number];
export interface TownPersonalGoal {
 id:string;owner:TownCharacter;choice:Choice['id'];reason:string;createdAt:string;
 evidence:string[];completedAt?:string;
}
export function townGoalChoice(goal:TownPersonalGoal){
 return townGoalChoices[goal.owner].find(choice=>choice.id===goal.choice)!;
}
export function validateTownPersonalGoals(value:unknown):TownPersonalGoal[]{
 if(!Array.isArray(value))return [];
 const goals:TownPersonalGoal[]=[];
 const ids=new Set<string>();
 for(const item of value.slice(-24)){
  if(!isRecord(item)||typeof item.id!=='string'||ids.has(item.id)||!item.id||
   !Object.prototype.hasOwnProperty.call(townGoalChoices,String(item.owner))||typeof item.createdAt!=='string'||
   !Number.isFinite(Date.parse(item.createdAt))||typeof item.reason!=='string'||!item.reason.trim())continue;
  const owner=item.owner as TownCharacter;
  const choice=townGoalChoices[owner].find(choice=>choice.id===item.choice);
  if(!choice)continue;
  const evidence=Array.isArray(item.evidence)?[...new Set(item.evidence.filter((id):id is string=>typeof id==='string'&&!!id&&id.length<=220))].slice(0,choice.target):[];
  const completedAt=evidence.length===choice.target&&typeof item.completedAt==='string'&&
   Number.isFinite(Date.parse(item.completedAt))&&Date.parse(item.completedAt)>=Date.parse(item.createdAt)?item.completedAt:undefined;
  if(evidence.length===choice.target&&!completedAt)continue;
  if(!completedAt&&goals.some(goal=>goal.owner===owner&&!goal.completedAt))continue;
  ids.add(item.id);
  goals.push({id:item.id.slice(0,220),owner,choice:choice.id,reason:item.reason.trim().slice(0,180),createdAt:item.createdAt,evidence,...(completedAt?{completedAt}:{})});
 }
 return [...goals.filter(goal=>!goal.completedAt),...goals.filter(goal=>goal.completedAt).slice(-9)];
}
export function canChooseTownGoal(goals:TownPersonalGoal[],owner:TownCharacter,now=Date.now()){
 const previous=goals.filter(goal=>goal.owner===owner);
 if(previous.some(goal=>!goal.completedAt))return false;
 const latest=previous[previous.length-1];
 return !latest||now-Date.parse(latest.completedAt!)>=24*60*60_000;
}
export function townGoalPrompt(owner:TownCharacter,memories:SharedMemory[]){
 const name=owner==='mana'?'Mana':residentProfiles[owner].name;
 const personality=owner==='mana'?'Curious and fond of making things with friends.':residentProfiles[owner].description;
 return `You are ${name}. ${personality} Choose one small personal goal you would like to pursue during your existing activities. Return only JSON with choice (one supplied id, or null to wait) and reason (at most 180 characters, in first person). Be specific about why you want to try it. Do not claim any progress or invent a past experience, recipient, gift, or result. Available goals: ${JSON.stringify(townGoalChoices[owner])}. Your memories, used only if relevant: ${JSON.stringify(memories.filter(memory=>memory.owner===owner).slice(-4).map(memory=>memory.fact))}`;
}
export function readTownGoal(raw:string,owner:TownCharacter,now=new Date()):TownPersonalGoal|undefined{
 try{
  const data:unknown=JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/gi,''));
  if(!isRecord(data)||!townGoalChoices[owner].some(choice=>choice.id===data.choice)||typeof data.reason!=='string'||!data.reason.trim()||data.reason.length>180)return;
  return {id:`goal-${owner}-${now.toISOString()}`,owner,choice:data.choice as Choice['id'],reason:data.reason.trim(),createdAt:now.toISOString(),evidence:[]};
 }catch{return;}
}
export function progressTownGoals(goals:TownPersonalGoal[],eventId:string,action:string,outcome:string,participants:readonly SharedMemory['with'][],now=new Date()):TownPersonalGoal[]{
 const sketch=action==='home-sketch'||action==='aishi-sketch'||action==='aishi-group-sketch'||/^(?:resident-)?park-meetup$/.test(action)&&outcome.includes('sketched');
 const read=action==='home-read'||action==='aishi-read'||action==='aishi-group-read'||/^(?:resident-)?park-meetup$/.test(action)&&outcome.includes('read together');
 const tinker=action==='workshop-tinkering'||action==='aishi-tinker';
 let changed=false;
 const next=goals.map(goal=>{
  if(goal.completedAt||!participants.includes(goal.owner)||goal.evidence.includes(eventId)||now.getTime()<Date.parse(goal.createdAt))return goal;
  const choice=townGoalChoice(goal);
  const activity=choice.activity.replace('shared-','');
  if(choice.activity.startsWith('shared-')&&participants.length<2||!(activity==='sketch'&&sketch||activity==='read'&&read||activity==='tinker'&&tinker))return goal;
  changed=true;
  const evidence=[...goal.evidence,eventId];
  return {...goal,evidence,...(evidence.length>=choice.target?{completedAt:now.toISOString()}:{})};
 });
 return changed?next:goals;
}
export function townGoalContext(goals:TownPersonalGoal[],owner:TownCharacter){
 const current=goals.filter(goal=>goal.owner===owner).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,2);
 return current.length?`\nYour personal goals (recorded state): ${JSON.stringify(current.map(goal=>({title:townGoalChoice(goal).title,reason:goal.reason,progress:goal.evidence.length,target:townGoalChoice(goal).target,completed:!!goal.completedAt})))}. Mention a goal only when asked or directly relevant to the activity. Do not claim unrecorded progress.\n`:'';
}
