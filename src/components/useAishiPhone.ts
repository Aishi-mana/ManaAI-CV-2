import {useEffect,useRef,useState,type RefObject} from 'react';
import {saveRoom,type RoomState} from '../core/companionRoom';
import {aishiCheckInCandidates,aishiReplyAnchor,aishiInvitationMessage,validateAishiPhone,type AishiPhoneMessage,type AishiPhoneState} from '../core/aishiPhone';
import {useSceneTask} from './useSceneTask';
import {phoneFact,phoneFactKey,type PhoneFact} from '../core/aishiPhoneMemories';
import {aishiHangoutKinds,type CharacterHangoutOffer,type AishiHangoutKind,type PhoneHangoutReply} from '../core/aishiHangouts';
import type {TownCharacter} from '../core/residentRelationships';
type Options={room:RefObject<RoomState>;enabled:boolean;ready:boolean;canReply?:()=>boolean;onFact?:(fact:PhoneFact)=>void;onForgetFact?:(fact:PhoneFact)=>void;context:(contact:TownCharacter)=>string;reply:(contact:TownCharacter,history:readonly AishiPhoneMessage[],context:string,signal:AbortSignal)=>Promise<string>;
 invite?:(contact:TownCharacter,kind:AishiHangoutKind,signal:AbortSignal)=>Promise<PhoneHangoutReply|undefined>;
 startInvite?:(contact:TownCharacter,kind:AishiHangoutKind,text:string)=>{hangoutId:string;expires:number}|undefined;
 proactive?:{enabled:boolean;lease:RefObject<AbortController|undefined>;free:(contact:TownCharacter)=>boolean;write:(contact:TownCharacter,history:readonly AishiPhoneMessage[],context:string,signal:AbortSignal)=>Promise<string>}};
export function useAishiPhone(options:Options){
 const latest=useRef(options);latest.current=options;
 const [state,setState]=useState(()=>validateAishiPhone(options.room.current.aishiPhone));
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const request=useRef<AbortController|undefined>(undefined);
 const inviting=useRef<string|undefined>(undefined);
 const fallbackLease=useRef<AbortController|undefined>(undefined),attention=useRef(Date.now()),entered=useRef(Date.now());
 const change=(next:AishiPhoneState)=>{const s=latest.current;const clean=validateAishiPhone(next);s.room.current={...s.room.current,aishiPhone:clean};saveRoom(s.room.current);setState(clean);};
 const current=()=>validateAishiPhone(latest.current.room.current.aishiPhone);
 useEffect(()=>{if(!options.enabled){request.current?.abort();request.current=undefined;setBusy(false);}},[options.enabled]);
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{
  if(options.enabled&&request.current)return;
  const phone=current();
  if(phone.messages.some(message=>message.hangoutRequest?.status==='pending'))change({...phone,messages:phone.messages.map(message=>message.hangoutRequest?.status==='pending'?{...message,hangoutRequest:{...message.hangoutRequest,status:'expired'}}:message)});
 },[options.enabled]);
 useEffect(()=>{
  if(!options.enabled)return;
  entered.current=Date.now();attention.current=Date.now();
  const touch=()=>{attention.current=Date.now();};
  for(const event of ['pointerdown','keydown','wheel'])window.addEventListener(event,touch,{passive:true});
  return ()=>{for(const event of ['pointerdown','keydown','wheel'])window.removeEventListener(event,touch);};
 },[options.enabled]);
 const canCheckIn=(contact:TownCharacter)=>{const s=latest.current;return s.enabled&&s.proactive?.enabled&&!request.current&&document.visibilityState==='visible'&&s.canReply?.()!==false&&Date.now()-entered.current>=90_000&&Date.now()-attention.current<5*60_000&&s.proactive.free(contact);};
 useSceneTask(options.enabled&&!!options.proactive?.enabled,options.ready&&!busy,30_000,options.proactive?.lease??fallbackLease,async signal=>{
  const s=latest.current,phone=current(),contact=aishiCheckInCandidates(phone).find(canCheckIn);
  if(!contact||!s.proactive)return;
  const baseline=phone.messages[phone.messages.length-1]?.id;
  change({...phone,checkInAttemptAt:new Date().toISOString(),checkInContact:contact});
  const text=await s.proactive.write(contact,phone.messages,s.context(contact),signal);
  if(signal.aborted||!canCheckIn(contact)||!text.trim()||text.length>240)return;
  const next=current();
  if(next.messages[next.messages.length-1]?.id!==baseline)return;
  change({...next,messages:[...next.messages,{id:`aishi-check-in-${contact}-${Date.now()}`,contact,from:'contact',at:new Date().toISOString(),text:text.trim(),checkIn:true}]});
 });
 async function send(contact:TownCharacter,text?:string,replyTo?:string){
  const s=latest.current;if(!s.enabled||!s.ready||s.canReply?.()===false||request.current)return;
  let next=current();
  if(text!==undefined){if(!text.trim()||text.trim().length>1000)return;const anchor=aishiReplyAnchor(next.messages,contact,replyTo);if(replyTo&&!anchor)return;next={...next,messages:[...next.messages,{id:`aishi-text-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,contact,from:'aishi',at:new Date().toISOString(),text:text.trim(),...(anchor?{replyTo:anchor.id}:{})}]};change(next);}
  const outgoing=next.messages.filter(message=>message.contact===contact).slice(-1)[0];if(outgoing?.from!=='aishi'||outgoing.hangoutRequest)return;
  const controller=new AbortController();request.current=controller;setBusy(true);setStatus('');
  try{const reply=await s.reply(contact,next.messages,s.context(contact),controller.signal);
   if(controller.signal.aborted||!latest.current.enabled||latest.current.canReply?.()===false)return;
   const phone=current(),last=phone.messages.filter(message=>message.contact===contact).slice(-1)[0];
   if(last?.id!==outgoing.id)return;
   if(!reply.trim()||reply.length>240){setStatus('No reply yet. You can retry when the AI is available.');return;}
   change({...phone,messages:[...phone.messages,{id:`aishi-reply-${outgoing.id}`,contact,from:'contact',at:new Date().toISOString(),text:reply.trim(),replyTo:outgoing.id}]});
   const fact=phoneFact(outgoing),saved=current();
   if(fact&&latest.current.onFact&&!saved.facts?.some(old=>old.sourceId===fact.sourceId)){
    latest.current.onFact(fact);
    const updated=current();change({...updated,facts:[...(updated.facts??[]),fact]});
   }
  }catch{if(!controller.signal.aborted)setStatus('The message is saved. You can retry the reply.');}
  finally{if(request.current===controller){request.current=undefined;setBusy(false);}}
 }
 async function invite(contact:TownCharacter,kind:AishiHangoutKind){
  const s=latest.current;if(!s.enabled||!s.ready||s.canReply?.()===false||request.current||!s.invite)return;
  const controller=new AbortController(),id=`aishi-invite-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,expires=Date.now()+90_000;
  request.current=controller;inviting.current=id;setBusy(true);setStatus('');
  const phone=current();change({...phone,messages:[...phone.messages,{id,contact,from:'aishi',at:new Date().toISOString(),text:`Would you like to ${aishiHangoutKinds[kind].label.toLowerCase()} with me?`,hangoutRequest:{kind,expires,status:'pending'}}]});
  try{
   const answer=await s.invite(contact,kind,controller.signal);
   if(controller.signal.aborted||!latest.current.enabled||latest.current.canReply?.()===false||Date.now()>=expires||!answer||!answer.text.trim()||answer.text.length>200)return;
   const plan=answer.accepted?latest.current.startInvite?.(contact,kind,answer.text):undefined;
   if(answer.accepted&&!plan)return;
   const next=current();
   change({...next,messages:[...next.messages.map(message=>message.id===id?{...message,hangoutRequest:{kind,expires:plan?.expires??expires,status:answer.accepted?'accepted' as const:'declined' as const,...(plan?{hangoutId:plan.hangoutId}:{})}}:message),{id:`reply-${id}`,contact,from:'contact',at:new Date().toISOString(),text:answer.text,replyTo:id}]});
  }catch{if(!controller.signal.aborted)setStatus('The invitation could not be confirmed. No meeting was started.');}
  finally{
   const next=current();if(next.messages.some(message=>message.id===id&&message.hangoutRequest?.status==='pending')){
    change({...next,messages:next.messages.map(message=>message.id===id&&message.hangoutRequest?{...message,hangoutRequest:{...message.hangoutRequest,status:'expired'}}:message)});
    if(latest.current.enabled&&!controller.signal.aborted)setStatus('The invitation expired or could not be confirmed. You can invite them again.');
   }
   if(request.current===controller){request.current=undefined;setBusy(false);}if(inviting.current===id)inviting.current=undefined;
  }
 }
 function rememberOffer(offer:CharacterHangoutOffer){const phone=current(),message=aishiInvitationMessage(offer);if(!phone.messages.some(old=>old.id===message.id))change({...phone,messages:[...phone.messages,message]});}
 function invitationStatus(id:string,status:NonNullable<AishiPhoneMessage['invitation']>['status']){const phone=current();if(!phone.messages.some(message=>message.id===id&&message.invitation?.status==='pending'))return;change({...phone,messages:phone.messages.map(message=>message.id===id&&message.invitation?.status==='pending'?{...message,invitation:{...message.invitation,status}}:message)});}
 function markRead(contact:TownCharacter,id:string){const phone=current();if(phone.read[contact]!==id)change({...phone,read:{...phone.read,[contact]:id}});}
 function forgetFact(sourceId:string){const phone=current(),fact=phone.facts?.find(item=>item.sourceId===sourceId&&!item.forgotten);if(!fact)return;latest.current.onForgetFact?.(fact);const next=current();
  const facts=(next.facts??[]).map(item=>item.contact===fact.contact&&phoneFactKey(item.fact)===phoneFactKey(fact.fact)?{...item,forgotten:true as const}:item);
  // Forget wins over a repeated statement whose reply is still pending.
  const outgoing=next.messages.filter(message=>message.contact===fact.contact).slice(-1)[0],pending=outgoing&&phoneFact(outgoing);
  if(pending&&phoneFactKey(pending.fact)===phoneFactKey(fact.fact)&&!facts.some(item=>item.sourceId===pending.sourceId))facts.push({...pending,forgotten:true});
  change({...next,facts});
 }
 return {state,busy,status,send,rememberOffer,invitationStatus,markRead,forgetFact,invite,invitingId:inviting.current};
}
