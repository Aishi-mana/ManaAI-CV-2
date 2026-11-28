import {useEffect,useRef,useState,type RefObject} from 'react';
import {saveRoom,type RoomState} from '../core/companionRoom';
import {journalClock} from '../core/clock';
import {chooseFriendshipPair,availableFriendshipPairs} from '../core/friendshipHabits';
import {gatheringSlots,gatheringWindowAvailable,gatheringProposalPrompt,gatheringReplyPrompt,readGatheringProposal,readGatheringReply,validateCharacterGatherings,finishCharacterGathering,type CharacterGathering} from '../core/characterGatherings';
import type {TownCharacter} from '../core/townCharacters';
import type {CustomTownEvent} from '../core/townEvents';
import {useSceneTask} from './useSceneTask';

type Options={room:RefObject<RoomState>;enabled:boolean;ready:boolean;busy:boolean;sheltering:boolean;timeZone:string;events:readonly CustomTownEvent[];lease:RefObject<AbortController|undefined>;socialAllowed:(owner:TownCharacter)=>boolean;free:(owner:TownCharacter)=>boolean;decide:(owner:TownCharacter,prompt:string,signal:AbortSignal)=>Promise<string>;start:(plan:CharacterGathering)=>boolean;running:(plan:CharacterGathering)=>boolean;cancel:(plan:CharacterGathering)=>void};
export function useCharacterGatherings(options:Options){
 const [plans,setPlans]=useState(()=>options.room.current.characterGatherings??[]);
 const latest=useRef(options);latest.current=options;
 const save=(next:CharacterGathering[])=>{const room=latest.current.room;room.current={...room.current,characterGatherings:next};saveRoom(room.current);setPlans(next);};
 // A loaded journey is not a live journey. Never restart it or infer attendance.
 useEffect(()=>{const old=latest.current.room.current.characterGatherings??[];if(old.some(plan=>plan.status==='going'))save(old.map(plan=>plan.status==='going'?{...plan,status:'cancelled',reason:'The app closed before this gathering finished.'}:plan));},[]);
 useSceneTask(options.enabled,options.ready,300_000,options.lease,async signal=>{
  const s=latest.current,now=new Date(),clock=journalClock(now,s.timeZone),history=s.room.current.characterGatherings??[];
  if(s.busy||clock.time<'09:00'||clock.time>='19:00'||history.some(plan=>plan.status==='planned'||plan.status==='going')||history.some(plan=>journalClock(new Date(plan.createdAt),s.timeZone).date===clock.date)||now.getTime()-Date.parse(s.room.current.gatheringProposedAt??'1970-01-01')<6*60*60_000)return;
  const candidates=availableFriendshipPairs(true,true).filter(pair=>s.socialAllowed(pair.first)&&s.socialAllowed(pair.second)&&s.free(pair.first)&&s.free(pair.second));
  const pair=chooseFriendshipPair(s.room.current.sharedMemories??[],candidates);if(!pair)return;
  const host=Math.random()<.5?pair.first:pair.second,guest=host===pair.first?pair.second:pair.first;
  const slots=gatheringSlots(host,guest,s.timeZone,s.events,now);if(!slots.length)return;
  s.room.current={...s.room.current,gatheringProposedAt:now.toISOString()};saveRoom(s.room.current);
  const proposal=readGatheringProposal(await s.decide(host,gatheringProposalPrompt(host,guest,slots,s.room.current.sharedMemories??[],s.timeZone),signal),slots);
  if(signal.aborted||!proposal||!latest.current.enabled||latest.current.busy||!latest.current.socialAllowed(host)||!latest.current.socialAllowed(guest)||!latest.current.free(host)||!latest.current.free(guest))return;
  const reply=readGatheringReply(await s.decide(guest,gatheringReplyPrompt(host,guest,proposal.slot,proposal.text,s.timeZone),signal));
  const current=latest.current;
  if(signal.aborted||!reply?.accepted||!current.enabled||current.busy||!current.socialAllowed(host)||!current.socialAllowed(guest)||!current.free(host)||!current.free(guest)||Date.parse(proposal.slot.startsAt)-Date.now()<15*60_000||!gatheringWindowAvailable(host,guest,proposal.slot.startsAt,proposal.slot.endsAt,current.timeZone,current.events))return;
  if((current.room.current.characterGatherings??[]).some(plan=>plan.status==='planned'||plan.status==='going'))return;
  const plan={id:`gathering-${host}-${now.toISOString()}`,host,guest,kind:proposal.slot.kind,title:'',message:proposal.text,reply:reply.text,createdAt:now.toISOString(),startsAt:proposal.slot.startsAt,endsAt:proposal.slot.endsAt,status:'planned' as const};
  save(validateCharacterGatherings([...(current.room.current.characterGatherings??[]),plan]));
 });
 useEffect(()=>{
  if(!options.enabled)return;
  const tick=()=>{
   if(document.visibilityState!=='visible')return;
   const s=latest.current,old=s.room.current.characterGatherings??[],now=Date.now();let changed=false;
   const next=old.map(plan=>{
    if(plan.status!=='planned'&&plan.status!=='going')return plan;
    const windowOkay=gatheringWindowAvailable(plan.host,plan.guest,plan.startsAt,plan.endsAt,s.timeZone,s.events);
    const expired=now>=Date.parse(plan.endsAt)||plan.status==='planned'&&now>Date.parse(plan.startsAt)+10*60_000;
    const stopped=plan.status==='going'&&!s.running(plan);
    if(stopped||expired||!windowOkay||now>=Date.parse(plan.startsAt)&&s.sheltering&&plan.kind!=='cafe'){
     if(plan.status==='going')s.cancel(plan);changed=true;
     return {...plan,status:'cancelled' as const,reason:stopped?'The shared activity ended before completion.':expired?'The available time passed.':!windowOkay?'Another town event or schedule now takes priority.':'Outdoor weather needs shelter.'};
    }
    if(plan.status==='planned'&&now>=Date.parse(plan.startsAt)&&!s.busy&&s.free(plan.host)&&s.free(plan.guest)&&s.start(plan)){
     changed=true;return {...plan,status:'going' as const,startedAt:new Date(now).toISOString()};
    }
    return plan;
   });if(changed)save(next);
  };
  tick();const timer=window.setInterval(tick,5000);return ()=>window.clearInterval(timer);
 },[options.enabled]);
 function record(action:string,outcome:string,participants:readonly string[]){
  if(document.visibilityState!=='visible')return;
  const old=latest.current.room.current.characterGatherings??[],next=finishCharacterGathering(old,action,outcome,participants);
  if(next.some((plan,index)=>plan!==old[index]))save(next);
 }
 return {plans,record};
}
