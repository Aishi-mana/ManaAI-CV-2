import {useEffect,useRef,type RefObject} from 'react';
import {roomSleepNight,saveRoom,type RoomState} from '../core/companionRoom';
import {eveningWindDown} from '../core/eveningWindDown';
import {CHARACTER_HANGOUT_GAP,characterHangoutChoices,characterHangoutKind,type CharacterHangoutOffer,type AishiHangoutKind} from '../core/aishiHangouts';
import type {MemoryInvitation} from '../core/memoryInvitations';
import type {TownCharacter} from '../core/residentRelationships';
import {nearbyHangoutCharacters} from './useAishiHangouts';
import {useSceneTask} from './useSceneTask';

type Options={enabled:boolean;ready:boolean;timeZone:string;walking:boolean;room:RefObject<RoomState>;root:RefObject<HTMLElement|null>;lease:RefObject<AbortController|undefined>;
 offer?:CharacterHangoutOffer;setOffer:(offer:CharacterHangoutOffer|undefined)=>void;free:(owner:TownCharacter)=>boolean;context:(owner:TownCharacter)=>string;
 choose:(owner:TownCharacter,choices:MemoryInvitation[],signal:AbortSignal)=>Promise<{choice:MemoryInvitation;text:string}|undefined>;
 start:(owner:TownCharacter,kind:AishiHangoutKind,text:string)=>boolean};
export function useCharacterHangoutInvitations(options:Options){
 const latest=useRef(options);latest.current=options;
 const active=useRef(options.offer);active.current=options.offer;
 const change=(offer:CharacterHangoutOffer|undefined)=>{active.current=offer;latest.current.setOffer(offer);};
 const allowed=(owner:TownCharacter)=>{
  const s=latest.current;
  return s.enabled&&!s.walking&&document.visibilityState==='visible'&&!roomSleepNight(new Date(),s.timeZone)&&!eveningWindDown(new Date(),s.timeZone)&&s.free(owner)&&!s.root.current?.querySelector('.companion-room-body:not([hidden]) .scene-open-chat')&&nearbyHangoutCharacters(s.root.current).includes(owner);
 };
 useSceneTask(options.enabled,options.ready,30_000,options.lease,async signal=>{
  const s=latest.current,last=Date.parse(s.room.current.hangoutInvitedAt??'');
  if(active.current||Number.isFinite(last)&&Date.now()-last<CHARACTER_HANGOUT_GAP)return;
  const nearby=nearbyHangoutCharacters(s.root.current).filter(allowed);
  if(!nearby.length)return;
  const owner=nearby[Math.floor(Math.random()*nearby.length)];
  // Save attempts too: a declined AI proposal must not become repeated prompting.
  s.room.current={...s.room.current,hangoutInvitedAt:new Date().toISOString()};saveRoom(s.room.current);
  const choices=characterHangoutChoices(owner,s.context(owner));
  const answer=await s.choose(owner,choices,signal);
  if(signal.aborted||!answer||active.current||!allowed(owner))return;
  const kind=characterHangoutKind(owner,answer.choice.id);
  if(!kind||!answer.text.trim()||answer.text.length>200)return;
  change({owner,kind,text:answer.text.trim(),expires:Date.now()+45_000});
 });
 useEffect(()=>{
  if(!options.offer)return;
  const check=()=>{const offer=active.current;if(offer&&(!allowed(offer.owner)||Date.now()>=offer.expires))change(undefined);};
  check();const timer=window.setInterval(check,750);return ()=>clearInterval(timer);
 },[options.offer,options.enabled,options.walking]);
 function accept(){const offer=active.current;if(!offer)return false;
  if(Date.now()>=offer.expires||!allowed(offer.owner)){change(undefined);return false;}
  const started=latest.current.start(offer.owner,offer.kind,offer.text);change(undefined);return started;
 }
 return {accept,decline:()=>change(undefined)};
}
