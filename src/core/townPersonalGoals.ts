import {validateProjectCreation,projectCreationContext,type ProjectCreation} from './projectCreations';
import {isRecord} from './validation';
import {residentProfiles} from './residentProfiles';
import type {SharedMemory,TownCharacter} from './residentRelationships';
import {journalClock} from './clock';

export const townGoalChoices={
 luna:[{id:'sketch-collection',title:'Collect three sketches',target:3,activity:'sketch'},
  {id:'sketch-with-friends',title:'Share two sketching afternoons',target:2,activity:'shared-sketch'}],
 lyra:[{id:'reading-notes',title:'Make notes from three reading sessions',target:3,activity:'read'},
  {id:'reading-afternoon',title:'Share two reading sessions',target:2,activity:'shared-read'},
  {id:'bottle-catalogue',title:'Organize the bottle collection',target:3,activity:'bottle'}],
 mana:[{id:'wind-up-collection',title:'Make three workshop trinkets',target:3,activity:'tinker'},
  {id:'shared-workbench',title:'Build something together at the workshop',target:1,activity:'shared-tinker'}],
} as const;
type Choice=(typeof townGoalChoices)[TownCharacter][number];
export type TownGoalId=Choice['id'];
export type TownProjectSession={eventId:string;at:string;action:string};
export interface TownPersonalGoal {
 id:string;owner:TownCharacter;choice:Choice['id'];reason:string;createdAt:string;
 evidence:string[];completedAt?:string;
 sessions?:TownProjectSession[];startedBy?:'aishi';creationPending?:true;creation?:ProjectCreation;
}
export function townGoalChoice(goal:TownPersonalGoal){
 return townGoalChoices[goal.owner].find(choice=>choice.id===goal.choice)!;
}
export function validateTownPersonalGoals(value:unknown):TownPersonalGoal[]{
 if(!Array.isArray(value))return [];
 const goals:TownPersonalGoal[]=[];
 const ids=new Set<string>();
 for(const item of value){
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
  const sessionIds=new Set<string>();
  const sessions:TownProjectSession[]=Array.isArray(item.sessions)?item.sessions.flatMap(session=>{
   if(!isRecord(session)||typeof session.eventId!=='string'||!evidence.includes(session.eventId)||sessionIds.has(session.eventId)||typeof session.at!=='string'||!Number.isFinite(Date.parse(session.at))||Date.parse(session.at)<Date.parse(item.createdAt as string)||completedAt&&Date.parse(session.at)>Date.parse(completedAt)||typeof session.action!=='string'||!session.action||session.action.length>100)return [];
   sessionIds.add(session.eventId);return [{eventId:session.eventId,at:session.at,action:session.action}];
  }):[];
  ids.add(item.id);
  const goal:TownPersonalGoal={id:item.id.slice(0,220),owner,choice:choice.id,reason:item.reason.trim().slice(0,180),createdAt:item.createdAt,evidence,...(completedAt?{completedAt}:{}),...(sessions.length?{sessions}:{}),...(item.startedBy==='aishi'?{startedBy:'aishi' as const}:{})};
  const creation=validateProjectCreation(item.creation,goal);
  if(creation)goal.creation=creation;
  else if(completedAt&&sessions.length===evidence.length&&item.creationPending===true)goal.creationPending=true;
  goals.push(goal);
 }
 return [...goals.filter(goal=>!goal.completedAt),...goals.filter(goal=>goal.completedAt)];
}
export function canChooseTownGoal(goals:TownPersonalGoal[],owner:TownCharacter,now=Date.now()){
 const previous=goals.filter(goal=>goal.owner===owner);
 if(previous.some(goal=>!goal.completedAt))return false;
 const latest=previous.slice().sort((a,b)=>Date.parse(b.completedAt!)-Date.parse(a.completedAt!))[0];
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
export function progressTownGoals(goals:TownPersonalGoal[],eventId:string,action:string,outcome:string,participants:readonly SharedMemory['with'][],now=new Date(),timeZone='Asia/Singapore'):TownPersonalGoal[]{
 const sketch=action==='home-sketch'||action==='aishi-sketch'||action==='aishi-group-sketch'||/^(?:resident-)?park-meetup$/.test(action)&&outcome.includes('sketched');
 const read=action==='home-read'||action==='aishi-read'||action==='aishi-group-read'||/^aishi-hangout-read-(?:mana|luna|lyra)-/.test(action)||/^(?:resident-)?park-meetup$/.test(action)&&outcome.includes('read together');
 const tinker=action==='workshop-tinkering'||action==='aishi-tinker';
 let changed=false;
 const next=goals.map(goal=>{
  if(goal.completedAt||!participants.includes(goal.owner)||goal.evidence.includes(eventId)||now.getTime()<Date.parse(goal.createdAt))return goal;
  const choice=townGoalChoice(goal);
  const activity=choice.activity.replace('shared-','');
  if(choice.activity.startsWith('shared-')&&participants.length<2||!(activity==='sketch'&&sketch||activity==='read'&&read||activity==='tinker'&&tinker||activity==='bottle'&&action==='home-bottle'))return goal;
  const day=journalClock(now,timeZone).date;
  if(goal.sessions?.some(session=>journalClock(new Date(session.at),timeZone).date===day))return goal;
  changed=true;
  const evidence=[...goal.evidence,eventId];
  return {...goal,evidence,sessions:[...(goal.sessions??[]),{eventId,at:now.toISOString(),action}],...(evidence.length>=choice.target?{completedAt:now.toISOString(),...((goal.sessions?.length??0)+1===evidence.length?{creationPending:true as const}:{})}:{})};
 });
 return changed?next:goals;
}
/** A daily step in an existing AI-chosen project, never a separate schedule or fabricated memory. */
export function townDailyIntention(goals:TownPersonalGoal[],owner:TownCharacter,now=new Date(),timeZone='Asia/Singapore'){
 const day=journalClock(now,timeZone).date;
 const goal=goals.filter(goal=>goal.owner===owner&&Date.parse(goal.createdAt)<=now.getTime()&&(!goal.completedAt||Date.parse(goal.completedAt)<=now.getTime()&&journalClock(new Date(goal.completedAt),timeZone).date===day)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
 if(!goal)return;
 const sessions=(goal.sessions??[]).filter(session=>Date.parse(session.at)<=now.getTime());
 const done=!!goal.completedAt||sessions.some(session=>journalClock(new Date(session.at),timeZone).date===day);
 const previous=sessions.filter(session=>journalClock(new Date(session.at),timeZone).date<day).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
 let since=journalClock(new Date(goal.createdAt),timeZone).date;
 if(previous){const next=new Date(`${journalClock(new Date(previous.at),timeZone).date}T12:00:00Z`);next.setUTCDate(next.getUTCDate()+1);since=next.toISOString().slice(0,10);}
 const activity=townGoalChoice(goal).activity;
 const title=({sketch:'Spend some time sketching','shared-sketch':'Sketch with someone',read:'Spend some time reading','shared-read':'Read with someone',bottle:'Sort a little of the bottle collection',tinker:'Spend some time at the workbench','shared-tinker':'Make something at the workbench together'} as Record<string,string>)[activity];
 return {owner,projectId:goal.id,day,title,reason:goal.reason,project:townGoalChoice(goal).title,done,carriedFrom:!done&&since<day?since:undefined};
}
export function townGoalContext(goals:TownPersonalGoal[],owner:TownCharacter,now=new Date(),timeZone='Asia/Singapore'){
 const current=goals.filter(goal=>goal.owner===owner).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,2);
 return current.length?`\nYour daily intention: ${JSON.stringify(townDailyIntention(goals,owner,now,timeZone)??null)}. This is a small step in your existing project, not another commitment. An unfinished step carries forward gently, without guilt or a deadline. You may mention it naturally when relevant, without repeating it in every greeting. Only done=true means a matching session actually finished today. It does not mean the whole project is finished. Keep your existing schedule, bedtime, shelter and visits; never teleport or invent an activity to fulfil an intention.\nYour personal goals and ongoing projects (recorded state): ${JSON.stringify(current.map(goal=>({title:townGoalChoice(goal).title,reason:goal.reason,progress:goal.evidence.length,target:townGoalChoice(goal).target,completed:!!goal.completedAt,startedBy:goal.startedBy==='aishi'?'Aishi':'you',nextStep:townProjectNextStep(goal),creation:projectCreationContext(goal)||undefined})))}. Mention a project only when asked or directly relevant. After a matching activity you may briefly reflect on the actual progress and next step. Counted sessions alone do not prove a book was written, a picture was generated, or a complex machine/game was finished. Only a saved digital creation in the project state may be described; pending creation means no result exists yet. Do not claim unrecorded progress or change your schedule to pursue a project.\n`:'';
}

export function townProjectStages(goal:TownPersonalGoal){
 const choice=townGoalChoice(goal),activity=choice.activity.replace('shared-','');
 const label=activity==='sketch'?'Sketching':activity==='read'?'Reading':activity==='bottle'?'Bottle-sorting':'Workbench';
 return Array.from({length:choice.target},(_,index)=>({label:`${choice.activity.startsWith('shared-')?'Shared ':''}${label.toLowerCase()} session ${index+1}`,done:index<goal.evidence.length,at:goal.sessions?.find(session=>session.eventId===goal.evidence[index])?.at}));
}
export function townProjectNextStep(goal:TownPersonalGoal){
 return goal.completedAt?'Completed':townProjectStages(goal).find(stage=>!stage.done)?.label??'Completed';
}
export function startTownProject(goals:TownPersonalGoal[],owner:TownCharacter,choice:TownGoalId,now=new Date()){
 if(!canChooseTownGoal(goals,owner,now.getTime()))return;
 const project=readTownGoal(JSON.stringify({choice,reason:'A project chosen by Aishi.'}),owner,now);
 return project?{...project,startedBy:'aishi' as const}:undefined;
}
export function townProjectMilestone(goal:TownPersonalGoal,sourceAction:string){
 const name=goal.owner==='mana'?'Mana':residentProfiles[goal.owner].name,choice=townGoalChoice(goal);
 return {action:`town-project-${goal.owner}-${sourceAction}-${goal.evidence.length}`,title:`${name}’s little project`,outcome:`${name}’s project “${choice.title}”: ${goal.evidence.length} of ${choice.target} work sessions completed.${goal.completedAt?' The project’s planned sessions are complete.':` Next: ${townProjectNextStep(goal)}.`}`};
}

export function townProjectCompletionPrompt(goal:TownPersonalGoal){
 if(!goal.completedAt)return;
 return `You have just finished the planned sessions for your little project: ${townGoalChoice(goal).title}. Recorded progress: ${goal.evidence.length} completed sessions. Aishi is here. Tell Aishi in one warm, short sentence how you feel about finishing. Speak directly as yourself, without narration or stage directions. Only refer to the recorded work; do not invent an illustration, physical gift, working machine, game, or other artifact to show or give. You are taking a break before another project; do not promise a new activity or change your schedule. Completion record: ${goal.id}, ${goal.completedAt}.`;
}
