import {cafeActorDepth,isCafeFloor,isOfficeFloor,isOfficeHallwayFloor,isMeetingRoomFloor,isOfficeRoomFloor,isTownHallFloor,isWorkshopFloor,officeRoomActorDepth,isWalkableOfficeRoom,meetingRoomActorDepth,officeActorDepth} from '../core/officeWalk';
import CharacterGesture from './CharacterGesture';
import ManaSprite from './ManaSprite';
import ResidentSprite from './ResidentSprite';
import {useEntranceWalk} from './useEntranceWalk';
import {sceneTravelMs,travelPoint} from '../core/manaverseMovement';
import {useSceneLine} from './SceneVoice';
import MapTransferArrow from './MapTransferArrow';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {districtInteriorThresholds,isOfficeRoom,officeFurnitureDefaults,officeFurniturePoint,officeRooms,type OfficeFurniture,type OfficeLayout,townBuildings,townHallThreshold,workforceExitPoints,type OfficeRoom,type StreetPoint,type StreetTrip,type TownInterior} from '../core/manaverseStreet';
import {ROOM_CONTACTS,type RoomContact} from '../core/roomPhone';
import TownNoticeBoard,{type TownNoticePlans} from './TownNoticeBoard';

// Positions are measured at the characters' feet on the illustrated café floor.
const cafeFloor={
 mana:{x:50,y:73},
 luna:{x:31,y:65},
 lyra:{x:78,y:65},
 windowMana:{x:63,y:57},
 windowGuest:{x:72,y:58},
};

function floorPosition(point:{x:number;y:number}){
 return {left:`${point.x}%`,top:`${point.y}%`,zIndex:Math.round(point.y)};
}

function cafePosition(point:StreetPoint){
 return {...floorPosition(point),zIndex:cafeActorDepth(point)};
}

const illustratedInteriors={
 cafe:'cafe-interior-wide',
 workshop:'workshop-interior-smaller-furniture',
 office:'workforce-office-main',
 'meeting-room':'workforce-meeting-room-remade',
 'aishi-office':'aishi-office',
 'office-hallway':'workforce-hallway',
 pantry:'workforce-pantry',
 'rest-area':'workforce-rest-area',
 'town-hall':'town-hall-interior',
} as const;

export function clearInteriorFloor(building:TownInterior,point:StreetPoint){
 const {x,y}=point;
 if(building==='cafe')return isCafeFloor(point);
 if(building==='workshop')return isWorkshopFloor(point);
 if(building==='town-hall')return isTownHallFloor(point);
 if(building==='meeting-room')return isMeetingRoomFloor(point);
 if(isWalkableOfficeRoom(building))return isOfficeRoomFloor(building,point);
 if(building==='office-hallway')return isOfficeHallwayFloor(point);
 if(x<10||x>90||y>96-Math.abs(x-50)*.69)return false;
 return y>=66;
}

export default function DistrictInterior({
 building,shown=true,manaPresent,cafeResidents,cafeLeaving,onCafeExit,cafeChat,cafeEncounter,exit,noticePlans,workshopWorking,officeWorking=false,follow,onPan,openOfficeRoom,officePosition,officeTrip,officeLayout,onSaveOfficeLayout,onManaDrop,onManaPosition,
}:{
 officeWorking?:boolean;
 building:TownInterior;shown?:boolean;manaPresent:boolean;cafeResidents:RoomContact[];cafeLeaving:RoomContact[];onCafeExit:(contact:RoomContact)=>void;cafeChat?:RoomContact;cafeEncounter?:RoomContact;exit:()=>void;noticePlans?:TownNoticePlans;
 onManaDrop?:(point:StreetPoint)=>void;onManaPosition:(point:StreetPoint)=>void;officeLayout?:OfficeLayout;onSaveOfficeLayout:(layout:OfficeLayout)=>void;
 officePosition:StreetPoint;officeTrip?:StreetTrip;workshopWorking:boolean;follow:boolean;onPan:()=>void;openOfficeRoom:(room:OfficeRoom)=>void;
}){
 const view=useRef<HTMLDivElement>(null);
 const scene=useRef<HTMLDivElement>(null);
 const drag=useRef<{id:number;x:number;y:number;left:number;top:number}|undefined>(undefined);
 const [draftLayout,setDraftLayout]=useState<OfficeLayout>();
 const furnitureDrag=useRef<{id:OfficeFurniture;pointer:number;x:number;y:number;start:StreetPoint}|undefined>(undefined);
 const layout=draftLayout??officeLayout??officeFurnitureDefaults;
 function moveFurniture(id:OfficeFurniture,point:StreetPoint){
  setDraftLayout(draft=>draft?{...draft,[id]:officeFurniturePoint(id,point)}:draft);
 }
 function furnitureHandle(id:OfficeFurniture,label:string){
  if(!draftLayout)return null;
  return <button type="button" className="office-furniture-handle" aria-label={label}
   onPointerDown={event=>{
    if(event.button!==0||furnitureDrag.current)return;
    event.currentTarget.setPointerCapture(event.pointerId);
    furnitureDrag.current={id,pointer:event.pointerId,x:event.clientX,y:event.clientY,start:layout[id]};
   }}
   onPointerMove={event=>{
    const start=furnitureDrag.current;
    const bounds=scene.current?.getBoundingClientRect();
    if(!bounds||!start||start.id!==id||start.pointer!==event.pointerId)return;
    moveFurniture(id,{x:start.start.x+(event.clientX-start.x)/bounds.width*100,
     y:start.start.y+(event.clientY-start.y)/bounds.height*100});
   }}
   onLostPointerCapture={event=>{if(furnitureDrag.current?.pointer===event.pointerId)furnitureDrag.current=undefined;}}
   onKeyDown={event=>{
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!direction)return;
    event.preventDefault();
    event.stopPropagation();
    const step=event.shiftKey?2:.4;
    moveFurniture(id,{x:layout[id].x+direction[0]*step,y:layout[id].y+direction[1]*step});
   }}/>;
 }
 const large=building==='cafe'||building==='office'||building==='meeting-room'||building==='office-hallway';
 const workforceRoom=building==='office'||isOfficeRoom(building)?building:undefined;
 const districtThreshold=building==='cafe'||building==='workshop'?districtInteriorThresholds[building]:undefined;
 const exitPoint=(building==='town-hall'?townHallThreshold:districtThreshold)??(workforceRoom?workforceExitPoints[workforceRoom]:undefined);
 const illustratedExit=building==='pantry'||building==='rest-area';
 const exitDestination=building==='town-hall'?'Town Square':building==='office'||districtThreshold?'Second Street':
  isOfficeRoom(building)&&officeRooms[building].parent==='office-hallway'?'Hallway':'AI Workforce Office';
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{
  if(!officeTrip)return;
  let frame=0;
  function tick(){
   if(!officeTrip)return;
   const time=Date.now();
   setNow(time);
   if(time<officeTrip.started+sceneTravelMs(building,officeTrip.from,officeTrip.to))frame=requestAnimationFrame(tick);
  }
  tick();
  return ()=>cancelAnimationFrame(frame);
 },[building,officeTrip]);
 const lunaLeaving=cafeLeaving.includes('luna'),lyraLeaving=cafeLeaving.includes('lyra');
 const lunaPresent=lunaLeaving||cafeResidents.includes('luna'),lyraPresent=lyraLeaving||cafeResidents.includes('lyra');
 function dropCharacter(id:'mana'|RoomContact,point:StreetPoint){
  if(building==='office'?!isOfficeFloor(point,layout):!clearInteriorFloor(building,point))return;
  if(id==='mana'){
   onManaDrop?.(point);
   if(building==='cafe')cafeMana.place(point);
  }else cafeActors[id].place(point);
 }
 const tableGuest=cafeChat??cafeEncounter;
 const cafeEntry=districtInteriorThresholds.cafe;
 const cafeManaTarget=tableGuest?cafeFloor.windowMana:cafeFloor.mana;
 const cafeMana=useEntranceWalk('cafe',building==='cafe'&&manaPresent,cafeEntry,officeTrip?undefined:cafeManaTarget);
 const cafeLuna=useEntranceWalk('cafe',building==='cafe'&&lunaPresent,cafeEntry,lunaLeaving?cafeEntry:tableGuest==='luna'?cafeFloor.windowGuest:cafeFloor.luna);
 const cafeLyra=useEntranceWalk('cafe',building==='cafe'&&lyraPresent,cafeEntry,lyraLeaving?cafeEntry:tableGuest==='lyra'?cafeFloor.windowGuest:cafeFloor.lyra);
 const cafeActors={luna:cafeLuna,lyra:cafeLyra};
 useEffect(()=>{
  if(building!=='cafe')return;
  if(lunaLeaving&&cafeLuna.point.x===cafeEntry.x&&cafeLuna.point.y===cafeEntry.y)onCafeExit('luna');
  if(lyraLeaving&&cafeLyra.point.x===cafeEntry.x&&cafeLyra.point.y===cafeEntry.y)onCafeExit('lyra');
 },[building,lunaLeaving,lyraLeaving,cafeLuna.point,cafeLyra.point,cafeEntry,onCafeExit]);
 useEffect(()=>{
  if(building==='cafe'&&manaPresent&&!officeTrip&&
   cafeMana.point.x===cafeManaTarget.x&&cafeMana.point.y===cafeManaTarget.y)onManaPosition(cafeMana.point);
 },[building,manaPresent,cafeManaTarget,officeTrip,cafeMana.point,onManaPosition]);
 const manaSpot=officeTrip?travelPoint(officeTrip.from,officeTrip.to,now-officeTrip.started,sceneTravelMs(building,officeTrip.from,officeTrip.to)):workforceRoom?officePosition:
  building==='cafe'?cafeMana.point:officePosition;
 const manaPosition=floorPosition(manaSpot);
 if(building==='cafe')manaPosition.zIndex=cafeActorDepth(manaSpot);
 if(building==='office')manaPosition.zIndex=officeActorDepth(manaSpot,layout);
 if(building==='meeting-room')manaPosition.zIndex=meetingRoomActorDepth(manaSpot);
 if(isWalkableOfficeRoom(building))manaPosition.zIndex=officeRoomActorDepth(building,manaSpot);
 const title=isOfficeRoom(building)?officeRooms[building].name:townBuildings[building].name;
 function centerOnMana(){
  const viewport=view.current;
  const artwork=scene.current;
  if(!shown||draftLayout||!follow||!viewport||!artwork)return;
  viewport.scrollLeft=manaSpot.x/100*artwork.offsetWidth-viewport.clientWidth/2;
  viewport.scrollTop=manaSpot.y/100*artwork.offsetHeight-viewport.clientHeight*.72;
 }
 useEffect(centerOnMana,[shown,follow,manaSpot.x,manaSpot.y]);
 function pan(event:PointerEvent<HTMLDivElement>){
  const start=drag.current;
  if(!start||start.id!==event.pointerId)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(!event.currentTarget.hasPointerCapture(event.pointerId)){
   if(Math.hypot(dx,dy)<6)return;
   event.currentTarget.setPointerCapture(event.pointerId);
   onPan();
  }
  event.currentTarget.scrollLeft=start.left-dx;
  event.currentTarget.scrollTop=start.top-dy;
 }
 const [cafeBeat,setCafeBeat]=useState(0);
 useEffect(()=>{
  setCafeBeat(0);
  if(!cafeEncounter)return;
  const timers=[1500,5200,9000].map((delay,index)=>window.setTimeout(()=>setCafeBeat(index+1),delay));
  return ()=>timers.forEach(timer=>clearTimeout(timer));
 },[cafeEncounter]);
 const manaSpeaking=!!cafeEncounter&&cafeBeat===2;
 const guestSpeaker=cafeChat??(cafeBeat===1||cafeBeat===3?cafeEncounter:undefined);
 const cafeLine=useSceneLine(shown&&building==='cafe'&&manaPresent?(guestSpeaker?
  `NPC conversation: Shared-moment partner: mana. You are speaking to Mana at the Coffee Shop window. ${cafeChat?'You are sharing a quiet break.':cafeBeat===1?'Ask if you may join her.':'You just joined her at the table. Make a short remark.'}`:
  manaSpeaking?`NPC conversation: Shared-moment partner: ${cafeEncounter}. You are by the Coffee Shop window. ${cafeEncounter==='luna'?'Luna':'Lyra'} is joining you at the table. Welcome her briefly.`:undefined):undefined,guestSpeaker??'mana');
 const speakerSpot=cafeChat?cafeFloor.windowGuest:cafeEncounter&&cafeBeat?(manaSpeaking?cafeFloor.windowMana:cafeFloor.windowGuest):undefined;
 const interior=illustratedInteriors[building];
 return <div className="companion-room-body manaverse-outside" hidden={!shown}>
  {building==='office'&&<div className="office-arrange-toolbar">
   {draftLayout?<>
    <button type="button" className="btn" onClick={()=>{onSaveOfficeLayout(draftLayout);setDraftLayout(undefined);}}>Save layout</button>
    <button type="button" className="btn" onClick={()=>setDraftLayout(undefined)}>Cancel</button>
    <button type="button" className="btn" onClick={()=>setDraftLayout(officeFurnitureDefaults)}>Reset positions</button>
    <span>Drag furniture or select it and use the arrow keys.</span>
   </>:<button type="button" className="btn" onClick={()=>{onPan();setDraftLayout(layout);}}>Arrange furniture</button>}
  </div>}
  <div ref={view} className={`interior-viewport${large?' interior-viewport-large':''}`} tabIndex={0}
   role="group" aria-label={title}
   onPointerDown={event=>{
    if(event.button!==0||(event.target as Element).closest('button,[role="dialog"]'))return;
    const {scrollLeft,scrollTop,scrollWidth,clientWidth,scrollHeight,clientHeight}=event.currentTarget;
    if(scrollWidth<=clientWidth&&scrollHeight<=clientHeight)return;
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:scrollLeft,top:scrollTop};
   }} onPointerMove={pan} onPointerCancel={()=>{drag.current=undefined;}}
   onPointerUp={()=>{drag.current=undefined;}} onPointerLeave={event=>{
    if(!event.currentTarget.hasPointerCapture(event.pointerId))drag.current=undefined;
   }}>
  <div ref={scene} className={`district-interior district-interior-${building}`}>
   <img className="district-interior-shell" src={`./companion-room/cartoon/${interior}.png`} alt="" draggable={false}
    onLoad={centerOnMana}/>
   {building==='meeting-room'&&(['table','console','plant'] as const).map(piece=>
    <img key={piece} className={`meeting-room-foreground meeting-room-foreground-${piece}`}
     src={`./companion-room/cartoon/${interior}.png`} alt="" aria-hidden="true" draggable={false}/>)}

   {building==='rest-area'&&(['table','vase'] as const).map(piece=>
    <img key={piece} className={`meeting-room-foreground rest-area-foreground-${piece}`}
     src={`./companion-room/cartoon/${interior}.png`} alt="" aria-hidden="true" draggable={false}/>)}
   {building==='aishi-office'&&<img className="meeting-room-foreground aishi-office-foreground-vase"
    src={`./companion-room/cartoon/${interior}.png`} alt="" aria-hidden="true" draggable={false}/>}
   {building==='cafe'&&<>
    <div className="cafe-lights" aria-hidden="true"/>
    {(['left-chair','table','right-chair'] as const).map(piece=>
     <img key={piece} className={`cafe-foreground cafe-foreground-${piece}`}
      src={`./companion-room/cartoon/${interior}.png`} alt="" draggable={false}/>)}
   </>}
   {building==='office'&&<div className="district-interior-piece office-sofa" style={floorPosition(layout.sofa)}>
    <img src="./companion-room/cartoon/workforce-sofa.png" alt="Navy sofa" draggable={false}/>
    {furnitureHandle('sofa','Move sofa')}
   </div>}
   {building==='office'&&(['Mana','Lyra'] as const).map((owner,index)=>{
    const id=index===1?'frontRow':'backRow';
    const position=floorPosition(layout[id]);
    return <figure className="office-desk-bank" key={owner}
     style={{...position,zIndex:position.zIndex-15}}>
     <img src="./companion-room/cartoon/workforce-desk-bank.png" alt={`Five connected workstations, including ${owner}’s desk`} draggable={false}/>
     <figcaption>{owner}</figcaption>
     {furnitureHandle(id,`Move the workstation row with ${owner}’s desk`)}
    </figure>;
   })}
   {manaPresent&&<CharacterGesture character="mana" onDrop={onManaDrop&&!officeTrip&&!draftLayout&&!workshopWorking&&!tableGuest&&!cafeMana.walking?point=>dropCharacter('mana',point):undefined} className="district-interior-piece interior-actor" style={manaPosition}>
    <ManaSprite walking={!!officeTrip||building==='cafe'&&cafeMana.walking} pose={workshopWorking||officeWorking?'think':'idle'}
     facing={officeTrip?officeTrip.to.x<officeTrip.from.x?-1:1:building==='cafe'?cafeMana.facing:1}/>
   </CharacterGesture>}
   {building==='cafe'&&([...cafeResidents,...cafeLeaving]).map(contact=><CharacterGesture key={contact} character={contact}
    onDrop={contact!==tableGuest&&!cafeLeaving.includes(contact)&&!cafeActors[contact].walking?point=>dropCharacter(contact,point):undefined}
    className="district-interior-piece interior-actor" style={cafePosition(cafeActors[contact].point)}>
    <ResidentSprite resident={contact} walking={cafeActors[contact].walking} facing={contact===tableGuest&&!cafeActors[contact].walking?-1:cafeActors[contact].facing} visible={shown}/>
   </CharacterGesture>)}
   {building==='cafe'&&speakerSpot&&cafeLine&&!cafeMana.walking&&(!tableGuest||!cafeActors[tableGuest].walking)&&<p className="cafe-chat" role="status"
    style={{left:`${Math.min(speakerSpot.x,75)}%`,top:`${speakerSpot.y}%`}}>
    {cafeLine}
   </p>}
   {building==='town-hall'&&noticePlans&&<TownNoticeBoard {...noticePlans}/>}
   {workshopWorking&&<p className="workshop-status" role="status">Mana is fitting the gears together.</p>}
   {building==='office'&&<>
    <button type="button" className="office-door office-door-meeting" aria-label="Go to the meeting room"
     disabled={!!officeTrip||!!draftLayout} onClick={()=>openOfficeRoom('meeting-room')}/>
    <button type="button" className="office-door office-door-aishi" aria-label="Go to the hallway"
     disabled={!!officeTrip||!!draftLayout} onClick={()=>openOfficeRoom('office-hallway')}/>
   </>}
   {building==='office-hallway'&&(['pantry','rest-area','aishi-office'] as const).map(room=>{
    const {name,door}=officeRooms[room];
    return <button type="button" key={room} className="office-door hallway-door" aria-label={`Go to ${name}`}
     style={{left:`${door.x}%`,top:`${door.y-15}%`}} disabled={!!officeTrip} onClick={()=>openOfficeRoom(room)}/>;
   })}
   {exitPoint&&(illustratedExit?<button type="button" className="office-door interior-archway"
    aria-label={`Return to ${exitDestination}`}
    style={{left:`${exitPoint.x}%`,top:`${exitPoint.y-13}%`}} disabled={!!officeTrip} onClick={exit}/>:
    <MapTransferArrow point={exitPoint} direction={building==='office-hallway'?'down-left':'down-right'}
     label={`Return to ${exitDestination}`} disabled={!!officeTrip||!!draftLayout} onClick={exit}/>)}
  </div>
  </div>
 </div>;
}
