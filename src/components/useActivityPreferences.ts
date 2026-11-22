import {useRef,useState,type RefObject} from 'react';
import {saveRoom,roomSleepNight,type RoomState} from '../core/companionRoom';
import {effectiveActivityPreference,preferenceMemories,preferenceOwners,preferenceOptions,defaultActivityLikes,validateActivityPreferences,type ActivityPreference} from '../core/activityPreferences';
import type {TownCharacter} from '../core/residentRelationships';
import {useSceneTask} from './useSceneTask';

export function useActivityPreferences(room:RefObject<RoomState>,enabled:boolean,ready:boolean,timeZone:string,lease:RefObject<AbortController|undefined>,core:(owner:TownCharacter)=>string[],choose:(owner:TownCharacter,memories:string[],signal:AbortSignal)=>Promise<ActivityPreference|undefined>){
 const [preferences,setPreferences]=useState(()=>room.current.activityPreferences??{});
 const attempts=useRef<Partial<Record<TownCharacter,{at:number;key:string}>>>({});
 const current=useRef({enabled,timeZone,core});current.current={enabled,timeZone,core};
 useSceneTask(enabled,ready,90_000,lease,async signal=>{
  if(roomSleepNight(new Date(),timeZone))return;
  const owner=preferenceOwners.find(owner=>{
   const memories=preferenceMemories(core(owner)),key=JSON.stringify(memories),attempt=attempts.current[owner];
   if(!memories.length||attempt?.key===key&&Date.now()-attempt.at<6*60*60_000)return false;
   const saved=effectiveActivityPreference(owner,room.current.activityPreferences??{},memories);
   return !saved||Date.now()-Date.parse(saved.updatedAt)>24*60*60_000;
  });
  if(!owner)return;
  const memories=preferenceMemories(core(owner)),key=JSON.stringify(memories);
  attempts.current[owner]={at:Date.now(),key};
  const suggestion=await choose(owner,memories,signal);
  if(signal.aborted||!suggestion||!current.current.enabled||document.visibilityState!=='visible'||roomSleepNight(new Date(),current.current.timeZone)||JSON.stringify(preferenceMemories(current.current.core(owner)))!==key)return;
  const next=validateActivityPreferences({...room.current.activityPreferences,[owner]:suggestion});
  if(!effectiveActivityPreference(owner,next,memories))return;
  room.current={...room.current,activityPreferences:next};saveRoom(room.current);setPreferences(next);
 });
 const summaries=preferenceOwners.map(owner=>{
  const saved=effectiveActivityPreference(owner,preferences,core(owner)),likes=saved?.likes??defaultActivityLikes[owner];
  return {owner,likes:preferenceOptions(owner).filter(option=>likes.includes(option.id)).map(option=>option.label),reason:saved?.reason};
 });
 return {preferences,summaries};
}
