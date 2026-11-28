import {useEffect,useRef,useState,type RefObject} from 'react';
import {saveRoom,type RoomState} from '../core/companionRoom';
import {MANAVERSE_CHECKPOINT_EVENT,saveManaverseReturn,type ManaverseReturnState} from '../core/manaverseReturn';

export function useManaverseReturn(room:RefObject<RoomState>,initial:ManaverseReturnState,timeZone:string){
 const [state,setState]=useState(initial),current=useRef(initial);
 useEffect(()=>{
  // Commit the reconciled room before advancing its checkpoint. Repeating this effect is harmless.
  saveRoom(room.current);
  const checkpoint=()=>{const next={...current.current,checkpoint:{at:new Date().toISOString(),timeZone}};current.current=next;saveManaverseReturn(next);};
  checkpoint();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')checkpoint();},60_000);
  const visibility=()=>checkpoint();
  window.addEventListener(MANAVERSE_CHECKPOINT_EVENT,checkpoint);window.addEventListener('pagehide',checkpoint);document.addEventListener('visibilitychange',visibility);
  return ()=>{window.clearInterval(timer);window.removeEventListener(MANAVERSE_CHECKPOINT_EVENT,checkpoint);window.removeEventListener('pagehide',checkpoint);document.removeEventListener('visibilitychange',visibility);checkpoint();};
 },[room,timeZone]);
 const dismiss=()=>{const next={...current.current,...(current.current.report?{report:{...current.current.report,dismissed:true as const}}:{})};current.current=next;saveManaverseReturn(next);setState(next);};
 return {report:state.report,dismiss};
}
