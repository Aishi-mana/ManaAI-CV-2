import {useEffect,useRef,useState,type RefObject} from 'react';
import {roomSleepNight} from '../core/companionRoom';
import {eveningWindDown} from '../core/eveningWindDown';
import {aishiHangoutKinds,hangoutName,hangoutNextDoor,type AishiHangout,type AishiHangoutKind} from '../core/aishiHangouts';
import type {TownCharacter} from '../core/residentRelationships';
import {manaverseWalkRoute} from '../core/manaverseNavigation';
import type {StreetPoint} from '../core/manaverseStreet';
import type {ManaverseArea} from './ManaverseMap';
import type {JoinedActivityScene} from './useManaversePlayer';
type Options={enabled:boolean;ready:boolean;busy:boolean;sheltering:boolean;timeZone:string;root:RefObject<HTMLElement|null>;lease:RefObject<AbortController|undefined>;
 hangout:AishiHangout|undefined;setHangout:(value:AishiHangout|undefined)=>void;area:ManaverseArea|undefined;point:StreetPoint|undefined;walking:boolean;joining:boolean;
 ownerReady:(owner:TownCharacter,area:ManaverseArea)=>boolean;context:(owner:TownCharacter)=>string;
 ask:(owner:TownCharacter,kind:AishiHangoutKind,context:string,signal:AbortSignal)=>Promise<{accepted:boolean;text:string}|undefined>;
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
  if(pending&&(options.walking||!nearbyHangoutCharacters(options.root.current).includes(pending)))cancel('Walk back nearby to invite them again.');
 },[tick,options.enabled,options.busy,options.sheltering,options.hangout,pending]);
 async function invite(owner:TownCharacter,kind:AishiHangoutKind){
  const state=latest.current;
  if(!allowed()||!state.ready||state.sheltering||active.current||request.current||state.lease.current||state.walking||state.joining||!nearbyHangoutCharacters(state.root.current).includes(owner))return;
  const controller=new AbortController();request.current=controller;state.lease.current=controller;setPending(owner);setMessage('');
  try{
   const answer=await state.ask(owner,kind,state.context(owner),controller.signal);
   if(controller.signal.aborted||!allowed()||latest.current.sheltering||latest.current.walking||!nearbyHangoutCharacters(latest.current.root.current).includes(owner))return;
   if(!answer){setMessage('No reply yet. You can ask again when the AI is available.');return;}
   setMessage(`${hangoutName(owner)}: ${answer.text}`);
   if(answer.accepted){const next:AishiHangout={id:String(Date.now()),owner,kind,phase:'travelling',reply:answer.text};active.current=next;latest.current.setHangout(next);stable.current=undefined;attempts.current={key:'',count:0};}
  }catch(error){if(!controller.signal.aborted)setMessage('The invitation could not finish. You can try again.');}
  finally{if(request.current===controller){request.current=undefined;setPending(undefined);}if(latest.current.lease.current===controller)latest.current.lease.current=undefined;}
 }
 function acceptOffer(owner:TownCharacter,kind:AishiHangoutKind,text:string){
  const state=latest.current;
  if(!allowed()||state.sheltering||active.current||request.current||state.walking||state.joining||!nearbyHangoutCharacters(state.root.current).includes(owner))return false;
  const next:AishiHangout={id:String(Date.now()),owner,kind,phase:'travelling',reply:text};
  active.current=next;state.setHangout(next);stable.current=undefined;attempts.current={key:'',count:0};setMessage(`${hangoutName(owner)}: ${text}`);return true;
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
   const current=latest.current;if(active.current?.id!==hangout.id||!allowed()||current.sheltering||current.walking||current.area!==destination||!current.ownerReady(hangout.owner,destination)||!nearbyHangoutCharacters(current.root.current).includes(hangout.owner))return;
   const finished=active.current;active.current=undefined;current.setHangout(undefined);current.onComplete(finished);setMessage(`Finished spending time with ${hangoutName(finished.owner)}.`);
  }});
  if(joined){const next={...hangout,phase:'sharing' as const};active.current=next;state.setHangout(next);}
 },[tick,options.hangout,options.area,options.walking,options.joining]);
 return {nearby:allowed()&&!options.hangout&&!options.walking&&!options.joining?nearby:[],pending,message,invite,cancel,acceptOffer};
}
