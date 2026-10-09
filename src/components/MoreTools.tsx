import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';

export default function MoreTools({children,badge=0}:{children:ReactNode;badge?:number}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <div className="more-tools" ref={root} onBlur={event=>{if(event.relatedTarget instanceof Node&&!root.current?.contains(event.relatedTarget))setOpen(false);}}>
  <button className="btn" ref={trigger} aria-expanded={open} aria-controls="more-tools-panel" onClick={()=>setOpen(!open)}>More{badge?` (${badge})`:''}</button>
  {open&&<div className="more-tools-panel" id="more-tools-panel" aria-label="More tools" onClick={event=>{if(event.target instanceof Element&&event.target.closest('button'))setOpen(false);}}>{children}</div>}
 </div>;
}
