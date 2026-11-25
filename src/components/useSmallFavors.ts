import {useEffect,useRef,useState,type RefObject} from 'react';
import type {RoomState} from '../core/companionRoom';
import {roomSleepNight} from '../core/companionRoom';
import {aishiActivities,type AishiActivity} from '../core/aishiActivities';
import {smallFavorChoice,smallFavorNearby,smallFavorAnswer,SMALL_FAVOR_GAP,smallFavors} from '../core/smallFavors';
import type {MemoryInvitation} from '../core/memoryInvitations';
import type {StreetPoint} from '../core/manaverseStreet';
import type {ManaverseArea} from './ManaverseMap';
import {residentProfiles} from '../core/residentProfiles';
import {useSceneTask} from './useSceneTask';

type Offer={choice:MemoryInvitation;text:string};
export type SmallFavor=Offer&{stage:'offered'|'helping'|'answering'|'completed';expires:number;answer?:string};
type Options={enabled:boolean;ready:boolean;timeZone:string;room:RefObject<RoomState>;lease:RefObject<AbortController|undefined>;root:RefObject<HTMLElement|null>;
 available?:AishiActivity;area?:ManaverseArea;point?:StreetPoint;walking:boolean;joining?:AishiActivity;allowOffers?:boolean;
 choose:(owner:MemoryInvitation['owner'],choices:MemoryInvitation[],signal:AbortSignal)=>Promise<Offer|undefined>;
 join:(activity:AishiActivity)=>boolean|undefined;onComplete:(action:string,title:string,outcome:string,owner:MemoryInvitation['owner'])=>void};

export function useSmallFavors(options:Options){
 const [favor,setFavor]=useState<SmallFavor>();
 const current=useRef(options);current.current=options;
 const active=useRef(favor);active.current=favor;
 const lastOffer=useRef(Date.now()-SMALL_FAVOR_GAP+45_000);
 const change=(next:SmallFavor|undefined)=>{active.current=next;setFavor(next);};
 function available(activity:AishiActivity,atActivity=false){
  const state=current.current,name=activity==='tinker'?'Mana':residentProfiles[activity==='sketch'?'luna':'lyra'].name;
  const actor=state.root.current?.querySelector<HTMLElement>(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${name}"])`);
  return !!(state.enabled&&document.visibilityState==='visible'&&!roomSleepNight(new Date(),state.timeZone)&&state.available===activity&&actor&&!actor.closest('[hidden]')&&actor.dataset.asleep!=='true'&&actor.querySelector('button')?.getAttribute('data-held')!=='true'&&!state.root.current?.querySelector('.companion-room-body:not([hidden]) .scene-open-chat')&&smallFavorNearby(activity,state.area,state.point,state.walking,atActivity));
 }
 useSceneTask(options.enabled,options.ready,15_000,options.lease,async signal=>{
  const state=current.current,activity=state.available;
  if(state.allowOffers===false||!activity||active.current||state.joining||!available(activity)||Date.now()-lastOffer.current<SMALL_FAVOR_GAP)return;
  const choice=smallFavorChoice(activity,state.room.current.sharedMemories??[]);
  lastOffer.current=Date.now();
  const offer=await state.choose(choice.owner,[choice],signal);
  const latest=current.current;
  if(signal.aborted||!offer||latest.allowOffers===false||offer.choice.id!==choice.id||offer.choice.owner!==choice.owner||!available(activity)||active.current||latest.joining||choice.memoryId&&!(latest.room.current.sharedMemories??[]).some(memory=>memory.id===choice.memoryId))return;
  change({choice,text:offer.text,stage:'offered',expires:Date.now()+60_000});
 });
 const selected=favor?.choice.activity as AishiActivity|undefined;
 const valid=!!(favor&&selected&&favor.expires>Date.now()&&
  // Walking is expected after accepting; the answer still waits for arrival.
  (favor.stage==='helping'?options.enabled&&options.available===selected&&options.area===aishiActivities[selected].area&&document.visibilityState==='visible'&&!roomSleepNight(new Date(),options.timeZone):available(selected,favor.stage==='answering'))&&
  (!favor.choice.memoryId||(options.room.current.sharedMemories??[]).some(memory=>memory.id===favor.choice.memoryId)));
 useEffect(()=>{
  if(!favor)return;
  if(!valid){change(undefined);return;}
  if(favor.stage==='helping'){
   if(options.joining===selected&&!options.walking&&available(selected!,true))change({...favor,stage:'answering'});
   else if(options.joining!==selected)change(undefined);
  }
 },[favor,valid,options.joining,options.walking,selected]);
 useEffect(()=>{
  if(!favor)return;
  const timeout=window.setTimeout(()=>change(undefined),Math.max(0,favor.expires-Date.now()));
  const hidden=()=>{if(document.visibilityState!=='visible')change(undefined);};
  document.addEventListener('visibilitychange',hidden);
  return ()=>{clearTimeout(timeout);document.removeEventListener('visibilitychange',hidden);};
 },[favor]);
 function accept(){
  const offer=active.current,activity=offer?.choice.activity as AishiActivity|undefined;
  if(!offer||offer.stage!=='offered'||!activity||offer.expires<=Date.now()||!available(activity)||current.current.joining)return;
  if(offer.choice.memoryId&&!(current.current.room.current.sharedMemories??[]).some(memory=>memory.id===offer.choice.memoryId))return;
  const point=current.current.point,target=aishiActivities[activity].point;
  if(point&&Math.hypot(point.x-target.x,point.y-target.y)<.001){change({...offer,stage:'answering',expires:Date.now()+120_000});return;}
  if(current.current.join(activity))change({...offer,stage:'helping',expires:Date.now()+120_000});
 }
 function answer(id:string){
  const offer=active.current,activity=offer?.choice.activity as AishiActivity|undefined;
  if(!offer||offer.stage!=='answering'||!offer.choice.favor||!activity||offer.expires<=Date.now()||!available(activity,true))return;
  if(offer.choice.memoryId&&!(current.current.room.current.sharedMemories??[]).some(memory=>memory.id===offer.choice.memoryId))return;
  const result=smallFavorAnswer(offer.choice.favor,id);if(!result)return;
  change({...offer,stage:'completed',answer:result.label,expires:Date.now()+8000});
  current.current.onComplete(`small-favor-${offer.choice.favor}-${Date.now()}`,smallFavors[offer.choice.favor].title,result.outcome,result.owner);
 }
 const shown=valid?favor:undefined;
 const name=shown?shown.choice.owner==='mana'?'Mana':residentProfiles[shown.choice.owner].name:undefined;
 const speaker=shown?options.root.current?.querySelector(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${name}"])`):undefined;
 return {favor:shown,speaker,accept,answer,dismiss:()=>change(undefined),cooldownUntil:lastOffer.current+SMALL_FAVOR_GAP};
}
