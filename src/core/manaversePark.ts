import {floorRoute} from './officeWalk';

export type ParkPoint={x:number;y:number};

// The oval follows the painted cobblestones and connects to the south entrance.
export const parkLoop:ParkPoint[]=Array.from({length:24},(_,index)=>{
 const angle=index*Math.PI/12;
 return {x:50-Math.sin(angle)*39,y:53+Math.cos(angle)*32+(index===10||index===14?2:0)};
});
const ring=(xRadius:number,yRadius:number,centerY:number)=>parkLoop.map((_,index)=>{
 const angle=index*Math.PI/12;
 return {x:50-Math.sin(angle)*xRadius,y:centerY+Math.cos(angle)*yRadius};
});
const ringSize=parkLoop.length;
export const parkStreetThreshold={x:50,y:93};
export const parkStops=[...parkLoop,...ring(26,23,50),...ring(16,16,49),parkStreetThreshold];
export const PARK_ENTRY=parkStops.length-1;
export const parkRoamStops=[12,ringSize+6];
const distance=(a:ParkPoint,b:ParkPoint)=>Math.hypot(a.x-b.x,(a.y-b.y)*.58);
export function isParkPond({x,y}:ParkPoint){
 return Math.hypot((x-50)/11.1,(y-49)/13)<=1;
}
export function isParkFloor(point:ParkPoint){
 const {x,y}=point;
 const grounds=Math.hypot((x-50)/44.5,(y-54.4)/36.4)<=1;
 const sidePath=(x>=1&&x<=8||x>=92&&x<=99)&&y>=46&&y<=54.5;
 const southPath=x>=44.5&&x<=56.5&&y>=86&&y<=99;
 const bench=(x>=24&&x<=31&&y>=21&&y<=26)||(x>=69&&x<=76&&y>=21&&y<=26)||
  (x>=20&&x<=29&&y>=77&&y<=86)||(x>=71&&x<=81&&y>=77&&y<=86);
 return (grounds||sidePath||southPath)&&!bench&&!isParkPond(point);
}
export function parkFloorRoute(from:ParkPoint,to:ParkPoint){
 return floorRoute(from,to,isParkFloor);
}
function neighbors(stop:number){
 if(stop===PARK_ENTRY)return [0];
 const index=stop%ringSize;
 const base=stop-index;
 return [base+(index+1)%ringSize,base+(index+ringSize-1)%ringSize,stop-ringSize,stop+ringSize]
  .filter(next=>next>=0&&next<PARK_ENTRY).concat(stop===0?[PARK_ENTRY]:[]);
}
export const parkBenches={
 luna:{stop:14,meetupStop:15,point:{x:72,y:25},pose:'sketch',label:'Luna is sketching the pond.'},
 lyra:{stop:10,meetupStop:9,point:{x:28,y:25},pose:'read',label:'Lyra is reading by the pond.'},
};

export function parkRoute(from:number,to:number){
 if(!parkStops[from]||!parkStops[to]||from===to)return [];
 const pending=new Set(parkStops.keys());
 const costs=parkStops.map((_,index)=>index===from?0:Infinity);
 const previous:number[]=[];
 while(pending.size){
  const stop=[...pending].reduce((best,index)=>costs[index]<costs[best]?index:best);
  if(stop===to)break;
  pending.delete(stop);
  for(const next of neighbors(stop)){
   const cost=costs[stop]+distance(parkStops[stop],parkStops[next]);
   if(cost>=costs[next])continue;
   costs[next]=cost;
   previous[next]=stop;
  }
 }
 const route:number[]=[];
 for(let stop=to;stop!==from;stop=previous[stop])route.unshift(stop);
 return route;
}

export function nearestParkStop(point:ParkPoint){
 if(!isParkFloor(point))return;
 const nearest=parkStops.reduce((nearest,stop,index)=>{
  return distance(stop,point)<distance(parkStops[nearest],point)?index:nearest;
 },PARK_ENTRY);
 return distance(parkStops[nearest],point)<=6?nearest:undefined;
}

export function parkStep(stop:number,dx:number,dy:number){
 const from=parkStops[stop];
 let best=stop,alignment=.35;
 for(const next of neighbors(stop)){
  const to=parkStops[next];
  const score=((to.x-from.x)*dx+(to.y-from.y)*.58*dy)/distance(from,to);
  if(score<=alignment)continue;
  best=next;
  alignment=score;
 }
 return best;
}
