import {useEffect,useRef,useState} from 'react';
import type {StreetPoint} from '../core/manaverseStreet';
import {sceneTravelMs} from '../core/manaverseMovement';
import type {ManaverseArea} from './ManaverseMap';
import {manaverseWalkRoute} from '../core/manaverseNavigation';

export function useEntranceWalk(area:ManaverseArea,present:boolean,entry:StreetPoint,target:StreetPoint|undefined){
 const [actor,setActor]=useState({point:entry,facing:1,walking:false});
 const feet=useRef(entry);
 const x=target?.x,y=target?.y;
 useEffect(()=>{
  if(!present){feet.current=entry;setActor({point:entry,facing:1,walking:false});return;}
  if(x===undefined||y===undefined){setActor(previous=>({...previous,walking:false}));return;}
  const path=manaverseWalkRoute(area,feet.current,{x,y}).slice(1);
  if(!path.length){setActor(previous=>({...previous,walking:false}));return;}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0;
  const step=()=>{
   const to=path.shift();
   if(!to){setActor(previous=>({...previous,walking:false}));return;}
   const from=feet.current,start=performance.now(),duration=Math.max(1,sceneTravelMs(area,from,to));
   const tick=(now:number)=>{
    const t=reduced?1:Math.min(1,(now-start)/duration);
    const point=t===1?to:{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
    feet.current=point;
    setActor(previous=>({point,walking:t<1||path.length>0,facing:to.x===from.x?previous.facing:to.x<from.x?-1:1}));
    if(t<1)frame=requestAnimationFrame(tick);
    else step();
   };
   frame=requestAnimationFrame(tick);
  };
  step();
  return ()=>cancelAnimationFrame(frame);
 },[area,present,entry,x,y]);
 return {...actor,place(point:StreetPoint){
  feet.current=point;
  setActor(previous=>({...previous,point}));
 }};
}
