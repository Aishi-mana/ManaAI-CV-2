import type {ManaverseArea} from '../components/ManaverseMap';
import {livingFurnishings,ROOM_OBJECTS,roomDropPosition,roomPoint,roomRoute,type RoomObject} from './companionRoom';
import {parkFloorRoute} from './manaversePark';
import {cafeRoute,floorRoute,isOfficeHallwayFloor,isWalkableOfficeRoom,meetingRoomRoute,officeRoomRoute,officeRoute,residentFloorRoute,townHallRoute,workshopRoute} from './officeWalk';
import {isDistrictFloor,isSquareFloor,isStreetFloor,type OfficeLayout,type StreetPoint,type StreetTrip} from './manaverseStreet';
import {manaversePassage} from './manaversePassage';

export type OutdoorArea='street'|'square'|'district'|'park';

export function manaverseWalkRoute(area:ManaverseArea,from:StreetPoint,to:StreetPoint,furniture?:readonly RoomObject[],layout?:OfficeLayout):StreetPoint[]{
 furniture??=area==='bedroom'?ROOM_OBJECTS:area==='living'?livingFurnishings:undefined;
 if(furniture){
  const start=roomDropPosition(from,furniture),end=roomDropPosition(to,furniture);
  if(!start||!end)return [];
  const route=roomRoute(start,end,furniture);
  return route.length?[from,...route.map(position=>{
   const {x,y}=roomPoint(position);
   return {x:x/7.99,y:y/6.98};
  })]:[];
 }
 if(area==='library'||area==='lyra-room'||area==='luna-home')return residentFloorRoute(area,from,to);
 if(area==='office')return officeRoute(from,to,layout);
 if(area==='cafe')return cafeRoute(from,to);
 if(area==='workshop')return workshopRoute(from,to);
 if(area==='town-hall')return townHallRoute(from,to);
 if(area==='meeting-room')return meetingRoomRoute(from,to);
 if(isWalkableOfficeRoom(area))return officeRoomRoute(area,from,to);
 if(area==='park')return parkFloorRoute(from,to);
 if(area==='office-hallway')return floorRoute(from,to,isOfficeHallwayFloor);
 if(area==='street'||area==='square'||area==='district')return floorRoute(from,to,
  area==='street'?isStreetFloor:area==='square'?isSquareFloor:isDistrictFloor);
 return [];
}

export function planManaverseTransfer(from:ManaverseArea,to:ManaverseArea,feet:StreetPoint,furniture?:readonly RoomObject[],layout?:OfficeLayout){
 const door=manaversePassage(from,to);
 if(!door)return;
 const route=manaverseWalkRoute(from,feet,door.exit,furniture,layout);
 if(!route.length)return;
 return {...door,route};
}

export function outdoorTrip(area:Exclude<OutdoorArea,'park'>,from:StreetPoint,to:StreetPoint,started=Date.now()):StreetTrip|undefined{
 const route=manaverseWalkRoute(area,from,to);
 if(!route.length)return;
 return {from,to,started,via:route.slice(1,-1)};
}
