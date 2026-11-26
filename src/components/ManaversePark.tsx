import CharacterGesture from './CharacterGesture';
import WinterScenery from './WinterScenery';
import AutumnScenery from './AutumnScenery';
import SpringScenery from './SpringScenery';
import FlowerScenery from './FlowerScenery';
import {TownWeatherEffects} from './TownWeather';
import MapTransferArrow from './MapTransferArrow';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {parkStreetThreshold,type ParkPoint} from '../core/manaversePark';
import OutdoorPetBot from './OutdoorPetBot';
import type {OutdoorPetPosition} from './useOutdoorPetWalk';
import {useSceneLine} from './SceneVoice';
import ResidentSprite from './ResidentSprite';
import ManaSprite from './ManaSprite';
import type {RoomContact} from '../core/roomPhone';
import {parkActivities,type ParkChat} from './useParkChat';

export type ParkWalker={point:ParkPoint;frame:number;facing:number;walking:boolean};
type ParkResident={contact:RoomContact;walker:ParkWalker;drop?:(point:ParkPoint)=>void;bench?:{point:ParkPoint;pose:string;label:string}};

export default function ManaversePark({petBot,walker,residents,chat,follow,onPan,exit,onManaDrop}:{petBot?:OutdoorPetPosition;onManaDrop?:(point:ParkPoint)=>void;walker?:ParkWalker;residents:(ParkResident|undefined)[];chat?:ParkChat;follow:boolean;onPan:()=>void;exit:()=>void}){
 const view=useRef<HTMLDivElement>(null);
 const map=useRef<HTMLDivElement>(null);
 const drag=useRef<{id:number;x:number;y:number;left:number;top:number;moved:boolean}|undefined>(undefined);
 const point=walker?.point;
 const shared=chat?.planned?parkActivities[chat.activity]:undefined;
 const [workingChat,setWorkingChat]=useState<ParkChat>();
 const doingActivity=!!shared&&workingChat===chat;
 useEffect(()=>{
  if(!chat?.planned)return;
  const timer=window.setTimeout(()=>setWorkingChat(chat),8000);
  return ()=>clearTimeout(timer);
 },[chat]);
 const facingPartner=(id:ParkChat['first'],point:ParkPoint,fallback:number)=>{
  if(!chat||(chat.first!==id&&chat.second!==id))return fallback;
  if(doingActivity)return point.x<50?1:-1;
  const partner=chat.first===id?chat.second:chat.first;
  const resident=residents.find(person=>person?.contact===partner);
  const target=partner==='mana'?walker?.point:resident?.bench?.point??resident?.walker.point;
  return target?target.x<point.x?-1:1:fallback;
 };
 useEffect(()=>{
  if(!view.current||!map.current)return;
  const initial=point??parkStreetThreshold;
  view.current.scrollLeft=initial.x/100*map.current.offsetWidth-view.current.clientWidth/2;
  view.current.scrollTop=initial.y/100*map.current.offsetHeight-view.current.clientHeight*.65;
 },[]);
 useEffect(()=>{
  if(!follow||!point||!view.current||!map.current)return;
  const viewport=view.current;
  viewport.scrollLeft=point.x/100*map.current.offsetWidth-viewport.clientWidth/2;
  viewport.scrollTop=point.y/100*map.current.offsetHeight-viewport.clientHeight*.65;
 },[follow,point]);
 function pan(event:PointerEvent<HTMLDivElement>){
  const start=drag.current;
  if(!start||start.id!==event.pointerId)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(!start.moved&&Math.hypot(dx,dy)<6)return;
  if(!start.moved)onPan();
  start.moved=true;
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.scrollLeft=start.left-dx;
  event.currentTarget.scrollTop=start.top-dy;
 }
 return <div className="companion-room-body manaverse-outside">
  <p>Drag to look around the park.</p>
  <div className="manaverse-park-view" ref={view} tabIndex={0} role="group" aria-label="Manaverse Park"
   onPointerDown={event=>{
    if(event.button!==0||(event.target as HTMLElement).closest('button'))return;
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop,moved:false};
   }}
   onPointerMove={pan} onPointerCancel={()=>{drag.current=undefined;}}
   onPointerUp={()=>{drag.current=undefined;}}>
   <div className="manaverse-park-map" ref={map}>
    <TownWeatherEffects/>
    <img className="manaverse-street-art" src="./companion-room/manaverse-park-small-pond.webp" alt="" draggable={false}/>
    <WinterScenery area="park"/>
    <AutumnScenery area="park"/>
    <SpringScenery area="park"/>
    <FlowerScenery season="summer" area="park"/>
    <div className="manaverse-park-lights" aria-hidden="true"/>
    <MapTransferArrow point={parkStreetThreshold} direction="down" label="Return to Manaverse Street" onClick={exit}/>
    {petBot&&<OutdoorPetBot point={petBot.point} facing={petBot.facing}/>}
    {residents.map(resident=>{
     if(!resident)return null;
     const {contact,walker,bench}=resident;
     const point=bench?.point??walker.point;
     const name=contact==='luna'?'Luna':'Lyra';
     const together=chat?.planned&&(chat.first===contact||chat.second===contact);
     const pose=together
      ?doingActivity&&(chat.activity==='stars'?(contact==='luna'?'window':'think'):bench?.pose)
      :bench?.pose;
     return <CharacterGesture character={contact} onDrop={!chat&&!walker.walking&&!bench?resident.drop:undefined} key={contact} className="manaverse-street-actor manaverse-park-actor" style={{left:`${point.x}%`,top:`${point.y}%`,zIndex:Math.round(point.y)}}>
      {pose?<img className={together?'park-shared-pose':undefined} src={`./companion-room/${contact}-${pose}.png`}
       style={together?{scale:`${facingPartner(contact,point,walker.facing)} 1`}:undefined} alt={together?name:bench?.label}/>:
       <ResidentSprite resident={contact} walking={walker.walking} facing={facingPartner(contact,point,walker.facing)} visible/>}
      {bench&&!together&&<span className="manaverse-park-activity">{name} · {contact==='luna'?'Sketching':'Reading'}</span>}
     {doingActivity&&chat?.first===contact&&<span className="manaverse-park-activity">{shared.label}</span>}
     </CharacterGesture>;
    })}
    {walker&&<CharacterGesture character="mana" onDrop={!chat&&!walker.walking?onManaDrop:undefined} className="manaverse-street-actor manaverse-park-actor" style={{left:`${walker.point.x}%`,top:`${walker.point.y}%`,zIndex:Math.round(walker.point.y)}}>
     <ManaSprite walking={walker.walking&&!(doingActivity&&chat?.second==='mana')} pose={doingActivity&&chat?.second==='mana'?shared.manaPose:'idle'} facing={facingPartner('mana',walker.point,walker.facing)}/>
     {doingActivity&&chat?.second==='mana'&&<span className="manaverse-park-activity">{shared.label}</span>}
    </CharacterGesture>}
    {chat&&!doingActivity&&<ParkConversation chat={chat} walker={walker} residents={residents}/>}
   </div>
  </div>
 </div>;
}

function ParkConversation({chat,walker,residents}:{chat:ParkChat;walker?:ParkWalker;residents:(ParkResident|undefined)[]}){
 const [reply,setReply]=useState(false);
 useEffect(()=>{
  setReply(false);
  const timer=window.setTimeout(()=>setReply(true),chat.planned?4000:3200);
  return ()=>clearTimeout(timer);
 },[chat]);
 const id=reply?chat.second:chat.first;
 const activity=chat.planned?parkActivities[chat.activity]:undefined;
 const partner=reply?chat.first:chat.second;
 const nameOfPartner=partner==='mana'?'Mana':partner==='luna'?'Luna':'Lyra';
 const quietReading=chat.planned&&chat.activity==='read';
 const generated=useSceneLine(quietReading&&reply||chat.planned&&chat.lines?undefined:`NPC conversation: Shared-moment partner: ${partner}. You are at the park pond speaking to ${nameOfPartner}. ${activity?`Your shared activity is ${activity.label}.`:!chat.planned&&chat.sketch?'One of you has been sketching.':'You just crossed paths.'} ${reply?'Respond to the encounter':'Say a greeting that fits'}.`,id);
 const line=quietReading&&reply?undefined:chat.planned&&chat.lines?(reply?chat.lines.second:chat.lines.first):generated;
 const resident=residents.find(person=>person?.contact===id);
 const point=id==='mana'?walker?.point:resident?.bench?.point??resident?.walker.point;
 if(!point)return null;
 const name=id==='mana'?'Mana':id==='luna'?'Luna':'Lyra';
 return line?<p className="manaverse-street-speech" role="status" style={{left:`${Math.max(14,Math.min(86,point.x))}%`,top:`${point.y-10}%`}}><strong>{name}</strong> {line}</p>:null;
}


