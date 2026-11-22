import {useEffect,useRef,useState} from 'react';
import {manaversePassage} from '../core/manaversePassage';
import {sceneTravelMs,travelPoint} from '../core/manaverseMovement';
import {streetDoors,type StreetPoint} from '../core/manaverseStreet';
import {manaverseWalkRoute,type OutdoorArea} from '../core/manaverseNavigation';

export type {OutdoorArea} from '../core/manaverseNavigation';
export type OutdoorPetPosition={area:OutdoorArea;point:StreetPoint;facing:number};
type Goal={area:OutdoorArea;point:StreetPoint;goingHome?:boolean};

const streetEntry=streetDoors.living;
const initial:OutdoorPetPosition={area:'street',point:streetEntry,facing:1};
const districtPath=['street','square','district'] as const;

export function nextOutdoorArea(from:OutdoorArea,to:OutdoorArea):OutdoorArea{
 if(from===to)return from;
 if(from==='park')return 'street';
 if(to==='park')return from==='street'?'park':from==='district'?'square':'street';
 const index=districtPath.indexOf(from);
 return districtPath[index+Math.sign(districtPath.indexOf(to)-index)];
}

export function useOutdoorPetWalk(active:boolean,target:(now:number)=>Goal,onHome:()=>void){
 const [position,setPosition]=useState(initial);
 const latest=useRef({target,onHome});
 useEffect(()=>{latest.current={target,onHome};},[target,onHome]);
 useEffect(()=>{
  if(!active){setPosition(initial);return;}
  let actor=initial;
  let route:StreetPoint[]=[];
  let lastGoal:Goal|undefined;
  let nextPlan=0,last=Date.now();
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const timer=window.setInterval(()=>{
   const now=Date.now(),elapsed=Math.min(now-last,150);
   last=now;
   if(document.visibilityState!=='visible')return;
   const goal=latest.current.target(now);
   const next=nextOutdoorArea(actor.area,goal.area);
   const passage=next===actor.area?undefined:manaversePassage(actor.area,next);
   const destination=passage?.exit??goal.point;
   const distance=sceneTravelMs(actor.area,actor.point,destination);
   if(passage&&distance<12){
    actor={...actor,area:next,point:passage.entry};
    route=[];nextPlan=0;setPosition(actor);return;
   }
   if(!passage&&goal.goingHome&&distance<12){latest.current.onHome();return;}
   // About one Pet Bot length of space before it stops walking.
   if(!passage&&!goal.goingHome&&distance<500){route=[];nextPlan=0;return;}
   if(now>=nextPlan||lastGoal?.area!==goal.area||lastGoal?.goingHome!==goal.goingHome){
    route=manaverseWalkRoute(actor.area,actor.point,destination).slice(1);
    nextPlan=now+400;
    lastGoal=goal;
   }
   const waypoint=route[0];
   if(!waypoint)return;
   const duration=sceneTravelMs(actor.area,actor.point,waypoint);
   const point=motion.matches?waypoint:travelPoint(actor.point,waypoint,elapsed*1.1,duration);
   const dx=point.x-actor.point.x;
   actor={...actor,point,facing:Math.abs(dx)<.001?actor.facing:dx<0?-1:1};
   if(point===waypoint)route.shift();
   setPosition(actor);
  },80);
  return ()=>window.clearInterval(timer);
 },[active]);
 return position;
}
