import {createContext,useContext,useLayoutEffect,useRef,type PointerEvent,type ReactNode} from 'react';
import type {StreetPoint} from '../core/manaverseStreet';

export const ScenePanContext=createContext<()=>void>(()=>{});
export const minSceneZoom=.5;
export const maxSceneZoom=2;

export function SceneZoomControls({zoom,onZoom}:{zoom:number;onZoom:(zoom:number)=>void}){
 return <div className="scene-zoom-controls" role="group" aria-label="Map zoom">
  <button type="button" className="btn" aria-label="Zoom out" disabled={zoom<=minSceneZoom}
   onClick={()=>onZoom(Math.max(minSceneZoom,zoom-.25))}>−</button>
  <button type="button" className="btn" aria-label="Reset zoom" title="Reset zoom"
   onClick={()=>onZoom(1)}>{Math.round(zoom*100)}%</button>
  <button type="button" className="btn" aria-label="Zoom in" disabled={zoom>=maxSceneZoom}
   onClick={()=>onZoom(Math.min(maxSceneZoom,zoom+.25))}>+</button>
 </div>;
}

export default function SceneViewport({children,focus,disabled=false,className=''}:{
 children:ReactNode;focus?:StreetPoint;disabled?:boolean;className?:string;
}){
 const view=useRef<HTMLDivElement>(null);
 const drag=useRef<{id:number;x:number;y:number;left:number;top:number}|undefined>(undefined);
 const onPan=useContext(ScenePanContext);
 useLayoutEffect(()=>{
  const viewport=view.current,stage=viewport?.firstElementChild as HTMLElement|undefined;
  if(!focus||!viewport||!stage)return;
  viewport.scrollLeft=stage.offsetLeft+stage.offsetWidth*focus.x/100-viewport.clientWidth/2;
  viewport.scrollTop=stage.offsetTop+stage.offsetHeight*focus.y/100-viewport.clientHeight*.72;
 },[focus?.x,focus?.y,disabled]);
 function pan(event:PointerEvent<HTMLDivElement>){
  const start=drag.current;
  if(!start||start.id!==event.pointerId)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(!event.currentTarget.hasPointerCapture(event.pointerId)){
   if(Math.hypot(dx,dy)<6)return;
   event.currentTarget.setPointerCapture(event.pointerId);
   onPan();
  }
  event.currentTarget.scrollLeft=start.left-dx;
  event.currentTarget.scrollTop=start.top-dy;
 }
 if(disabled)return <>{children}</>;
 return <div ref={view} className={`scene-viewport ${className}`} onPointerDown={event=>{
  if(event.button!==0||(event.target as Element).closest('button,summary,a,input,select,textarea'))return;
  const {scrollLeft,scrollTop,scrollWidth,scrollHeight,clientWidth,clientHeight}=event.currentTarget;
  if(scrollWidth<=clientWidth&&scrollHeight<=clientHeight)return;
  drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:scrollLeft,top:scrollTop};
 }} onPointerMove={pan} onPointerUp={()=>{drag.current=undefined;}} onPointerCancel={()=>{drag.current=undefined;}}
  onPointerLeave={event=>{if(!event.currentTarget.hasPointerCapture(event.pointerId))drag.current=undefined;}}>
  {children}
 </div>;
}
