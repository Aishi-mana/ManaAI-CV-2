import {townCharacterIds} from '../core/townCharacters';
import {useRef,useState,type RefObject} from 'react';
import {saveRoom,roomSleepNight,type RoomState} from '../core/companionRoom';
import {canChooseTownGoal,progressTownGoals,townGoalChoice,validateTownPersonalGoals,startTownProject,townProjectMilestone,type TownPersonalGoal,type TownGoalId} from '../core/townPersonalGoals';
import {eveningWindDown} from '../core/eveningWindDown';
import type {SharedMemory,TownCharacter} from '../core/residentRelationships';
import {useSceneTask} from './useSceneTask';

export function useTownPersonalGoals(room:RefObject<RoomState>,enabled:boolean,ready:boolean,lease:RefObject<AbortController|undefined>,
 choose:(owner:TownCharacter,memories:SharedMemory[],signal:AbortSignal)=>Promise<TownPersonalGoal|undefined>,options:{timeZone?:string;onMilestone?:(milestone:ReturnType<typeof townProjectMilestone>)=>void;onCompleted?:(goal:TownPersonalGoal)=>void}={}){
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
