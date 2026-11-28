import {useEffect,useRef,useState} from 'react';
import type {ManaverseArea} from './ManaverseMap';
import {manaversePassage} from '../core/manaversePassage';
import {manaverseWalkRoute,outdoorTrip} from '../core/manaverseNavigation';
import {sceneTravelMs} from '../core/manaverseMovement';
import {districtEntry,isOfficeRoom,isTownBuilding,officeRooms,squareEntry,streetDoors,streetTripDuration,
 townBuildingStreet,workforceExitPoints,type OfficeLayout,type StreetDoor,type StreetPoint,type StreetTrip,
 type TownBuilding,type TownInterior} from '../core/manaverseStreet';

type StreetDestination=StreetDoor|'street'|'district'|'square-from-district'|TownBuilding;
type OutdoorTrip=StreetTrip&{room:'street'|'square'|'district';door?:StreetDestination;roaming?:boolean};
type InteriorTrip=StreetTrip&{room:TownInterior;destination:TownInterior|'district'|'square';remaining:StreetPoint[]};

export function useManaTravel(layout:OfficeLayout|undefined,paused:number|undefined,onLivingArrival:()=>void,onViewRoom:(area:ManaverseArea)=>void,initialArea?:ManaverseArea){
 const [manaArea,setManaArea]=useState<Exclude<ManaverseArea,'lyra-room'>>(initialArea&&initialArea!=='lyra-room'?initialArea:'bedroom');
 const [manaStreetPosition,setManaStreetPosition]=useState(initialArea==='square'?squareEntry:streetDoors.living);
 const [manaStreetTrip,setManaStreetTrip]=useState<OutdoorTrip>();
 const [officePosition,setOfficePosition]=useState<StreetPoint>(()=>initialArea&&isTownBuilding(initialArea)?manaversePassage(townBuildingStreet(initialArea),initialArea)?.entry??{x:50,y:79}:{x:50,y:79});
 const [officeTrip,setOfficeTrip]=useState<InteriorTrip>();
 const [residentExit,setResidentExit]=useState<'library'|'luna-home'>();
 const events=useRef({onLivingArrival,onViewRoom});
 events.current={onLivingArrival,onViewRoom};

 useEffect(()=>{
  if(!officeTrip)return;
  if(manaArea!==officeTrip.room){setOfficeTrip(undefined);return;}
  const {destination,room,remaining}=officeTrip;
  const delay=Math.max(0,officeTrip.started+sceneTravelMs(room,officeTrip.from,officeTrip.to)-Date.now());
  const timer=window.setTimeout(()=>{
   if(remaining.length){
    setOfficeTrip({...officeTrip,from:officeTrip.to,to:remaining[0],remaining:remaining.slice(1),started:Date.now()});
    return;
   }
   if(destination===room)setOfficePosition(officeTrip.to);
   else {
    const entry=manaversePassage(room,destination)?.entry;
    if(entry){
     if(destination==='district'||destination==='square')setManaStreetPosition(entry);
     else setOfficePosition(entry);
    }
   }
   setManaArea(destination);
   setOfficeTrip(undefined);
  },delay);
  return ()=>clearTimeout(timer);
 },[officeTrip,manaArea]);

 function walkThroughOfficeDoor(room:TownInterior,destination:TownInterior|'district'|'square',to:StreetPoint){
  if(officeTrip||manaStreetTrip||manaArea!==room)return;
  const passage=destination!==room?manaversePassage(room,destination):undefined;
  if(destination!==room&&(!passage||Math.hypot(to.x-passage.exit.x,to.y-passage.exit.y)>.01))return;
  const route=manaverseWalkRoute(room,officePosition,to,undefined,layout);
  if(route.length<2&&Math.hypot(officePosition.x-to.x,officePosition.y-to.y)>.01)return;
  const [from=officePosition,next=to,...remaining]=route;
  setOfficeTrip({room,destination,from,to:next,remaining,started:Date.now()});
  return true;
 }
 function startStreetWalk(to:StreetPoint,door?:StreetDestination,roaming=false){
  if(manaStreetTrip||paused||manaArea!=='street'&&manaArea!=='square'&&manaArea!=='district')return;
  const destination=door==='square-from-district'?'square':door;
  const passage=destination?manaversePassage(manaArea,destination):undefined;
  if(destination&&(!passage||Math.hypot(to.x-passage.exit.x,to.y-passage.exit.y)>.01))return;
  const trip=outdoorTrip(manaArea,manaStreetPosition,to);
  if(trip)setManaStreetTrip({...trip,room:manaArea,door,roaming});
 }
 useEffect(()=>{
  if(!manaStreetTrip)return;
  if(manaArea!==manaStreetTrip.room){setManaStreetTrip(undefined);return;}
  if(paused)return;
  const {to,door}=manaStreetTrip;
  const timer=window.setTimeout(()=>{
   const destination=door==='square-from-district'?'square':door;
   const passage=destination?manaversePassage(manaArea,destination):undefined;
   const arrival=destination==='street'||destination==='square'||destination==='district'?passage?.entry??to:to;
   setManaStreetPosition(arrival);
   setManaStreetTrip(undefined);
   if(!door)return;
   if(door==='living')events.current.onLivingArrival();
   if(destination&&isTownBuilding(destination)&&passage)setOfficePosition(passage.entry);
   if(destination)setManaArea(destination);
  },Math.max(0,manaStreetTrip.started+streetTripDuration(manaStreetTrip)-Date.now()));
  return ()=>clearTimeout(timer);
 },[manaStreetTrip,paused,manaArea]);

 function enterStreet(from:StreetDoor){
  setManaStreetPosition(manaversePassage(from,'street')?.entry??streetDoors[from]);
  setManaArea('street');
 }
 function leaveResidentHome(home:'library'|'luna-home'){
  setResidentExit(home);
 }
 function finishResidentExit(home:'library'|'luna-home'){
  if(manaArea!==home||residentExit!==home)return;
  setResidentExit(undefined);
  enterStreet(home);
 }
 function leaveSquare(){
  if(manaArea==='square')startStreetWalk(squareEntry,'street');
  else events.current.onViewRoom('street');
 }
 function leaveDistrict(){
  if(manaArea==='district')startStreetWalk(districtEntry,'square-from-district');
  else events.current.onViewRoom('square');
 }
 function leaveTownBuilding(building:TownInterior){
  if(isOfficeRoom(building)){
   const parent=officeRooms[building].parent;
   if(manaArea===building)walkThroughOfficeDoor(building,parent,workforceExitPoints[building]);
   else events.current.onViewRoom(parent);
   return;
  }
  const outside=townBuildingStreet(building);
  const passage=manaversePassage(building,outside);
  if(manaArea===building&&passage)walkThroughOfficeDoor(building,outside,passage.exit);
  else events.current.onViewRoom(outside);
 }
 return {manaArea,setManaArea,manaStreetPosition,setManaStreetPosition,manaStreetTrip,setManaStreetTrip,
  officePosition,setOfficePosition,officeTrip,walkThroughOfficeDoor,startStreetWalk,enterStreet,
  residentExit,leaveResidentHome,finishResidentExit,leaveSquare,leaveDistrict,leaveTownBuilding};
}
