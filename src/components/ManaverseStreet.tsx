import CharacterGesture from './CharacterGesture';
import WinterScenery from './WinterScenery';
import AutumnScenery from './AutumnScenery';
import SpringScenery from './SpringScenery';
import FlowerScenery from './FlowerScenery';
import {TownWeatherEffects} from './TownWeather';
import TownFestivities from './TownFestivities';
import type {TownEventCalendar} from '../core/townEvents';
import {activeDecorationObjects,townFestivities,type TownDecorationSettings} from '../core/townFestivities';
import {useEffect,useRef,useState} from 'react';
import SceneViewport from './SceneViewport';
import MapTransferArrow from './MapTransferArrow';
import ResidentSprite from './ResidentSprite';
import ManaSprite from './ManaSprite';
import type {RoomContact} from '../core/roomPhone';
import OutdoorPetBot from './OutdoorPetBot';
import type {OutdoorPetPosition} from './useOutdoorPetWalk';
import {useSceneLine} from './SceneVoice';
import {districtBuildings,districtEntry,squareDistrictExit,squareEntry,streetDoors,streetPositionAt,streetLegAt,streetTripDuration,townHall,type TownBuilding,type StreetCharacter,type StreetDoor,type StreetPoint,type StreetTrip} from '../core/manaverseStreet';
const doorArt={
 living:{x:24.4,y:71.8,width:6.8,height:22.5},
 library:{x:51.4,y:63.7,width:7.5,height:21},
 'luna-home':{x:85.8,y:53.4,width:6.2,height:21},
} satisfies Record<Exclude<StreetDoor,'park'|'square'>,{x:number;y:number;width:number;height:number}>;

function useStreetWalk(trip:StreetTrip|undefined,position:StreetPoint){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{
  if(!trip)return;
  let frame=0;
  const tick=()=>{
   const time=Date.now();
   setNow(time);
   if(time-trip.started<streetTripDuration(trip))frame=requestAnimationFrame(tick);
  };
  tick();
  return ()=>cancelAnimationFrame(frame);
 },[trip]);
 const point=trip?streetPositionAt(trip,now):position;
 const leg=trip?streetLegAt(trip,now):undefined;
 const previousFacing=useRef(1);
 const facing=leg&&leg.to.x!==leg.from.x?leg.to.x<leg.from.x?-1:1:previousFacing.current;
 useEffect(()=>{previousFacing.current=facing;},[facing]);
 return {point,facing};
}

function StreetActor({trip,position,guest,face,onDrop}:{onDrop?:(point:StreetPoint)=>void;trip?:StreetTrip;position:StreetPoint;guest?:RoomContact;face?:number}){
 const {point,facing}=useStreetWalk(trip,position);
 return <CharacterGesture character={guest??'mana'} onDrop={trip?undefined:onDrop} className="manaverse-street-actor" style={{left:`${point.x}%`,top:`${point.y}%`,zIndex:Math.round(point.y)}}>
  {guest?<ResidentSprite resident={guest} walking={!!trip} facing={face??facing} visible/>:
   <ManaSprite walking={!!trip} facing={face??facing}/>}
 </CharacterGesture>;
}

const labels={living:'Mana’s home',library:'Lyra’s library','luna-home':'Luna’s home'};
type Encounter={first:StreetCharacter;second:StreetCharacter;a:StreetPoint;b:StreetPoint;started:number;variant:number};

function StreetConversation({encounter}:{encounter:Encounter}){
 const [reply,setReply]=useState(()=>Date.now()-encounter.started>=2100);
 useEffect(()=>{
  const timer=window.setTimeout(()=>setReply(true),Math.max(0,encounter.started+2100-Date.now()));
  return ()=>clearTimeout(timer);
 },[encounter.started]);
 const speaker=reply?encounter.second:encounter.first;
 const point=reply?encounter.b:encounter.a;
 const partner=reply?encounter.first:encounter.second;
 const name=partner==='mana'?'Mana':partner==='lyra'?'Lyra':'Luna';
 const line=useSceneLine(`NPC conversation: Shared-moment partner: ${partner}. You just crossed paths with ${name} on the street. ${reply?'Return the greeting':'Give a brief greeting'} to ${name}.`,speaker);
 if(!line)return null;
 return <p className="manaverse-street-speech" role="status" style={{left:`${Math.min(77,Math.max(23,point.x))}%`,top:`${point.y-17}%`}}>
  <strong>{speaker==='mana'?'Mana':speaker==='luna'?'Luna':'Lyra'}</strong> {line}
 </p>;
}


const streetOverview={x:50,y:70};

function SquareFountainWater(){
 return <svg className="square-fountain-water" viewBox="0 0 1642 958" preserveAspectRatio="none" aria-hidden="true">
  <g className="square-fountain-streams">
   <path d="M821 242 Q812 203 823 197 Q832 212 827 242 M798 249 Q785 239 781 258 Q775 272 775 294 M843 249 Q864 238 870 258 Q878 280 878 295"/>
   <path d="M802 254 Q790 250 790 294 M849 251 Q860 265 861 292 M771 297 Q748 284 744 315 L740 361 M883 298 Q903 284 906 319 L913 362"/>
   <path d="M772 298 Q759 309 757 362 M785 304 Q773 319 771 361 M874 301 Q883 311 887 362 M888 300 Q896 317 901 360"/>
  </g>
  <g className="square-fountain-ripples">
   <ellipse cx="761" cy="362" rx="24" ry="3"/>
   <ellipse cx="890" cy="362" rx="26" ry="3"/>
  </g>
 </svg>;
}

export default function ManaverseStreet({petBot,manaPosition,manaTrip,visitor,residents,encounter,door,onDrop,follow,eventTitle,activeEvents=[],decorations,calendarDate,square=false,onStreet,onDistrict,district=false,onBuilding}:{
 decorations?:TownDecorationSettings;calendarDate?:string;
 activeEvents?:TownEventCalendar['active'];
 petBot?:OutdoorPetPosition;
 manaPosition?:StreetPoint;manaTrip?:StreetTrip;visitor?:{contact:RoomContact;trip:StreetTrip};
 residents:{contact:RoomContact;position:StreetPoint;trip?:StreetTrip}[];
 encounter?:Encounter;onDrop:(id:StreetCharacter,point:StreetPoint)=>void;
 door:(destination:StreetDoor)=>void;follow:boolean;eventTitle?:string;
 square?:boolean;onStreet?:()=>void;
 onDistrict?:()=>void;district?:boolean;onBuilding?:(building:TownBuilding)=>void;
}){
 const plaza=square||district;
 const [showDecorations,setShowDecorations]=useState(false);
 const decorationTheme=square?townFestivities(activeEvents,decorations,calendarDate):undefined;
 const visibleDecorations=square?activeDecorationObjects(activeEvents,decorations,calendarDate):[];
 const decorationFocus=visibleDecorations.find(object=>object.kind==='christmas-tree')??visibleDecorations[0]??{x:66,y:25};
 const restingResident=residents.find(resident=>!resident.trip);
 const festivalReaction=encounter?undefined:manaPosition&&!manaTrip?{speaker:'mana' as const,point:manaPosition}:
  restingResident?{speaker:restingResident.contact,point:restingResident.position}:undefined;
 const {point}=useStreetWalk(follow?manaTrip:undefined,manaPosition??streetOverview);
 const actor=(id:StreetCharacter,position:StreetPoint,trip?:StreetTrip)=>{
  const guest=id==='mana'?undefined:id;
  const first=encounter?.first===id;
  if(encounter&&(first||encounter.second===id)){
   const point=first?encounter.a:encounter.b;
   const partner=first?encounter.b:encounter.a;
   return <StreetActor key={id} guest={guest} position={point} face={partner.x<point.x?-1:1}/>;
  }
  return <StreetActor key={id} guest={guest} position={position} trip={trip} onDrop={point=>onDrop(id,point)}/>;
 };
 return <div className="companion-room-body manaverse-outside">
  {eventTitle&&<p role="status">{eventTitle} · Happening now</p>}
  {decorationTheme?.active&&<button className="btn" type="button" onClick={()=>setShowDecorations(value=>!value)}>
   {showDecorations?'Return to map view':'View decorations'}</button>}
  <SceneViewport className="street-viewport" focus={showDecorations&&decorationTheme?.active?decorationFocus:follow&&manaPosition?point:undefined}>
  <div className={plaza?'manaverse-street manaverse-square':'manaverse-street'} role="group" aria-label={district?'Second Street':square?'Town Square':'Manaverse Street'}>
   <img className="manaverse-street-art" src={`./companion-room/manaverse-${district?'second-street':square?'square':'street'}.webp`} alt="" draggable={false}/>
   <WinterScenery area={district?'district':square?'square':'street'}/>
   <AutumnScenery area={district?'district':square?'square':'street'}/>
   <SpringScenery area={district?'district':square?'square':'street'}/>
   <FlowerScenery season="summer" area={district?'district':square?'square':'street'}/>
   {!district&&<div className="manaverse-street-lights" aria-hidden="true"/>}
   {square&&<TownFestivities events={activeEvents} reaction={festivalReaction} settings={decorations} date={calendarDate}/>}
   {square&&<SquareFountainWater/>}
   <TownWeatherEffects/>
   {!plaza&&(Object.keys(doorArt) as (keyof typeof doorArt)[]).map(destination=>{
    const entry=doorArt[destination];
    return <button key={destination} className="manaverse-street-door" type="button" aria-label={labels[destination]}
     style={{left:`${entry.x}%`,top:`${entry.y}%`,width:`${entry.width}%`,height:`${entry.height}%`}}
     onClick={()=>door(destination)}/>;
   })}
   {square&&<button className="manaverse-street-door" type="button" aria-label={townHall.name}
    style={{left:`${townHall.door.x}%`,top:`${townHall.artBottom}%`,width:'6%',height:'16%'}}
    onClick={()=>onBuilding?.('town-hall')}/>}
   {district&&Object.entries(districtBuildings).map(([id,building])=><button key={id} className="manaverse-street-door" type="button" aria-label={building.name}
    style={{left:`${building.door.x}%`,top:`${building.artBottom}%`,width:'7%',height:'24%'}}
    onClick={()=>onBuilding?.(id as TownBuilding)}/>)}
   {plaza?<><MapTransferArrow point={district?districtEntry:squareEntry} direction="left"
    label={district?'Return to Town Square':'Return to Manaverse Street'} onClick={onStreet}/>
    {square&&<MapTransferArrow point={squareDistrictExit} direction="right" label="Go to Second Street" onClick={onDistrict}/>}</>:<>
    <MapTransferArrow point={streetDoors.park} direction="left" label="Go to Park" onClick={()=>door('park')}/>
    <MapTransferArrow point={streetDoors.square} direction="right" label="Go to Town Square" onClick={()=>door('square')}/>
   </>}
   {manaPosition!==undefined&&actor('mana',manaPosition,manaTrip)}
   {petBot&&<OutdoorPetBot point={petBot.point} facing={petBot.facing}/>}
   {residents.map(({contact,position,trip})=>actor(contact,position,trip))}
   {visitor&&<StreetActor position={visitor.trip.from} trip={visitor.trip} guest={visitor.contact}/>}
   {encounter&&<StreetConversation key={encounter.started} encounter={encounter}/>}
  </div>
  </SceneViewport>
 </div>;
}

