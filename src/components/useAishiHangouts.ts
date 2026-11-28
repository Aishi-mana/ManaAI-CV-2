import {uid} from '../core/types';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {roomSleepNight} from '../core/companionRoom';
import {eveningWindDown} from '../core/eveningWindDown';
import {aishiHangoutKinds,hangoutName,hangoutNextDoor,type AishiHangout,type AishiHangoutKind,type PhoneHangoutReply} from '../core/aishiHangouts';
import type {TownCharacter} from '../core/residentRelationships';
import {manaverseWalkRoute} from '../core/manaverseNavigation';
import type {StreetPoint} from '../core/manaverseStreet';
import type {ManaverseArea} from './ManaverseMap';
import type {JoinedActivityScene} from './useManaversePlayer';
type Options={enabled:boolean;ready:boolean;busy:boolean;sheltering:boolean;timeZone:string;root:RefObject<HTMLElement|null>;lease:RefObject<AbortController|undefined>;
 hangout:AishiHangout|undefined;setHangout:(value:AishiHangout|undefined)=>void;area:ManaverseArea|undefined;point:StreetPoint|undefined;walking:boolean;joining:boolean;
 ownerReady:(owner:TownCharacter,area:ManaverseArea)=>boolean;context:(owner:TownCharacter)=>string;
 remoteAvailable?:(owner:TownCharacter)=>boolean;
 ask:(owner:TownCharacter,kind:AishiHangoutKind,context:string,signal:AbortSignal,remote?:boolean)=>Promise<{accepted:boolean;text:string}|undefined>;
 go:(area:ManaverseArea)=>void;join:(scene:JoinedActivityScene)=>boolean|undefined;stop:()=>void;onComplete:(hangout:AishiHangout)=>void};
function actor(root:HTMLElement|null,owner:TownCharacter){return root?.querySelector<HTMLElement>(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${hangoutName(owner)}"])`);}
export function nearbyHangoutCharacters(root:HTMLElement|null):TownCharacter[]{
 const player=root?.querySelector<HTMLElement>('.companion-room-body:not([hidden]) .manaverse-player');if(!player)return [];
 const p=player.getBoundingClientRect();if(!p.width||!p.height)return [];
 return (['mana','luna','lyra'] as TownCharacter[]).filter(owner=>{
  const npc=actor(root,owner);if(!npc||npc.dataset.asleep==='true'||npc.querySelector('button')?.getAttribute('data-held')==='true')return false;
  const n=npc.getBoundingClientRect();return !!n.width&&!!n.height&&Math.hypot(n.left+n.width/2-p.left-p.width/2,n.bottom-p.bottom)<=Math.max(p.height,n.height)*1.6;
 });
}
export function useAishiHangouts(options:Options){
 const latest=useRef(options);latest.current=options;
 const [nearby,setNearby]=useState<TownCharacter[]>([]),[pending,setPending]=useState<TownCharacter>(),[message,setMessage]=useState('');
 const [tick,setTick]=useState(0);const request=useRef<AbortController|undefined>(undefined);
 const active=useRef(options.hangout);active.current=options.hangout;
 const stable=useRef<{id:string;x:number;y:number;count:number}|undefined>(undefined);
 const attempts=useRef({key:'',count:0});
 const remoteRequest=useRef(false);
 const allowed=()=>{const state=latest.current;return state.enabled&&!state.busy&&document.visibilityState==='visible'&&!roomSleepNight(new Date(),state.timeZone)&&!eveningWindDown(new Date(),state.timeZone);};
 function cancel(reason='Hangout cancelled. No completed moment was recorded.'){
  request.current?.abort();if(latest.current.lease.current===request.current)latest.current.lease.current=undefined;
  request.current=undefined;setPending(undefined);
  if(active.current?.phase==='sharing')latest.current.stop();
  active.current=undefined;latest.current.setHangout(undefined);setMessage(reason);
 }
 useEffect(()=>{
  if(!options.enabled){setNearby([]);return;}
  const timer=window.setInterval(()=>{setNearby(nearbyHangoutCharacters(latest.current.root.current));setTick(value=>value+1);},750);
  return ()=>clearInterval(timer);
 },[options.enabled]);
 useEffect(()=>()=>{request.current?.abort();if(latest.current.lease.current===request.current)latest.current.lease.current=undefined;},[]);
 useEffect(()=>{
  if((options.hangout||pending)&&(!allowed()||options.sheltering)){cancel('The hangout ended so everyone can return to their plans or shelter.');return;}
  if(options.hangout?.expires&&Date.now()>=options.hangout.expires){cancel('The meeting plan expired before it was completed.');return;}
  if(pending&&(options.walking||!remoteRequest.current&&!nearbyHangoutCharacters(options.root.current).includes(pending)))cancel('The invitation ended before it could be confirmed.');
 },[tick,options.enabled,options.busy,options.sheltering,options.hangout,pending]);
 function canInvitePhone(){const s=latest.current;return allowed()&&s.ready&&!s.sheltering&&!active.current&&!request.current&&!s.lease.current&&!s.walking&&!s.joining;}
 function startHangout(owner:TownCharacter,kind:AishiHangoutKind,text:string,expires?:number){
  const next:AishiHangout={id:uid(),owner,kind,phase:'travelling',reply:text,...(expires?{expires}:{})};active.current=next;latest.current.setHangout(next);stable.current=undefined;attempts.current={key:'',count:0};setMessage(`${hangoutName(owner)}: ${text}`);return next;
 }
 async function invite(owner:TownCharacter,kind:AishiHangoutKind,remote=false,signal?:AbortSignal):Promise<PhoneHangoutReply|undefined>{
  const state=latest.current;
  if(!canInvitePhone()||signal?.aborted||!remote&&!nearbyHangoutCharacters(state.root.current).includes(owner))return;
  const controller=new AbortController();request.current=controller;remoteRequest.current=remote;state.lease.current=controller;setPending(owner);setMessage('');
  const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
  const deadline=Date.now()+90_000,timer=remote?window.setTimeout(abort,90_000):undefined;
  try{
   const context=state.context(owner)+(remote?` Schedule availability: ${state.remoteAvailable?.(owner)?'free':'busy'}. This is a remote phone invitation.`:'');
   const answer=await state.ask(owner,kind,context,controller.signal,remote);
   if(controller.signal.aborted||remote&&Date.now()>=deadline||!allowed()||latest.current.sheltering||latest.current.walking||!remote&&!nearbyHangoutCharacters(latest.current.root.current).includes(owner))return;
   if(!answer){setMessage('No reply yet. You can ask again when the AI is available.');return;}
   if(answer.accepted&&remote&&!latest.current.remoteAvailable?.(owner)){setMessage('Their plans changed before the invitation could be confirmed.');return;}
   if(!remote||!answer.accepted)setMessage(`${hangoutName(owner)}: ${answer.text}`);
   if(answer.accepted&&!remote){const next=startHangout(owner,kind,answer.text);return {...answer,hangoutId:next.id};}
   return answer;
  }catch(error){if(!controller.signal.aborted)setMessage('The invitation could not finish. You can try again.');}
  finally{if(timer!==undefined)window.clearTimeout(timer);signal?.removeEventListener('abort',abort);if(request.current===controller){request.current=undefined;setPending(undefined);}if(latest.current.lease.current===controller)latest.current.lease.current=undefined;}
 }
 function acceptOffer(owner:TownCharacter,kind:AishiHangoutKind,text:string){
  const state=latest.current;
  if(!allowed()||state.sheltering||active.current||request.current||state.walking||state.joining||!nearbyHangoutCharacters(state.root.current).includes(owner))return false;
  startHangout(owner,kind,text);return true;
 }
 function startPhoneHangout(owner:TownCharacter,kind:AishiHangoutKind,text:string){
  const s=latest.current;if(!allowed()||s.sheltering||active.current||request.current||s.walking||s.joining||!s.remoteAvailable?.(owner))return;
  const next=startHangout(owner,kind,text,Date.now()+10*60_000);return {hangoutId:next.id,expires:next.expires!};
 }
 useEffect(()=>{
  const hangout=options.hangout,state=latest.current;if(!hangout||!allowed()||state.sheltering)return;
  if(hangout.phase==='sharing'){if(!state.joining||!state.ownerReady(hangout.owner,aishiHangoutKinds[hangout.kind].area)||!state.walking&&!nearbyHangoutCharacters(state.root.current).includes(hangout.owner))cancel('The shared break ended before it was completed.');return;}
  if(state.walking||state.joining||!state.area||!state.point)return;
  const destination=aishiHangoutKinds[hangout.kind].area;
  if(state.area!==destination){
   const next=hangoutNextDoor(state.area,destination);if(!next){cancel('No walking route to that meeting place is available.');return;}
   const key=`${hangout.id}:${state.area}:${next}`;attempts.current=attempts.current.key===key?{key,count:attempts.current.count+1}:{key,count:1};
   if(attempts.current.count>5){cancel('The route is blocked. Move to clear floor and try again.');return;}
   state.go(next);return;
  }
  if(!state.ownerReady(hangout.owner,destination))return;
  const npc=actor(state.root.current,hangout.owner);if(!npc)return;
  const feet={x:parseFloat(npc.style.left),y:parseFloat(npc.style.top)};if(!Number.isFinite(feet.x)||!Number.isFinite(feet.y))return;
  const previous=stable.current;stable.current=previous?.id===hangout.id&&Math.hypot(previous.x-feet.x,previous.y-feet.y)<.1?{...previous,count:previous.count+1}:{id:hangout.id,...feet,count:0};
  if(stable.current.count<2)return;
  const point=[{x:feet.x-6,y:feet.y+3},{x:feet.x+6,y:feet.y+3},{x:feet.x,y:feet.y+7}].find(point=>manaverseWalkRoute(destination,state.point!,point).length>0);
  if(!point){cancel('There is no clear place to stand nearby.');return;}
  const joined=state.join({area:destination,point,facing:point.x<feet.x?1:-1,speaker:hangoutName(hangout.owner) as 'Mana'|'Luna'|'Lyra',activity:`Aishi is ${hangout.kind==='read'?'reading':'taking a break'} with ${hangoutName(hangout.owner)}.`,context:`Aishi has arrived for the hangout you accepted. You are together ${destination==='park'?'by the park pond':'at the Coffee Shop'}. Give one short welcome without inventing a completed activity, book or order.`,onComplete:()=>{
   const current=latest.current;if(active.current?.id!==hangout.id||active.current.expires&&Date.now()>=active.current.expires||!allowed()||current.sheltering||current.walking||current.area!==destination||!current.ownerReady(hangout.owner,destination)||!nearbyHangoutCharacters(current.root.current).includes(hangout.owner))return;
   const finished=active.current;active.current=undefined;current.setHangout(undefined);current.onComplete(finished);setMessage(`Finished spending time with ${hangoutName(finished.owner)}.`);
  }});
  if(joined){const next={...hangout,phase:'sharing' as const};active.current=next;state.setHangout(next);}
 },[tick,options.hangout,options.area,options.walking,options.joining]);
 return {nearby:allowed()&&!options.hangout&&!options.walking&&!options.joining?nearby:[],pending,message,invite,cancel,acceptOffer,canInvitePhone,startPhoneHangout};
}
