import {useEffect,useLayoutEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {aishiActivities,type AishiActivity} from '../core/aishiActivities';
import {sharedRoomActorDepth,type RoomObject} from '../core/companionRoom';
import {cafeActorDepth,isWalkableOfficeRoom,officeRoomActorDepth,meetingRoomActorDepth,officeActorDepth} from '../core/officeWalk';
import {homeThresholds,isOfficeRoom,isTownBuilding,type OfficeLayout,type StreetPoint,type StreetTrip} from '../core/manaverseStreet';
import {sceneTravelMs,travelPoint} from '../core/manaverseMovement';


import type {ManaverseArea} from './ManaverseMap';
import {useSceneLine} from './SceneVoice';
import {manaverseWalkRoute,planManaverseTransfer} from '../core/manaverseNavigation';
import {manaversePassage} from '../core/manaversePassage';

const sceneSelector='.companion-room-scene,.manaverse-street,.manaverse-park-map,.district-interior';

const {livingToStreet}=homeThresholds;
const sceneSpeakers={Mana:'mana',Luna:'luna',Lyra:'lyra'} as const;
type Name=keyof typeof sceneSpeakers;
type Player={area:ManaverseArea;point:StreetPoint;facing:number};
export type JoinedActivityScene={area:ManaverseArea;point:StreetPoint;facing:number;speaker:Name;activity:string;context?:string;onComplete?:()=>void};

export function useManaversePlayer(area:ManaverseArea,setArea:(area:ManaverseArea)=>void,furniture:Partial<Record<ManaverseArea,readonly RoomObject[]>>,officeLayout:OfficeLayout|undefined,setJoining:(id:AishiActivity|undefined)=>void,onActivityComplete:(id:AishiActivity)=>void){
 const root=useRef<HTMLElement>(null);
 const [player,setPlayer]=useState<Player>();
 const playerPosition=useRef(player?.point);
 playerPosition.current=player?.point;
 const [stage,setStage]=useState<Element>();
 const [frame,setFrame]=useState(0);
 const [walking,setWalking]=useState(false);
 const [speech,setSpeech]=useState<{name:Name;speaker:HTMLElement}>();
 const generatedGreeting=useSceneLine(speech&&stage?.contains(speech.speaker)?`Quick greeting: Aishi just walked up to you in ${area}. Say a casual hello that fits the moment.`:undefined,speech?sceneSpeakers[speech.name]:'mana');
 const [notice,setNotice]=useState('');
 const [sharedScene,setSharedScene]=useState<JoinedActivityScene>();
 const generatedSharedLine=useSceneLine(sharedScene?.context,sharedScene?sceneSpeakers[sharedScene.speaker]:'mana');
 const joining=useRef<AishiActivity|undefined>(undefined);
 const completion=useRef(onActivityComplete);
 completion.current=onActivityComplete;
 const joinTimer=useRef<number|undefined>(undefined);
 const tripFrame=useRef(0);
 const travelling=useRef(false);
 const lastGreeting=useRef<Partial<Record<Name,number>>>({});
 const down=useRef<{id:number;x:number;y:number;scene:Element}|undefined>(undefined);
 useEffect(()=>()=>{cancelAnimationFrame(tripFrame.current);clearTimeout(joinTimer.current);},[]);
 useLayoutEffect(()=>{
  if(!player){setStage(undefined);return;}
  const bodies=root.current?.querySelectorAll('.companion-room-body:not([hidden])')??[];
  setStage(Array.from(bodies).map(body=>body.querySelector(sceneSelector)).find(Boolean)??undefined);
 },[area,!!player]);
 useLayoutEffect(()=>{
  if(stage)root.current?.focus({preventScroll:true});
 },[stage]);
 useLayoutEffect(()=>{
  if(!player||!stage)return;
  const viewport=stage.parentElement;
  if(!viewport?.matches('.interior-viewport,.manaverse-park-view,.scene-viewport'))return;
  if(player.area==='town-hall'&&Number(root.current?.style.getPropertyValue('--scene-zoom'))<=1)return;
  const stageBounds=stage.getBoundingClientRect(),viewBounds=viewport.getBoundingClientRect();
  viewport.scrollLeft+=stageBounds.left-viewBounds.left+player.point.x/100*stageBounds.width-viewport.clientWidth/2;
  viewport.scrollTop+=stageBounds.top-viewBounds.top+player.point.y/100*stageBounds.height-viewport.clientHeight*.7;
 },[player,stage]);
 useEffect(()=>{
  if(!player)return;
  setFrame(0);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let blink=0;
  const timer=window.setInterval(()=>{
   setFrame(value=>1-value);
   if(!walking)blink=window.setTimeout(()=>setFrame(0),140);
  },walking?145:2800);
  return ()=>{clearInterval(timer);clearTimeout(blink);};
 },[!!player,walking]);
 useEffect(()=>{
  if(!stage)return;
  let previousNearby=new Set<HTMLElement>();
  const timer=window.setInterval(()=>{
   const point=playerPosition.current;
   if(!point)return;
   const nearby=Array.from(stage.querySelectorAll<HTMLElement>('.character-gesture')).filter(actor=>{
    const name=actor.querySelector('button')?.getAttribute('aria-label')?.replace('Interact with ','') as Name;
    return actor.dataset.asleep!=='true'&&Object.prototype.hasOwnProperty.call(sceneSpeakers,name)&&
     Math.hypot(parseFloat(actor.style.left)-point.x,(parseFloat(actor.style.top)-point.y)*.7)<7;
   });
   const speaker=nearby.find(actor=>{
    const name=actor.querySelector('button')!.getAttribute('aria-label')!.replace('Interact with ','') as Name;
    return !previousNearby.has(actor)&&Date.now()-(lastGreeting.current[name]??0)>40_000;
   });
   previousNearby=new Set(nearby);
   setSpeech(active=>active&&!nearby.includes(active.speaker)?undefined:active);
   if(!speaker||joining.current)return;
   const name=speaker.querySelector('button')!.getAttribute('aria-label')!.replace('Interact with ','') as Name;
   lastGreeting.current[name]=Date.now();
   setSpeech({name,speaker});
  },450);
  return ()=>clearInterval(timer);
 },[stage]);
 useEffect(()=>{
  if(!speech)return;
  const timer=window.setTimeout(()=>setSpeech(undefined),12_000);
  return ()=>clearTimeout(timer);
 },[speech]);
 function diveIn(){
  setNotice('');
  setArea('living');
  setPlayer({area:'living',point:livingToStreet,facing:-1});
 }
 function diveOut(){
  stopJoining();
  cancelAnimationFrame(tripFrame.current);
  travelling.current=false;
  down.current=undefined;
  setWalking(false);setPlayer(undefined);setSpeech(undefined);setNotice('');
 }
 function stopJoining(){
  if(!joining.current)return;
  joining.current=undefined;
  clearTimeout(joinTimer.current);
  cancelAnimationFrame(tripFrame.current);
  travelling.current=false;
  setWalking(false);
  setSharedScene(undefined);
  setJoining(undefined);
  setNotice('');
 }
 function move(to:StreetPoint,destination?:ManaverseArea,entry?:StreetPoint,activity?:AishiActivity,sharedActivity?:JoinedActivityScene){
  if(!player)return;
  if(travelling.current&&!joining.current)return;
  stopJoining();
  const route=(destination?planManaverseTransfer(player.area,destination,player.point,furniture[player.area],officeLayout)?.route:manaverseWalkRoute(player.area,player.point,to,furniture[player.area],officeLayout))?.slice(1)??[];
  if(!route.length){setNotice('That spot isn’t reachable.');return;}
  if(activity){
   joining.current=activity;
   setJoining(activity);
   setSpeech(undefined);
   root.current?.focus({preventScroll:true});
  }
  setNotice('');travelling.current=true;setWalking(true);setFrame(0);
  let from=player.point,index=0,facing=player.facing;
  let leg:StreetTrip={from,to:route[0],started:performance.now()};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now:number){
   const duration=sceneTravelMs(player!.area,leg.from,leg.to);
   const done=reduced||now-leg.started>=duration;
   const point=done?leg.to:travelPoint(leg.from,leg.to,now-leg.started,duration);
   if(leg.to.x!==leg.from.x)facing=leg.to.x<leg.from.x?-1:1;
   if(done&&++index>=route.length){
    travelling.current=false;setWalking(false);setFrame(0);
    if(destination&&entry){setSpeech(undefined);setPlayer({area:destination,point:entry,facing});setArea(destination);}
    else if(activity){
     const shared=sharedActivity??aishiActivities[activity];
     setPlayer({...player!,point,facing:shared.facing});
     setNotice(shared.activity);
     setSharedScene(sharedActivity);
     joinTimer.current=window.setTimeout(()=>{
      if(joining.current!==activity)return;
      if(sharedActivity?.onComplete)sharedActivity.onComplete();else completion.current(activity);
      stopJoining();
     },15_000);
    }else setPlayer({...player!,point,facing});
    return;
   }
   setPlayer({...player!,point,facing});
   if(done){from=leg.to;leg={from,to:route[index],started:now};}
   tripFrame.current=requestAnimationFrame(tick);
  }
  tripFrame.current=requestAnimationFrame(tick);
  return true;
 }
 function joinActivity(id:AishiActivity,override?:JoinedActivityScene){
  const activity:JoinedActivityScene=override??{...aishiActivities[id],context:
   id==='tinker'?'Aishi just joined you to fit gears at the Workshop workbench. Say a quick welcome as you tinker together.':
    id==='read'?'Aishi just joined you to read by the library window. Say a quick welcome without inventing the book or its contents.':
     'Aishi just joined you to sketch by the park pond. Say a quick welcome or offer a small sketching suggestion.'};
  if(player?.area===activity.area&&joining.current!==id){
   if(!travelling.current&&Math.hypot(player.point.x-activity.point.x,player.point.y-activity.point.y)<.001){
    stopJoining();joining.current=id;setJoining(id);setSpeech(undefined);
    setPlayer({...player,facing:activity.facing});setNotice(activity.activity);setSharedScene(activity);
    root.current?.focus({preventScroll:true});
    joinTimer.current=window.setTimeout(()=>{if(joining.current!==id)return;if(activity.onComplete)activity.onComplete();else completion.current(id);stopJoining();},15_000);
    return true;
   }
   return move(activity.point,undefined,undefined,id,activity);
  }
 }
 function go(destination:ManaverseArea){
  if(!player||destination===player.area)return;
  const door=manaversePassage(player.area,destination);
  if(door)move(door.exit,destination,door.entry);
  else setNotice('Follow the doors and streets to reach that place.');
 }
 function onPointerDown(event:PointerEvent<HTMLElement>){
  if(!player||event.button!==0||(event.target as Element).closest('button, input, select, a, [role="dialog"]'))return;
  const hit=(event.target as Element).closest(sceneSelector);
  if(hit===stage&&hit)down.current={id:event.pointerId,x:event.clientX,y:event.clientY,scene:hit};
 }
 function onPointerUp(event:PointerEvent<HTMLElement>){
  const start=down.current;down.current=undefined;
  if(!player||!start||start.id!==event.pointerId||Math.hypot(event.clientX-start.x,event.clientY-start.y)>6)return;
  const bounds=start.scene.getBoundingClientRect();
  move({x:(event.clientX-bounds.left)/bounds.width*100,y:(event.clientY-bounds.top)/bounds.height*100});
 }
 function onKeyDown(event:KeyboardEvent<HTMLElement>){
  if(!player||(event.target as Element).closest('button,input,textarea,select,[role="dialog"]'))return;
  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(!direction)return;
  event.preventDefault();
  const stride=3.5;
  move({x:player.point.x+direction[0]*stride,y:player.point.y+direction[1]*stride});
 }
 const avatar=player&&stage?createPortal(<div className="manaverse-player" data-room={player.area==='library'||player.area==='lyra-room'||player.area==='luna-home'||!!furniture[player.area]||isOfficeRoom(player.area)||isTownBuilding(player.area)}
  style={{left:`${player.point.x}%`,top:`${player.point.y}%`,zIndex:furniture[player.area]?sharedRoomActorDepth({x:player.point.x,y:player.point.y*6.98}):player.area==='cafe'?cafeActorDepth(player.point):player.area==='office'?officeActorDepth(player.point,officeLayout):player.area==='meeting-room'?meetingRoomActorDepth(player.point):isWalkableOfficeRoom(player.area)?officeRoomActorDepth(player.area,player.point):Math.round(player.point.y)}}>
  <div className="manaverse-player-sprite" role="img" aria-label="Aishi"
   style={{backgroundImage:'url("./companion-room/aishi-sprites.webp")',backgroundPosition:`${frame*100}% ${walking?100:0}%`,scale:`${player.facing} 1`}}/>
 </div>,stage):null;
 const sceneLine=sharedScene;
 const sceneSpeaker=sceneLine&&stage?.querySelector(`.character-gesture:has(button[aria-label="Interact with ${sceneLine.speaker}"])`);
 const sharedText=generatedSharedLine;
 const sharedDialogue=sceneLine&&sceneSpeaker&&sharedText?createPortal(
  <p className="manaverse-player-greeting" role="status" aria-label={`${sceneLine.speaker}: ${sharedText}`}>{sharedText}</p>,sceneSpeaker
 ):null;
 const greetingText=generatedGreeting;
 const greeting=speech&&greetingText&&stage?.contains(speech.speaker)?createPortal(
  <p className="manaverse-player-greeting scene-proximity-line" role="status" aria-label={`${speech.name}: ${greetingText}`}>{greetingText}</p>,speech.speaker
 ):null;
 return {active:!!player,playerArea:player?.area,playerPoint:player?.point,walking,diveIn,diveOut,go,joinActivity,stopJoining,avatar:<>{avatar}{greeting}{sharedDialogue}</>,notice,root,onPointerDown,onPointerUp,onKeyDown};
}
