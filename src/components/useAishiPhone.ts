import {useEffect,useRef,useState,type RefObject} from 'react';
import {saveRoom,type RoomState} from '../core/companionRoom';
import {aishiInvitationMessage,validateAishiPhone,type AishiPhoneMessage,type AishiPhoneState} from '../core/aishiPhone';
import type {CharacterHangoutOffer} from '../core/aishiHangouts';
import type {TownCharacter} from '../core/residentRelationships';
type Options={room:RefObject<RoomState>;enabled:boolean;ready:boolean;canReply?:()=>boolean;context:(contact:TownCharacter)=>string;reply:(contact:TownCharacter,history:readonly AishiPhoneMessage[],context:string,signal:AbortSignal)=>Promise<string>};
export function useAishiPhone(options:Options){
 const latest=useRef(options);latest.current=options;
 const [state,setState]=useState(()=>validateAishiPhone(options.room.current.aishiPhone));
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const request=useRef<AbortController|undefined>(undefined);
 const change=(next:AishiPhoneState)=>{const s=latest.current;const clean=validateAishiPhone(next);s.room.current={...s.room.current,aishiPhone:clean};saveRoom(s.room.current);setState(clean);};
 const current=()=>validateAishiPhone(latest.current.room.current.aishiPhone);
 useEffect(()=>{if(!options.enabled){request.current?.abort();request.current=undefined;setBusy(false);}},[options.enabled]);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function send(contact:TownCharacter,text?:string){
  const s=latest.current;if(!s.enabled||!s.ready||s.canReply?.()===false||request.current)return;
  let next=current();
  if(text!==undefined){if(!text.trim()||text.trim().length>1000)return;next={...next,messages:[...next.messages,{id:`aishi-text-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,contact,from:'aishi',at:new Date().toISOString(),text:text.trim()}]};change(next);}
  const outgoing=next.messages.filter(message=>message.contact===contact).slice(-1)[0];if(outgoing?.from!=='aishi')return;
  const controller=new AbortController();request.current=controller;setBusy(true);setStatus('');
  try{const reply=await s.reply(contact,next.messages,s.context(contact),controller.signal);
   if(controller.signal.aborted||!latest.current.enabled||latest.current.canReply?.()===false)return;
   const phone=current(),last=phone.messages.filter(message=>message.contact===contact).slice(-1)[0];
   if(last?.id!==outgoing.id)return;
   if(!reply.trim()||reply.length>240){setStatus('No reply yet. You can retry when the AI is available.');return;}
   change({...phone,messages:[...phone.messages,{id:`aishi-reply-${outgoing.id}`,contact,from:'contact',at:new Date().toISOString(),text:reply.trim()}]});
  }catch{if(!controller.signal.aborted)setStatus('The message is saved. You can retry the reply.');}
  finally{if(request.current===controller){request.current=undefined;setBusy(false);}}
 }
 function rememberOffer(offer:CharacterHangoutOffer){const phone=current(),message=aishiInvitationMessage(offer);if(!phone.messages.some(old=>old.id===message.id))change({...phone,messages:[...phone.messages,message]});}
 function invitationStatus(id:string,status:NonNullable<AishiPhoneMessage['invitation']>['status']){const phone=current();if(!phone.messages.some(message=>message.id===id&&message.invitation?.status==='pending'))return;change({...phone,messages:phone.messages.map(message=>message.id===id&&message.invitation?.status==='pending'?{...message,invitation:{...message.invitation,status}}:message)});}
 function markRead(contact:TownCharacter,id:string){const phone=current();if(phone.read[contact]!==id)change({...phone,read:{...phone.read,[contact]:id}});}
 return {state,busy,status,send,rememberOffer,invitationStatus,markRead};
}
