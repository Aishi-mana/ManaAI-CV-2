import {useRef,useState,type RefObject} from 'react';
import type {RoomState} from '../core/companionRoom';
import {roomSleepNight} from '../core/companionRoom';
import {eveningWindDown} from '../core/eveningWindDown';
import {townCharacterIds,type TownCharacter} from '../core/townCharacters';
import {freeTimeContext,effectiveFreeTimeChoice,freeTimeSocialAllowed,type FreeTimeChoice,type FreeTimeContext} from '../core/freeTimeChoices';
import {useSceneTask} from './useSceneTask';

type Options={room:RefObject<RoomState>;enabled:boolean;ready:boolean;timeZone:string;lease:RefObject<AbortController|undefined>;core:(owner:TownCharacter)=>string[];free:(owner:TownCharacter)=>boolean;choose:(owner:TownCharacter,context:FreeTimeContext,signal:AbortSignal)=>Promise<FreeTimeChoice|undefined>};
/** Session-only intentions, never completion evidence or a second movement controller. */
export function useFreeTimeChoices(options:Options){
 const [choices,setChoices]=useState<Partial<Record<TownCharacter,FreeTimeChoice>>>({});
 const attempts=useRef<Partial<Record<TownCharacter,number>>>({});
 const latest=useRef(options);latest.current=options;
 const decisions=useRef(choices);decisions.current=choices;
 const context=(owner:TownCharacter)=>{const s=latest.current;return freeTimeContext(owner,s.core(owner),s.room.current.personalGoals??[],s.room.current.sharedMemories??[],s.timeZone,new Date(),s.room.current.energy);};
 const get=(owner:TownCharacter)=>effectiveFreeTimeChoice(decisions.current[owner],context(owner));
 const awake=()=>!roomSleepNight(new Date(),latest.current.timeZone)&&!eveningWindDown(new Date(),latest.current.timeZone);
 useSceneTask(options.enabled,options.ready,120_000,options.lease,async signal=>{
  const s=latest.current;if(!s.enabled||!awake())return;
  const owner=townCharacterIds.find(owner=>s.free(owner)&&!get(owner)&&Date.now()-(attempts.current[owner]??0)>=30*60_000);
  if(!owner)return;
  const before=context(owner);attempts.current[owner]=Date.now();
  const choice=await s.choose(owner,before,signal);
  if(signal.aborted||!latest.current.enabled||!awake()||!latest.current.free(owner)||document.visibilityState!=='visible'||!choice)return;
  // A changed or forgotten source while thinking invalidates the proposed intention.
  if(JSON.stringify({sources:context(owner).sources,project:context(owner).project})!==JSON.stringify({sources:before.sources,project:before.project}))return;
  const valid=effectiveFreeTimeChoice(choice,before);if(!valid)return;
  decisions.current={...decisions.current,[owner]:valid};setChoices(decisions.current);
 });
 return {get,socialAllowed:(owner:TownCharacter)=>freeTimeSocialAllowed(get(owner))};
}
