import {sceneTravelMs,travelPoint} from './manaverseMovement';

export type StreetPoint={x:number;y:number};

export const officeFurnitureDefaults={
 sofa:{x:83.5,y:58},backRow:{x:11,y:70},frontRow:{x:27,y:81},
};
export type OfficeFurniture=keyof typeof officeFurnitureDefaults;
export type OfficeLayout=Record<OfficeFurniture,StreetPoint>;

export function officeFurniturePoint(id:OfficeFurniture,point:StreetPoint):StreetPoint{
 const x=Math.max(id==='sofa'?7:2,Math.min(id==='sofa'?93:62,point.x));
 const depth=Math.abs(x-50);
 return {x,y:Math.max(29+depth*.68,Math.min(99-depth*.72,point.y))};
}

export function validateOfficeLayout(value:unknown):OfficeLayout|undefined{
 if(!value||typeof value!=='object')return;
 const layout={...officeFurnitureDefaults};
 for(const id of Object.keys(layout) as OfficeFurniture[]){
  const point=(value as Partial<OfficeLayout>)[id];
  if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))layout[id]=officeFurniturePoint(id,point);
 }
 return layout;
}


// The street extends to the bottom of the artwork between the two foreground flower beds.
const streetMinX=2;
const streetMaxX=98;
const curb=(x:number)=>80-x*.26;
const foregroundEdge=(x:number)=>Math.min(99,79+x*1.55,99-(x-77)*1.12);
export const streetPoint=(x:number,y?:number):StreetPoint=>{
 const boundedX=Math.max(streetMinX,Math.min(streetMaxX,x));
 return {x:boundedX,y:Math.max(curb(boundedX),Math.min(foregroundEdge(boundedX),y??curb(boundedX)+9))};
};
export const isStreetFloor=({x,y}:StreetPoint)=>
 x>=streetMinX&&x<=streetMaxX&&y>=curb(x)&&y<=foregroundEdge(x);
export const streetDoors={
 living:streetPoint(24.4,74),
 library:streetPoint(52.1,67),
 'luna-home':streetPoint(85.9,58),
 park:streetPoint(12,85),
 square:streetPoint(92,70),
};
export const squareEntry={x:9,y:78};
// Trace the curb, the stair opening, and the front edge of the fountain planters.
const squareBackEdge=[
 [2,46],[10,45],[21.5,42.5],[23.5,40],[23.5,31],[27.5,31],[32,39.5],
 [37.5,38.6],[39,43],[42,44.5],[58.6,44.5],[62,43],[63,38.7],
 [72,39.5],[74.3,39],[76,37.2],[82.5,37.2],[83.5,39.8],[90,43],[98,45],
] as const;
function squareCurb(x:number){
 const index=squareBackEdge.findIndex(([edgeX])=>edgeX>x);
 if(index<1)return index===0?squareBackEdge[0][1]:squareBackEdge[squareBackEdge.length-1][1];
 const [leftX,leftY]=squareBackEdge[index-1], [rightX,rightY]=squareBackEdge[index];
 return leftY+(rightY-leftY)*(x-leftX)/(rightX-leftX);
}
export const isSquareFloor=({x,y}:StreetPoint)=>x>=2&&x<=98&&y>=squareCurb(x)&&y<=99;
export function squarePoint(x:number,y:number):StreetPoint{
 const boundedX=Math.max(2,Math.min(98,x));
 return {x:boundedX,y:Math.max(squareCurb(boundedX),Math.min(99,y))};
}
export const squareSpots=[{x:37,y:71},{x:65,y:77},{x:85,y:66}];
export const squareDistrictExit={x:92,y:76};
export const districtEntry={x:8,y:76};
const districtCurb=(x:number)=>74.8-x*.1;
export const isDistrictFloor=({x,y}:StreetPoint)=>x>=streetMinX&&x<=streetMaxX&&y>=districtCurb(x)&&y<=foregroundEdge(x);
export function districtPoint(x:number,y:number):StreetPoint{
 const boundedX=Math.max(streetMinX,Math.min(streetMaxX,x));
 return {x:boundedX,y:Math.max(districtCurb(boundedX),Math.min(foregroundEdge(boundedX),y))};
}
export const districtBuildings={
 office:{name:'AI Workforce Office',door:{x:23,y:72.8},artBottom:68},
 cafe:{name:'Coffee Shop',door:{x:53,y:70},artBottom:65.8},
 workshop:{name:'Workshop',door:{x:84.4,y:67.8},artBottom:64.5},
} as const;
export type DistrictBuilding=keyof typeof districtBuildings;
export const townHall={name:'Town Hall',door:{x:79.5,y:39.5},artBottom:36.7};
export const townBuildings={...districtBuildings,'town-hall':townHall};
export type TownBuilding=keyof typeof townBuildings;
export const officeRooms={
 'meeting-room':{name:'Meeting Room',parent:'office',door:{x:42.5,y:34}},
 'office-hallway':{name:'Hallway',parent:'office',door:{x:57.5,y:34}},
 'pantry':{name:'Pantry',parent:'office-hallway',door:{x:32,y:76}},
 'rest-area':{name:'Rest Area',parent:'office-hallway',door:{x:61,y:54}},
 'aishi-office':{name:'Aishi’s Office',parent:'office-hallway',door:{x:87,y:42}},
} as const;
export type OfficeRoom=keyof typeof officeRooms;
export const isOfficeRoom=(area:string):area is OfficeRoom=>
 Object.prototype.hasOwnProperty.call(officeRooms,area);
export type TownInterior=TownBuilding|OfficeRoom;
export type WorkforceInterior='office'|OfficeRoom;
export const townHallThreshold:StreetPoint={x:72,y:81.5};
export const homeThresholds={
 livingToBedroom:{x:18,y:58},
 livingToStreet:{x:594/799*100,y:529/698*100},
 bedroomToLiving:{x:77.6,y:72.35},
};
export const districtInteriorThresholds={
 cafe:{x:72,y:81},
 workshop:{x:72,y:81.5},
} satisfies Partial<Record<DistrictBuilding,StreetPoint>>;
export const workforceExitPoints:Record<WorkforceInterior,StreetPoint>={
 office:{x:70,y:82},
 'meeting-room':{x:70,y:81},
 'office-hallway':{x:20,y:94},
 pantry:{x:84,y:69},
 'rest-area':{x:87,y:66},
 'aishi-office':{x:69,y:79},
};
export const isTownBuilding=(area:string):area is TownBuilding=>
 Object.prototype.hasOwnProperty.call(townBuildings,area);
export const townBuildingStreet=(building:TownBuilding)=>building==='town-hall'?'square':'district';
export type StreetDoor=keyof typeof streetDoors;
export const streetTravelMs=(from:StreetPoint,to:StreetPoint)=>sceneTravelMs('street',from,to);
export type StreetTrip={from:StreetPoint;to:StreetPoint;started:number;via?:StreetPoint[]};
export type StreetCharacter='mana'|'luna'|'lyra';
export type StreetWalker={id:StreetCharacter;position:StreetPoint;trip?:StreetTrip};
export const STREET_ENCOUNTER_MS=4200;

export function streetPositionAt(trip:StreetTrip,now:number):StreetPoint{
 const leg=streetLegAt(trip,now);
 return travelPoint(leg.from,leg.to,now-leg.started,streetTravelMs(leg.from,leg.to));
}

export function streetTripDuration(trip:StreetTrip){
 let from=trip.from;
 let duration=0;
 for(const to of [...(trip.via??[]),trip.to]){duration+=streetTravelMs(from,to);from=to;}
 return duration;
}

export function streetLegAt(trip:StreetTrip,now:number){
 let {from,started}=trip;
 for(const to of trip.via??[]){
  const duration=streetTravelMs(from,to);
  if(now<started+duration)return {from,to,started};
  from=to;started+=duration;
 }
 return {from,to:trip.to,started};
}

export function streetEncounterPairs(walkers:StreetWalker[],now:number){
 return walkers.flatMap((first,index)=>walkers.slice(index+1).flatMap(second=>{
  if(!first.trip&&!second.trip)return [];
  const a=first.trip?streetPositionAt(first.trip,now):first.position;
  const b=second.trip?streetPositionAt(second.trip,now):second.position;
  return Math.hypot(a.x-b.x,(a.y-b.y)*.6)<=9?[{first:first.id,second:second.id,a,b}]:[];
 }));
}

export const streetLines={
 mana:[
  'I needed a little break from my desk. It’s nice out here.',
  'I’m glad I took the long way home.',
 ],
 luna:[
  'I sketched a crooked little constellation last night. Want to see it sometime?',
  'I’ll put this walk in my notebook. It feels like the start of a little story.',
 ],
 lyra:[
  'I found something curious at the library. Come by and I’ll show you.',
  'Let’s save the rest of that story for the library. I’ll put the kettle on.',
 ],
};

export function streetRoamPoint(from:StreetPoint,random=Math.random){
 const x=from.x<50?52+random()*38:10+random()*38;
 return streetPoint(x,curb(x)+5+random()*18);
}
