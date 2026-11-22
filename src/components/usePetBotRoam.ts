import {useEffect, useRef, useState} from 'react';
import {roomPoint,roomPosition,roomRoute,type RoomObject} from '../core/companionRoom';
import type {StreetPoint} from '../core/manaverseStreet';

function doorway(point:StreetPoint,objects:readonly RoomObject[]){
  return roomPosition(point.x/100*799,point.y/100*698,objects);
}

function chargingSpot(objects:readonly RoomObject[]){
  return roomPosition(211,545,objects);
}

export function usePetBotRoam(objects:readonly RoomObject[],entry:StreetPoint|undefined,exit:StreetPoint|undefined,onArrive:()=>void,pause=false,returnToCharge=false) {
  const [point,setPoint]=useState(()=>roomPoint(entry?doorway(entry,objects):chargingSpot(objects)));
  const [facing,setFacing]=useState(1);
  const feet=useRef(point);
  const dock=returnToCharge?roomPoint(chargingSpot(objects)):undefined;
  const charging=!!dock&&Math.hypot(point.x-dock.x,point.y-dock.y)<.01;
  const arrival=useRef(onArrive);
  useEffect(()=>{arrival.current=onArrive;},[onArrive]);
  useEffect(()=>{
    if(pause||charging)return;
    let origin=roomPosition(feet.current.x,feet.current.y,objects);
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reducedMotion&&!exit&&!returnToCharge)return;
    let timer=0, frame=0;
    const move=()=>{
      if(document.visibilityState!=='visible'){
        timer=window.setTimeout(move,1000);
        return;
      }
      const target=exit?doorway(exit,objects):returnToCharge?chargingSpot(objects):roomPosition(180+Math.random()*430,395+Math.random()*180,objects);
      const route=roomRoute(origin,target,objects);
      if(!route.length){timer=window.setTimeout(move,3000);return;}
      const step=()=>{
        const next=route.shift();
        if(!next){
          if(exit)arrival.current();
          else if(!returnToCharge)timer=window.setTimeout(move,5500+Math.random()*7000);
          return;
        }
        const from=roomPoint(origin),to=roomPoint(next);
        if(Math.abs(to.x-from.x)>.01)setFacing(to.x<from.x?-1:1);
        const start=performance.now(),duration=reducedMotion?1:Math.max(1,Math.hypot(to.x-from.x,to.y-from.y)*22);
        const tick=(now:number)=>{
          const t=Math.min(1,(now-start)/duration);
          feet.current={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
          setPoint(feet.current);
          if(t<1)frame=requestAnimationFrame(tick);
          else {origin=next;step();}
        };
        frame=requestAnimationFrame(tick);
      };
      step();
    };
    timer=window.setTimeout(move,exit||returnToCharge?180:4500);
    return ()=>{clearTimeout(timer);cancelAnimationFrame(frame);};
  },[objects,exit,pause,returnToCharge,charging]);
  return {point,facing,charging};
}
