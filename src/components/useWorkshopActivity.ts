import {useEffect,useRef,useState} from 'react';
import type {StreetPoint} from '../core/manaverseStreet';

export const WORKSHOP_WORK_POINT:StreetPoint={x:46,y:71};

// Activity time starts at the workbench, after the shared walker finishes.
export function useWorkshopActivity(present:boolean,blocked:boolean,position:StreetPoint,moving:boolean,
 approach:()=>unknown,onComplete:()=>void){
 const [phase,setPhase]=useState<'waiting'|'working'|'done'>('waiting');
 const callbacks=useRef({approach,onComplete});
 callbacks.current={approach,onComplete};
 const atBench=Math.hypot(position.x-WORKSHOP_WORK_POINT.x,position.y-WORKSHOP_WORK_POINT.y)<.1;
 useEffect(()=>{
  if(!present){setPhase('waiting');return;}
  if(blocked||moving||phase!=='waiting')return;
  if(atBench)setPhase('working');
  else callbacks.current.approach();
 },[present,blocked,moving,atBench,phase,position.x,position.y]);
 useEffect(()=>{
  if(!present||blocked||moving||!atBench||phase!=='working')return;
  const timer=window.setTimeout(()=>{
   setPhase('done');
   callbacks.current.onComplete();
  },5500);
  return ()=>clearTimeout(timer);
 },[present,blocked,moving,atBench,phase]);
 return present&&!blocked&&!moving&&atBench&&phase==='working';
}
