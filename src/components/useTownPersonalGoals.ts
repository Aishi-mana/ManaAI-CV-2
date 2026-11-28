import {validateProjectCreation,type ProjectCreation} from '../core/projectCreations';
import {townCharacterIds} from '../core/townCharacters';
import {useRef,useState,type RefObject} from 'react';
import {saveRoom,roomSleepNight,type RoomState} from '../core/companionRoom';
import {canChooseTownGoal,progressTownGoals,townGoalChoice,validateTownPersonalGoals,startTownProject,townProjectMilestone,type TownPersonalGoal,type TownGoalId} from '../core/townPersonalGoals';
import {eveningWindDown} from '../core/eveningWindDown';
import type {SharedMemory,TownCharacter} from '../core/residentRelationships';
import {useSceneTask} from './useSceneTask';

export function useTownPersonalGoals(room:RefObject<RoomState>,enabled:boolean,ready:boolean,lease:RefObject<AbortController|undefined>,
 choose:(owner:TownCharacter,memories:SharedMemory[],signal:AbortSignal)=>Promise<TownPersonalGoal|undefined>,options:{timeZone?:string;onMilestone?:(milestone:ReturnType<typeof townProjectMilestone>)=>void;onCompleted?:(goal:TownPersonalGoal)=>void;onCreated?:(goal:TownPersonalGoal)=>void;create?:(goal:TownPersonalGoal,signal:AbortSignal)=>Promise<ProjectCreation|undefined>}={}){
 const [goals,setGoals]=useState(()=>room.current.personalGoals??[]);
 const attempts=useRef<Partial<Record<TownCharacter,number>>>({});
 const current=useRef({enabled,options});current.current={enabled,options};
 useSceneTask(enabled,ready,60_000,lease,async signal=>{
  const zone=options.timeZone??'Asia/Singapore';
  if(roomSleepNight(new Date(),zone)||eveningWindDown(new Date(),zone))return;
  const owner=[...townCharacterIds.filter(id=>id!=='mana'),'mana' as const].find(owner=>canChooseTownGoal(room.current.personalGoals??[],owner)&&Date.now()-(attempts.current[owner]??0)>30*60_000);
  if(!owner)return;
  attempts.current[owner]=Date.now();
  const goal=await choose(owner,room.current.sharedMemories??[],signal);
  if(signal.aborted||!goal||!current.current.enabled||roomSleepNight(new Date(),current.current.options.timeZone??'Asia/Singapore')||eveningWindDown(new Date(),current.current.options.timeZone??'Asia/Singapore')||goal.owner!==owner||!canChooseTownGoal(room.current.personalGoals??[],owner))return;
  const next=validateTownPersonalGoals([...(room.current.personalGoals??[]),goal]);
  room.current={...room.current,personalGoals:next};
  saveRoom(room.current);
  setGoals(next);
 });
 const creationAttempts=useRef<Record<string,number>>({});
 useSceneTask(enabled,ready,45_000,lease,async signal=>{
  const opts=current.current.options;
  if(!opts.create||roomSleepNight(new Date(),opts.timeZone??'Asia/Singapore'))return;
  const pending=(room.current.personalGoals??[]).find(goal=>goal.creationPending&&!goal.creation&&goal.completedAt&&Date.parse(goal.completedAt)<=Date.now()&&Date.now()-(creationAttempts.current[goal.id]??0)>=30*60_000);
  if(!pending)return;
  creationAttempts.current[pending.id]=Date.now();
  const result=await opts.create(pending,signal);
  if(signal.aborted||!current.current.enabled)return;
  const latest=(room.current.personalGoals??[]).find(goal=>goal.id===pending.id);
  if(!latest||latest.creation||!latest.creationPending)return;
  const creation=validateProjectCreation(result,latest);
  if(!creation)return;
  const next=(room.current.personalGoals??[]).map(goal=>goal===latest?{...goal,creation,creationPending:undefined}:goal);
  room.current={...room.current,personalGoals:next};saveRoom(room.current);setGoals(next);
  current.current.options.onCreated?.(next.find(goal=>goal.id===latest.id)!);
 });
 function record(eventId:string,action:string,outcome:string,participants:readonly SharedMemory['with'][]){
  const previous=room.current.personalGoals??[];
  const next=progressTownGoals(previous,eventId,action,outcome,participants,new Date(),options.timeZone??'Asia/Singapore');
  if(next===previous)return [];
  room.current={...room.current,personalGoals:next};
  saveRoom(room.current);
  setGoals(next);
  const advanced=next.filter(goal=>goal.evidence.length>(previous.find(old=>old.id===goal.id)?.evidence.length??0));
  advanced.forEach(goal=>current.current.options.onMilestone?.(townProjectMilestone(goal,action)));
  advanced.filter(goal=>goal.completedAt).forEach(goal=>current.current.options.onCompleted?.(goal));
  return advanced;
 }
 function start(owner:TownCharacter,choice:TownGoalId){
  const project=startTownProject(room.current.personalGoals??[],owner,choice);if(!project)return false;
  const next=validateTownPersonalGoals([...(room.current.personalGoals??[]),project]);
  room.current={...room.current,personalGoals:next};saveRoom(room.current);setGoals(next);return true;
 }
 function preferred(owner:TownCharacter,shared=false){
  const goal=goals.find(goal=>goal.owner===owner&&!goal.completedAt);
  if(!goal)return;
  const activity=townGoalChoice(goal).activity;
  if(!shared&&activity.startsWith('shared-'))return;
  return activity.replace('shared-','');
 }
 return {goals,record,preferred,start};
}
