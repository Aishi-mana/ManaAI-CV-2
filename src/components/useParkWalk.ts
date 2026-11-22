import {useEffect,useMemo,useRef,useState} from 'react';
import {PARK_ENTRY,parkStops,parkRoute,parkStep,nearestParkStop,type ParkPoint} from '../core/manaversePark';
import {sceneTravelMs,travelPoint} from '../core/manaverseMovement';
import {manaverseWalkRoute} from '../core/manaverseNavigation';

export function useParkWalk(active:boolean,onExit:()=>void,paused=false){
 const pause=useRef(paused);
 pause.current=paused;
 const [stop,setStop]=useState(PARK_ENTRY);
 const [route,setRoute]=useState<number[]>([]);
 const [leaving,setLeaving]=useState(false);
 const [motion,setMotion]=useState<{point:ParkPoint;facing:number}>();
 const lastFacing=useRef(1);
 const next=route[0];
 const from=parkStops[stop];
 const to=parkStops[next]??from;
 const legs=useMemo(()=>next===undefined?[]:manaverseWalkRoute('park',from,to).slice(1),[from,to,next]);
 useEffect(()=>{
  if(!active){
   setStop(PARK_ENTRY);
   setRoute([]);
   setLeaving(false);
   setMotion(undefined);
   lastFacing.current=1;
   return;
  }
  if(next===undefined)return;
  if(!legs.length){setRoute([]);setMotion(undefined);return;}
  let origin=from,index=0,start=performance.now(),previous=start;
  let frame=0;
  const animate=(now:number)=>{
   if(pause.current){
    start+=now-previous;
    previous=now;
    frame=requestAnimationFrame(animate);
    return;
   }
   previous=now;
   const target=legs[index];
   const duration=sceneTravelMs('park',origin,target);
   if(target.x!==origin.x)lastFacing.current=target.x<origin.x?-1:1;
   if(now-start<duration){
    setMotion({point:travelPoint(origin,target,now-start,duration),facing:lastFacing.current});
    frame=requestAnimationFrame(animate);
    return;
   }
   if(++index<legs.length){
    origin=target;start=now;
    setMotion({point:target,facing:lastFacing.current});
    frame=requestAnimationFrame(animate);
    return;
   }
   setMotion(undefined);
   setStop(next);
   setRoute(current=>current.slice(1));
  };
  frame=requestAnimationFrame(animate);
  return ()=>cancelAnimationFrame(frame);
 },[active,next,from,legs]);
 useEffect(()=>{
  if(active&&leaving&&stop===PARK_ENTRY&&next===undefined)onExit();
 },[active,leaving,stop,next,onExit]);
 const walk=(destination:number)=>{
  if(!leaving&&next===undefined)setRoute(parkRoute(stop,destination));
 };
 const leave=()=>{
  setLeaving(true);
  setRoute(next===undefined?parkRoute(stop,PARK_ENTRY):[next,...parkRoute(next,PARK_ENTRY)]);
 };
 return {
  walker:active?{
   point:motion?.point??from,
   walking:next!==undefined&&!paused,
   frame:1,
   facing:motion?.facing??lastFacing.current,
  }:undefined,
  drop:(point:ParkPoint)=>{
   if(!active||paused||leaving||next!==undefined)return;
   const destination=nearestParkStop(point);
   if(destination!==undefined)setStop(destination);
  },
  walk,
  step:(dx:number,dy:number)=>walk(parkStep(stop,dx,dy)),
  leave,
  stop,
  moving:next!==undefined,
 };
}
