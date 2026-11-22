import {useRef,useState,type RefObject} from 'react';
import {saveRoom,type RoomState} from '../core/companionRoom';
import {canChooseTownGoal,progressTownGoals,townGoalChoice,validateTownPersonalGoals,type TownPersonalGoal} from '../core/townPersonalGoals';
import type {SharedMemory,TownCharacter} from '../core/residentRelationships';
import {useSceneTask} from './useSceneTask';

export function useTownPersonalGoals(room:RefObject<RoomState>,enabled:boolean,ready:boolean,lease:RefObject<AbortController|undefined>,
 choose:(owner:TownCharacter,memories:SharedMemory[],signal:AbortSignal)=>Promise<TownPersonalGoal|undefined>){
 const [goals,setGoals]=useState(()=>room.current.personalGoals??[]);
 const attempts=useRef<Partial<Record<TownCharacter,number>>>({});
 useSceneTask(enabled,ready,60_000,lease,async signal=>{
  const owner=(['luna','lyra','mana'] as const).find(owner=>canChooseTownGoal(room.current.personalGoals??[],owner)&&Date.now()-(attempts.current[owner]??0)>30*60_000);
  if(!owner)return;
  attempts.current[owner]=Date.now();
  const goal=await choose(owner,room.current.sharedMemories??[],signal);
  if(signal.aborted||!goal||goal.owner!==owner||!canChooseTownGoal(room.current.personalGoals??[],owner))return;
  const next=validateTownPersonalGoals([...(room.current.personalGoals??[]),goal]);
  room.current={...room.current,personalGoals:next};
  saveRoom(room.current);
  setGoals(next);
 });
 function record(eventId:string,action:string,outcome:string,participants:readonly SharedMemory['with'][]){
  const previous=room.current.personalGoals??[];
  const next=progressTownGoals(previous,eventId,action,outcome,participants);
  if(next===previous)return;
  room.current={...room.current,personalGoals:next};
  saveRoom(room.current);
  setGoals(next);
 }
 function preferred(owner:TownCharacter,shared=false){
  const goal=goals.find(goal=>goal.owner===owner&&!goal.completedAt);
  if(!goal)return;
  const activity=townGoalChoice(goal).activity;
  if(!shared&&activity.startsWith('shared-'))return;
  return activity.replace('shared-','');
 }
 return {goals,record,preferred};
}
