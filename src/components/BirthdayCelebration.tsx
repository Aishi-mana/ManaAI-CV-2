import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {birthdayOwner,type CustomTownEvent} from '../core/townEvents';
import {birthdayGuest,birthdayWishPrompt} from '../core/townBirthdays';
import type {TownCharacter} from '../core/residentRelationships';
import type {TownGuestbookVisit} from '../core/townGuestbook';
import {useSceneLine,SCENE_BUBBLE_MS} from './SceneVoice';

export default function BirthdayCelebration({events,present,visits,root,onWish}:{events:readonly CustomTownEvent[];present:TownCharacter[];visits:TownGuestbookVisit[];root:HTMLElement|null;onWish:(event:CustomTownEvent,speaker:TownCharacter)=>void}){
 const [turn,setTurn]=useState<{event:CustomTownEvent;speaker:TownCharacter}>();
 const attempted=useRef(new Map<string,number>());
 const latest=useRef(onWish);latest.current=onWish;
 const valid=turn&&events.some(event=>event.id===turn.event.id&&event.date===turn.event.date)&&present.includes(turn.speaker)&&present.includes(birthdayOwner(turn.event)!);
 const line=useSceneLine(valid?birthdayWishPrompt(turn.event,turn.speaker):undefined,turn?.speaker);
 useEffect(()=>{
  if(turn){if(!valid)setTurn(undefined);return;}
  for(const event of events){
   const owner=birthdayOwner(event);if(!owner||!present.includes(owner))continue;
   const visit=visits.find(visit=>visit.id===event.id&&visit.date===event.date);
   if(!visit)continue;
   const speaker=[...present.filter(person=>person!==owner),owner].find(person=>
    (person!==owner||present.length>1)&&!visit.wishedBy?.includes(birthdayGuest(person))&&Date.now()-(attempted.current.get(`${event.date}:${event.id}:${person}`)??0)>=120_000);
   if(speaker){attempted.current.set(`${event.date}:${event.id}:${speaker}`,Date.now());setTurn({event,speaker});return;}
  }
 },[turn,valid,events,present,visits]);
 useEffect(()=>{
  if(!turn)return;
  if(line&&valid)latest.current(turn.event,turn.speaker);
  const timer=window.setTimeout(()=>setTurn(undefined),line?SCENE_BUBBLE_MS:30_000);
  return ()=>clearTimeout(timer);
 },[turn,line,valid]);
 const speaker=line&&valid?root?.querySelector(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${birthdayGuest(turn.speaker)}"])`):undefined;
 return speaker&&line?createPortal(<p className="manaverse-player-greeting scene-birthday-line" role="status">{line}</p>,speaker):null;
}
