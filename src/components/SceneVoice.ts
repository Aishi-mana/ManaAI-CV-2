import {createContext,useContext,useEffect,useRef,useState} from 'react';

import type {ResidentId} from '../core/residentProfiles';

export type SceneSpeaker='mana'|ResidentId;
export const SCENE_BUBBLE_MS=6000;
export const SceneVoice=createContext<{
 ready:boolean;
 speak:(context:string,signal:AbortSignal,speaker:SceneSpeaker)=>Promise<string>;
} | null>(null);

export function useSceneLine(context:string|undefined,speaker:SceneSpeaker='mana'){
 const voice=useContext(SceneVoice);
 const latest=useRef(voice);
 useEffect(()=>{latest.current=voice;},[voice]);
 const [result,setResult]=useState<{context:string;text:string}>();
 useEffect(()=>{
  setResult(undefined);
  if(!context||document.visibilityState!=='visible')return;
  const controller=new AbortController();
  const deadline=Date.now()+1800;
  let timer:number|undefined;
  let dismiss:number|undefined;
  const start=()=>{
   const current=latest.current;
   if(document.visibilityState!=='visible')return;
   if(!current?.ready){
    if(Date.now()<deadline)timer=window.setTimeout(start,120);
    return;
   }
   void current.speak(context,controller.signal,speaker).then(text=>{
    if(!text||controller.signal.aborted)return;
    setResult({context,text});
    dismiss=window.setTimeout(()=>setResult(undefined),SCENE_BUBBLE_MS);
   }).catch(()=>{});
  };
  start();
  return ()=>{window.clearTimeout(timer);window.clearTimeout(dismiss);controller.abort();};
 },[context,speaker]);
 return result?.context===context?result?.text:undefined;
}
