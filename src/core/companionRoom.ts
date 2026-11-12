import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';

export const ROOM_KEY='mana.companion_room.v1';
export interface RoomPosition {u:number;v:number}
export interface RoomState {layout:2;position:RoomPosition;wateredAt?:string}
const clamp=(value:number)=>Math.min(1,Math.max(0,value));

// Floor coordinates and padded furniture footprints in the 799 × 698 artwork.
const furniture=[
 {left:391,right:533,top:439,bottom:525},
 {left:568,right:695,top:356,bottom:412},
 {left:180,right:242,top:510,bottom:554},
 {left:116,right:169,top:384,bottom:407},
];
interface Point {x:number;y:number}
export function roomPoint({u,v}:RoomPosition){
 return {x:400+360*(u-v),y:239+207*(u+v)};
}
function floorPosition(x:number,y:number):RoomPosition {
 const dx=(x-400)/360,dy=(y-239)/207;
 return {u:clamp((dy+dx)/2),v:clamp((dy-dx)/2)};
}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const contains=(box:typeof furniture[number],p:Point)=>p.x>box.left&&p.x<box.right&&p.y>box.top&&p.y<box.bottom;
export function roomPosition(x:number,y:number):RoomPosition {
 const position=floorPosition(x,y),point=roomPoint(position);
 const box=furniture.find(item=>contains(item,point));
 if(!box)return position;
 const options=[{x:box.left-1,y:point.y},{x:box.right+1,y:point.y},{x:point.x,y:box.top-1},{x:point.x,y:box.bottom+1}]
  .map(option=>floorPosition(option.x,option.y)).filter(option=>!furniture.some(item=>contains(item,roomPoint(option))));
 return options.sort((a,b)=>distance(point,roomPoint(a))-distance(point,roomPoint(b)))[0]??PLANT_POSITION;
}
export const PLANT_POSITION=floorPosition(202,418);

function clearSegment(a:Point,b:Point){
 return furniture.every(box=>{
  let start=0,end=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,box.left,box.right],[a.y,b.y-a.y,box.top,box.bottom]]){
   if(delta===0){if(origin<=min||origin>=max)return true;continue;}
   const first=(min-origin)/delta,second=(max-origin)/delta;
   start=Math.max(start,Math.min(first,second));
   end=Math.min(end,Math.max(first,second));
  }
  return start>=end;
 });
}

export function roomRoute(origin:RoomPosition,target:RoomPosition):RoomPosition[]{
 const nodes=[roomPoint(origin),roomPoint(target)];
 for(const box of furniture){
  for(const x of [box.left-1,box.right+1]){
   for(const y of [box.top-1,box.bottom+1]){
    if(distance({x,y},roomPoint(floorPosition(x,y)))<.01)nodes.push({x,y});
   }
  }
 }
 const costs=nodes.map((_,i)=>i===0?0:Infinity),previous=nodes.map(()=>-1);
 const pending=new Set(nodes.map((_,i)=>i));
 while(pending.size){
  const next=[...pending].reduce((a,b)=>costs[a]<=costs[b]?a:b);
  if(!Number.isFinite(costs[next])||next===1)break;
  pending.delete(next);
  for(const candidate of pending){
   const cost=costs[next]+distance(nodes[next],nodes[candidate]);
   if(cost<costs[candidate]&&clearSegment(nodes[next],nodes[candidate])){
    costs[candidate]=cost;
    previous[candidate]=next;
   }
  }
 }
 if(previous[1]<0)return [];
 const route=[target];
 for(let index=previous[1];index>0;index=previous[index]){
  const {x,y}=nodes[index];
  route.unshift(floorPosition(x,y));
 }
 return route;
}

export function validateRoom(value:unknown):RoomState {
 const point=isRecord(value)&&isRecord(value.position)?value.position:{};
 const coordinate=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?clamp(value):fallback;
 const u=coordinate(point.u,.42),v=coordinate(point.v,.65);
 const position=isRecord(value)&&value.layout===2
  ?roomPosition(roomPoint({u,v}).x,roomPoint({u,v}).y)
  :roomPosition(80+318*u+95*v,426-174*u+62*v);
 const wateredAt=isRecord(value)&&typeof value.wateredAt==='string'&&Number.isFinite(Date.parse(value.wateredAt))?value.wateredAt:undefined;
 return {layout:2,position,...(wateredAt?{wateredAt}:{})};
}
export function loadRoom():RoomState {
 try{return validateRoom(JSON.parse(readStored(ROOM_KEY)??'null'));}
 catch{return validateRoom(null);}
}
export function saveRoom(state:RoomState){
 writeStored(ROOM_KEY,JSON.stringify(validateRoom(state)));
}
