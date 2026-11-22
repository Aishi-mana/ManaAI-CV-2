import {useEffect,useRef,type RefObject} from 'react';

// Background scene features share the model with chat and with each other.
export function useSceneTask(enabled:boolean,ready:boolean,interval:number,lease:RefObject<AbortController|undefined>,run:(signal:AbortSignal)=>Promise<void>){
 const latest=useRef({ready,run});
 latest.current={ready,run};
 useEffect(()=>{
  if(!enabled)return;
  let active:AbortController|undefined;
  const timer=window.setInterval(()=>{
   if(!latest.current.ready||lease.current||document.visibilityState!=='visible')return;
   const controller=new AbortController();
   lease.current=controller;
   active=controller;
   const timeout=window.setTimeout(()=>controller.abort(),90_000);
   void latest.current.run(controller.signal).catch(()=>{
    // Background work can try at its next scheduled opportunity.
   }).finally(()=>{
    window.clearTimeout(timeout);
    if(lease.current===controller)lease.current=undefined;
    if(active===controller)active=undefined;
   });
  },interval);
  return ()=>{window.clearInterval(timer);active?.abort();};
 },[enabled,interval,lease]);
}
