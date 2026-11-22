import {officeFurnitureDefaults,officeRooms,type OfficeLayout,type StreetPoint} from './manaverseStreet';

const gridStep=1;

export function isOfficeHallwayFloor({x,y}:StreetPoint){
 if(x<12||x>92)return false;
 const center=108-x*.76;
 if(Math.abs(y-center)<=6)return true;
 return [officeRooms.pantry.door,officeRooms['rest-area'].door].some(door=>
  Math.abs(x-door.x)<=2.5&&y>=door.y&&y<=center);
}

export function officeActorDepth({x,y}:StreetPoint,layout=officeFurnitureDefaults){
 let depth=Math.round(y);
 for(const row of [layout.backRow,layout.frontRow]){
  const offset=x-row.x;
  if(offset<-3||offset>41)continue;
  const rowDepth=Math.round(row.y)-15;
  if(y>row.y-offset*.70+1.8)depth=Math.max(depth,rowDepth+1);
  else depth=Math.min(depth,rowDepth-1);
 }
 return depth;
}

export function isOfficeFloor({x,y}:StreetPoint,layout=officeFurnitureDefaults){
 const distanceFromCenter=Math.abs(x-50);
 if(x<3||x>97||y<28+distanceFromCenter*.71||y>98-distanceFromCenter*.75)return false;
 for(const row of [layout.backRow,layout.frontRow]){
  const dx=x-row.x;
  const depth=y-row.y+dx*.70;
  if(dx>=-2&&dx<=38.4&&depth>=-9&&depth<=1.8)return false;
 }
 const sofaX=x-layout.sofa.x;
 const sofaDepth=y-layout.sofa.y-(sofaX-2)*.70;
 if(sofaX>=-6.5&&sofaX<=6.5&&sofaDepth>=-6.5&&sofaDepth<=1.2)return false;
 return ![[6,57],[35,38],[94,57]].some(([px,py])=>Math.hypot(x-px,(y-py)*.67)<2.1);
}

export function officeRoute(from:StreetPoint,to:StreetPoint,layout:OfficeLayout=officeFurnitureDefaults):StreetPoint[]{
 return floorRoute(from,to,point=>isOfficeFloor(point,layout));
}

export function officeWorkApproach(from:StreetPoint,layout:OfficeLayout=officeFurnitureDefaults):StreetPoint|undefined{
 // Keep the approach in front of Mana's workstation row as its position changes.
 for(const offset of [18,27,9]){
  const point={x:layout.backRow.x+offset,y:layout.backRow.y-offset*.70+3.5};
  if(isOfficeFloor(point,layout)&&officeRoute(from,point,layout).length)return point;
 }
}

// Footprints follow the floor contact points of the baked-in furniture.
const tableFootprint=[
 {x:15,y:66},{x:51,y:38},{x:58,y:43},{x:60,y:59},{x:36,y:79},{x:18,y:79},
];
const consoleFootprint=[{x:62,y:39},{x:79,y:50},{x:80,y:55},{x:62,y:46}];

function insideConvex(point:StreetPoint,polygon:StreetPoint[]){
 const edges=polygon.map((a,index)=>{
  const b=polygon[(index+1)%polygon.length];
  return (b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x);
 });
 return edges.every(edge=>edge>=0)||edges.every(edge=>edge<=0);
}

export function isMeetingRoomFloor(point:StreetPoint){
 const {x,y}=point;
 const side=Math.abs(x-50);
 return x>=3&&x<=97&&y>=32+side*.68&&y<=98-side*.71&&
  !insideConvex(point,tableFootprint)&&!insideConvex(point,consoleFootprint)&&
  Math.hypot(x-54,(y-34)*.67)>2.7;
}

export function meetingRoomRoute(from:StreetPoint,to:StreetPoint):StreetPoint[]{
 return floorRoute(from,to,isMeetingRoomFloor);
}

export function meetingRoomActorDepth({x,y}:StreetPoint){
 // The sloped front edges separate the foreground aisles from the rear aisles.
 if(x>=48&&x<=59&&y<=36)return 39;
 if(x>=12&&x<=61)return y>Math.min(80,108-x*.8)?68:66;
 if(x>=60&&x<=83)return y>45+(x-63)*.65?58:56;
 return Math.round(y);
}

const roomFloors={
 pantry:[[10,79],[20,71],[26,74],[47,62],[67,71],[73,69],[77,73],[89,60],[91,77],[74,89],[71,88],[58,96],[46,96],[45,97]],
 'rest-area':[[7,71],[44,43],[88,55],[91,53],[92,74],[72,89],[68,88],[56,96],[51,96]],
 'aishi-office':[[8,64],[50,34],[92,64],[50,94]],
} as const;
// The tabletop overhangs the rug. Use the legs' floor positions for walking and depth.
const restAreaTableFootprint=[[33.8,71.6],[44.3,63.4],[52.6,68],[42,76.4]] as const;
const roomObstacles={
 pantry:[],
 'rest-area':[
  [[12,63],[36,43],[42,53],[38,60],[21,73],[14,69]],
  [[44,44],[51,40],[66,50],[63,64],[45,56]],
  restAreaTableFootprint,
  [[68,59],[74,57],[75,64],[71,67]],
 ],
 'aishi-office':[
  [[21,49],[29,46],[32,51],[29,56],[23,56]],
  [[32,45],[47,34],[55,39],[54,51],[46,54],[34,52]],
  [[55,43],[64,40],[69,46],[67,52],[56,48]],
 ],
} as const;

export type WalkableOfficeRoom=keyof typeof roomFloors;
export function isWalkableOfficeRoom(area:string):area is WalkableOfficeRoom{
 return Object.prototype.hasOwnProperty.call(roomFloors,area);
}

function insideOutline({x,y}:StreetPoint,outline:readonly (readonly [number,number])[]){
 let inside=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const [ax,ay]=outline[i], [bx,by]=outline[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}

export function isOfficeRoomFloor(room:WalkableOfficeRoom,point:StreetPoint){
 return insideOutline(point,roomFloors[room])&&!roomObstacles[room].some(outline=>insideOutline(point,outline));
}

// Measured on cafe-interior-wide.png in scene percentages.
const cafeFloorOutline=[[2,61],[50,33.6],[98,61],[50,98.5]] as const;
const cafeFurnitureFootprints=[
 [[14,51],[15,47],[19,45],[43,33],[49,34],[49,40.7],[27,53],[20,54]],
 [[4.2,60.8],[5,55.6],[14.7,53],[17.5,54.8],[17.5,60.5],[12,63.5],[5,63.5]],
 [[64.4,44.7],[65.5,40],[70.9,42],[76.8,43.5],[78.2,49.8],[74.6,50.4],[67,47.1]],
 [[81.6,60.8],[81.6,55.4],[86.5,53.2],[94.5,55.7],[95.4,62],[92.6,63.4],[87,63.4]],
] as const;

export function isCafeFloor(point:StreetPoint){
 return insideOutline(point,cafeFloorOutline)&&
  !cafeFurnitureFootprints.some(outline=>insideOutline(point,outline));
}

export function cafeRoute(from:StreetPoint,to:StreetPoint){
 return floorRoute(from,to,isCafeFloor);
}

// Trace the exposed floor around the workbench, stool, crates, and shelving.
const workshopFloorOutline=[
 [7,71.6],[24.2,59.5],[29.9,62.5],[36.7,59.4],[36.7,57.3],
 [39.3,56.3],[39.3,58.6],[41.8,60],[45.1,58.8],[44.8,55.8],[49.5,54.1],
 [51.4,51.6],[53.1,52.2],[53.5,53.8],[55.5,54.1],[60.7,57],
 [63.8,55.5],[68.5,57.5],[68.5,59.2],[70.2,60.1],[90.4,68.3],[91.8,67.5],[92.2,69.2],
 [92.2,72.1],[50,96],[7,72.7],
] as const;

export function isWorkshopFloor(point:StreetPoint){
 return insideOutline(point,workshopFloorOutline);
}

export function workshopRoute(from:StreetPoint,to:StreetPoint){
 return floorRoute(from,to,isWorkshopFloor);
}

const townHallFloorOutline=[
 [4,66.7],[7.6,63.1],[8,61.2],[13.7,60.7],[14.1,57.9],
 [19.9,59.4],[24,59.1],[41.5,50.7],[41.5,45.7],[49.4,43.4],
 [95.6,66.6],[95.6,67.7],[50.4,97.5],[4,68.1],
] as const;

export function isTownHallFloor(point:StreetPoint){
 return insideOutline(point,townHallFloorOutline);
}

export function townHallRoute(from:StreetPoint,to:StreetPoint){
 return floorRoute(from,to,isTownHallFloor);
}

const residentFloorOutlines={
 library:[[4,65],[6.4,64.2],[10,65.4],[14.1,63.5],[17.8,65],[21,63.8],[22.6,57.3],
  [56.3,47],[74,58],[78.2,63.5],[87.8,59.6],[96,65.2],[96,68],[49.7,97.9],[4,68]],
 'lyra-room':[[4,66.6],[12,64.7],[23.4,69.2],[35.3,63],[34.7,53],[30,49],[40,46.5],
  [58,46.5],[66,49],[66.8,54],[78.2,58.7],[81,57.5],[81,70.8],[70,78.8],[49,95.4],[4,68.8]],
 'luna-home':[[5,65],[33,50.6],[39.5,53],[44,50.1],[47.3,52],[50.7,50.5],[51.7,47],
  [52,43.2],[57,45.5],[57.3,49],[64.2,50.9],[78.8,59.7],[87,55.9],[94.5,61.1],[95,66],[50,97.8],[5,68.2]],
} as const;
export type ResidentFloor=keyof typeof residentFloorOutlines;
export const libraryStreetThreshold={x:70,y:83};
export const libraryStairFoot={x:84,y:64};
export const lyraRoomLanding={x:74,y:74};
export const lunaHomeThreshold={x:72,y:81.5};

export function isResidentFloor(floor:ResidentFloor,point:StreetPoint){
 return insideOutline(point,residentFloorOutlines[floor]);
}

export function residentFloorRoute(floor:ResidentFloor,from:StreetPoint,to:StreetPoint){
 return floorRoute(from,to,point=>isResidentFloor(floor,point));
}

export function cafeActorDepth({x,y}:StreetPoint){
 if(x<80||x>97)return Math.round(y);
 // Compare the actor's feet with the front legs of the rightmost seating group.
 const frontEdge=Math.min(63.4,60.8+(x-81.6)*.48,62+(95.4-x)*.5);
 return y<frontEdge?63:Math.max(65,Math.round(y));
}

export function officeRoomRoute(room:WalkableOfficeRoom,from:StreetPoint,to:StreetPoint){
 return floorRoute(from,to,point=>isOfficeRoomFloor(room,point));
}

export function officeRoomActorDepth(room:WalkableOfficeRoom,{x,y}:StreetPoint){
 if(room==='rest-area'){
  if(x>=65&&x<=77)return y<65?64:66;
  if(x>=30&&x<=56){
   const [[leftX,leftY],,[rightX,rightY],[frontX,frontY]]=restAreaTableFootprint;
   const frontEdge=x<frontX
    ?frontY+(x-frontX)*(frontY-leftY)/(frontX-leftX)
    :frontY+(x-frontX)*(rightY-frontY)/(rightX-frontX);
   return y<frontEdge?71:73;
  }
 }
 if(room==='aishi-office'&&x>=17&&x<=33)return y<56?55:57;
 return Math.round(y);
}

export function floorRoute(from:StreetPoint,to:StreetPoint,walkable:(point:StreetPoint)=>boolean):StreetPoint[]{
 if(!walkable(to))return [];
 function clear(a:StreetPoint,b:StreetPoint){
  const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*2);
  for(let i=0;i<=steps;i++){
   const t=steps?i/steps:0;
   if(!walkable({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;
  }
  return true;
 }
 if(clear(from,to))return [from,to];
 const points=new Map<string,StreetPoint>();
 const key=({x,y}:StreetPoint)=>`${x},${y}`;
 for(let x=gridStep;x<100;x+=gridStep){
  for(let y=gridStep;y<100;y+=gridStep){
   const point={x,y};
   if(walkable(point))points.set(key(point),point);
  }
 }
 const nearest=(point:StreetPoint,allowSnap:boolean)=>[...points.values()]
  .sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))
  .find(candidate=>allowSnap||clear(point,candidate));
 const validStart=walkable(from);
 const start=nearest(from,!validStart),end=nearest(to,false);
 if(!start||!end)return [];
 const queue=[start];
 const previous=new Map<string,StreetPoint|undefined>([[key(start),undefined]]);
 const steps=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
 for(let i=0;i<queue.length;i++){
  const current=queue[i];
  if(current===end)break;
  for(const [dx,dy] of steps){
   const next=points.get(key({x:current.x+dx,y:current.y+dy}));
   if(!next||previous.has(key(next))||!clear(current,next))continue;
   previous.set(key(next),current);
   queue.push(next);
  }
 }
 if(!previous.has(key(end)))return [];
 const route=[to];
 for(let point:StreetPoint|undefined=end;point;point=previous.get(key(point)))route.unshift(point);
 if(validStart)route.unshift(from);
 const result=[route[0]];
 for(let index=0;index<route.length-1;){
  let next=route.length-1;
  while(next>index+1&&!clear(route[index],route[next]))next--;
  result.push(route[next]);
  index=next;
 }
 return result;
}
