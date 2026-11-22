import type {ManaverseArea} from '../components/ManaverseMap';
import {parkStreetThreshold} from './manaversePark';
import {libraryStairFoot,libraryStreetThreshold,lunaHomeThreshold,lyraRoomLanding} from './officeWalk';
import {districtInteriorThresholds,districtEntry,homeThresholds,officeRooms,squareDistrictExit,squareEntry,streetDoors,townBuildings,townHallThreshold,workforceExitPoints,type OfficeRoom,type StreetPoint} from './manaverseStreet';

type Doorway = readonly [ManaverseArea, StreetPoint, ManaverseArea, StreetPoint];

// One point on each side of a doorway, shared by player and autonomous actors.
export const manaverseDoorways:readonly Doorway[]=[
 ['bedroom',homeThresholds.bedroomToLiving,'living',homeThresholds.livingToBedroom],
 ['living',homeThresholds.livingToStreet,'street',streetDoors.living],
 ['street',streetDoors.library,'library',libraryStreetThreshold],
 ['library',libraryStairFoot,'lyra-room',lyraRoomLanding],
 ['street',streetDoors['luna-home'],'luna-home',lunaHomeThreshold],
 ['street',streetDoors.park,'park',parkStreetThreshold],
 ['street',streetDoors.square,'square',squareEntry],
 ['square',squareDistrictExit,'district',districtEntry],
 ['square',townBuildings['town-hall'].door,'town-hall',townHallThreshold],
 ['district',townBuildings.office.door,'office',workforceExitPoints.office],
 ['district',townBuildings.cafe.door,'cafe',districtInteriorThresholds.cafe],
 ['district',townBuildings.workshop.door,'workshop',districtInteriorThresholds.workshop],
 ...(Object.keys(officeRooms) as OfficeRoom[]).map((room):Doorway=>[
  officeRooms[room].parent,officeRooms[room].door,room,workforceExitPoints[room],
 ]),
];

export function manaversePassage(from:ManaverseArea,to:ManaverseArea){
 for(const [a,at,b,bt] of manaverseDoorways){
  if(from===a&&to===b)return {exit:at,entry:bt};
  if(from===b&&to===a)return {exit:bt,entry:at};
 }
}
