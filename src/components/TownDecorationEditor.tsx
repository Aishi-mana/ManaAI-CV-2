import {useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {TOWN_DECORATIONS,MAX_DECORATION_OBJECTS,decorationObject,decorationKinds,defaultDecorationLayout,scheduleDecorationObjects,
 transformDecoration,recordDecorationEdit,undoDecorationEdit,redoDecorationEdit,pointerDecorationRotation,type DecorationObject,type DecorationHistory,type TownDecoration} from '../core/townDecorationLayout';
import type {DecorationSchedule} from '../core/townFestivities';
import {DecorationArtwork,decorationObjectStyle} from './TownDecorationObjects';

// Shared between schedule editors for this app session, without replacing text
// in the system clipboard when an object is copied.
let copiedDecoration:DecorationObject|undefined;

export default function TownDecorationEditor({schedule,onSave,onClose}:{schedule:DecorationSchedule;onSave:(objects:DecorationObject[])=>void;onClose:()=>void}){
 const [history,setHistory]=useState<DecorationHistory>(()=>({past:[],present:scheduleDecorationObjects(schedule),future:[]}));
 const [preview,setPreview]=useState<DecorationObject[]>();
 const objects=preview??history.present;
 const objectsRef=useRef(objects);objectsRef.current=objects;
 const [selected,setSelected]=useState(objects[0]?.id??'');
 const [zoom,setZoom]=useState(1);
 const [grid,setGrid]=useState(true);
 const [snap,setSnap]=useState(false);
 const [animate,setAnimate]=useState(false);
 const [keepRatio,setKeepRatio]=useState(true);
 const [feedback,setFeedback]=useState('');
 const [discard,setDiscard]=useState(false);
 const [clipboard,setClipboard]=useState(()=>copiedDecoration);
 const stage=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null),title=useRef<HTMLHeadingElement>(null),discardButton=useRef<HTMLButtonElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const gesture=useRef<{pointer:number;mode:'move'|'resize'|'rotate'|'pan';id?:string;x:number;y:number;width:number;height:number;pivotX:number;pivotY:number;
  original?:DecorationObject;before:DecorationObject[];left:number;top:number}|undefined>(undefined);
 const item=objects.find(object=>object.id===selected);
 const dirty=JSON.stringify(history.present)!==JSON.stringify(scheduleDecorationObjects(schedule));
 useEffect(()=>{
  previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  title.current?.focus();
  return ()=>previousFocus.current?.focus();
 },[]);
 useEffect(()=>{if(discard)discardButton.current?.focus();},[discard]);
 function commit(next:readonly DecorationObject[]){setPreview(undefined);setHistory(previous=>recordDecorationEdit(previous,next));}
 function edit(patch:Partial<DecorationObject>){
  if(!item||item.locked)return;
  commit(objects.map(object=>object.id===item.id?transformDecoration(object,patch):object));
 }
 function add(kind:TownDecoration,point={x:50,y:60}){
  if(objects.length>=MAX_DECORATION_OBJECTS){setFeedback('This layout can hold up to 100 objects.');return;}
  const object=decorationObject(kind,crypto.randomUUID(),point.x,point.y);
  commit([...objects,object]);setSelected(object.id);setFeedback('');
 }
 function duplicate(){
  if(!item||objects.length>=MAX_DECORATION_OBJECTS)return;
  const copy={...transformDecoration(item,{x:item.x+2,y:item.y+2}),id:crypto.randomUUID(),locked:false};
  commit([...objects,copy]);setSelected(copy.id);
 }
 function copy(cut=false){
  if(!item||cut&&item.locked)return;
  copiedDecoration={...item,locked:false};setClipboard(copiedDecoration);
  if(cut)remove();
  setFeedback(cut?'Object cut. Paste it into this or another schedule.':'Object copied. Paste it into this or another schedule.');
 }
 function paste(){
  const source=copiedDecoration??clipboard;
  if(!source)return;
  if(objects.length>=MAX_DECORATION_OBJECTS){setFeedback('This layout can hold up to 100 objects.');return;}
  const pasted={...transformDecoration(source,{x:source.x+2,y:source.y+2,hidden:false,locked:false}),id:crypto.randomUUID()};
  commit([...objects,pasted]);setSelected(pasted.id);copiedDecoration={...pasted};setClipboard(copiedDecoration);setFeedback('Object pasted.');
 }
 function undo(){if(!gesture.current&&history.past.length){setHistory(undoDecorationEdit);setFeedback('Undid the last change.');}}
 function redo(){if(!gesture.current&&history.future.length){setHistory(redoDecorationEdit);setFeedback('Restored the last change.');}}
 function centerSelection(){
  if(!item||!stage.current||!viewport.current)return;
  viewport.current.scrollLeft=stage.current.offsetWidth*item.x/100-viewport.current.clientWidth/2;
  viewport.current.scrollTop=stage.current.offsetHeight*(item.y-item.height/2)/100-viewport.current.clientHeight/2;
 }
 function remove(){if(item&&!item.locked){commit(objects.filter(object=>object.id!==item.id));setSelected('');}}
 function point(clientX:number,clientY:number){
  const bounds=stage.current!.getBoundingClientRect();
  return {x:Math.max(0,Math.min(100,(clientX-bounds.left)/bounds.width*100)),y:Math.max(0,Math.min(100,(clientY-bounds.top)/bounds.height*100))};
 }
 function start(event:PointerEvent<HTMLElement>,mode:'move'|'resize'|'rotate'|'pan',object?:DecorationObject){
  if(event.button!==0||gesture.current)return;
  event.preventDefault();event.stopPropagation();
  if(object){setSelected(object.id);if(object.locked)return;}
  const bounds=stage.current!.getBoundingClientRect();
  gesture.current={pointer:event.pointerId,mode,id:object?.id,x:event.clientX,y:event.clientY,width:bounds.width,height:bounds.height,
   pivotX:bounds.left+(object?.x??0)/100*bounds.width,pivotY:bounds.top+(object?.y??0)/100*bounds.height,
   original:object,before:objects,left:viewport.current?.scrollLeft??0,top:viewport.current?.scrollTop??0};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function move(event:PointerEvent){
  const drag=gesture.current;
  if(!drag||drag.pointer!==event.pointerId)return;
  if(drag.mode==='pan'){
   viewport.current!.scrollLeft=drag.left-event.clientX+drag.x;viewport.current!.scrollTop=drag.top-event.clientY+drag.y;return;
  }
  const original=drag.original!;
  if(drag.mode==='rotate'){
   const rotation=pointerDecorationRotation(original.rotation,{x:drag.x,y:drag.y},{x:event.clientX,y:event.clientY},{x:drag.pivotX,y:drag.pivotY},snap||event.shiftKey);
   setPreview(drag.before.map(object=>object.id===drag.id?transformDecoration(object,{rotation}):object));
   return;
  }
  const pixelX=event.clientX-drag.x,pixelY=event.clientY-drag.y;
  const dx=pixelX/drag.width*100,dy=pixelY/drag.height*100;
  const round=(value:number)=>snap?Math.round(value/2)*2:value;
  let patch:Partial<DecorationObject>={x:round(original.x+dx),y:round(original.y+dy)};
  if(drag.mode==='resize'){
   const radians=original.rotation*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians),flip=original.flipped?-1:1;
   const localX=(pixelX*cos+pixelY*sin)*flip,localY=-pixelX*sin+pixelY*cos;
   const width=original.width*drag.width/100,height=original.height*drag.height/100;
   const ratio=Math.max(.05,1+(localX*width+localY*height)/(width*width+height*height));
   const resized=transformDecoration(original,{width:round(keepRatio?original.width*ratio:original.width+localX/drag.width*100),
    height:round(keepRatio?original.height*ratio:original.height+localY/drag.height*100)});
   const shiftX=(resized.width-original.width)*drag.width/200*flip,shiftY=(resized.height-original.height)*drag.height/100;
   patch={width:resized.width,height:resized.height,x:original.x+(shiftX*cos-shiftY*sin)/drag.width*100,y:original.y+(shiftX*sin+shiftY*cos)/drag.height*100};
  }
  setPreview(drag.before.map(object=>object.id===drag.id?transformDecoration(object,patch):object));
 }
 function finish(event:PointerEvent,cancel=false){
  const drag=gesture.current;
  if(!drag||drag.pointer!==event.pointerId)return;
  gesture.current=undefined;
  if(drag.mode!=='pan'){if(cancel)setPreview(undefined);else commit(objectsRef.current);}
 }
 function close(){if(dirty)setDiscard(true);else onClose();}
 function key(event:KeyboardEvent<HTMLDivElement>){
  event.stopPropagation();
  if(discard){
   if(event.key==='Escape'){event.preventDefault();setDiscard(false);}
   else if(event.key==='Tab'){
    const buttons=event.currentTarget.querySelectorAll<HTMLButtonElement>('.town-decoration-discard button');
    if(buttons.length){event.preventDefault();(document.activeElement===buttons[0]?buttons[1]:buttons[0]).focus();}
   }
   return;
  }
  if(event.key==='Tab'){
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(element=>element.getClientRects().length);
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===title.current)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;
  }
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!gesture.current){event.preventDefault();onSave(objects);return;}
  if((event.target as Element).closest('input,select,textarea'))return;
  if(gesture.current){
   if(event.key==='Escape'){event.preventDefault();gesture.current=undefined;setPreview(undefined);setFeedback('Drag cancelled.');}
   return;
  }
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)redo();else undo();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'){event.preventDefault();copy();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='x'){event.preventDefault();copy(true);return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='v'){event.preventDefault();paste();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'){event.preventDefault();duplicate();return;}
  if(!event.ctrlKey&&!event.metaKey&&event.key.toLowerCase()==='f'){event.preventDefault();centerSelection();return;}
  if(event.key==='['||event.key===']'){event.preventDefault();if(item)edit({rotation:item.rotation+(event.key==='['?-15:15)});return;}
  if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();remove();return;}
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(delta&&item){event.preventDefault();const step=event.shiftKey?2:.25;edit({x:item.x+delta[0]*step,y:item.y+delta[1]*step});}
 }
 const numeric=(label:string,field:'x'|'y'|'width'|'height'|'rotation'|'layer'|'opacity',min:number,max:number,step=1)=><label>{label}<input type="number" min={min} max={max} step={step} value={item?Math.round(item[field]*100)/100:0} disabled={!item||item.locked}
  onChange={event=>{if(event.target.value!==''&&Number.isFinite(event.target.valueAsNumber)){
   const value=event.target.valueAsNumber;
   edit(field==='width'&&keepRatio&&item?{width:value,height:item.height*value/item.width}:field==='height'&&keepRatio&&item?{height:value,width:item.width*value/item.height}:{[field]:value});
  }}}/></label>;
 return createPortal(<div className="town-decoration-editor" data-scene-editor role="dialog" aria-modal="true" aria-labelledby="town-decoration-editor-title" onKeyDown={key}>
  <header><div><h2 ref={title} tabIndex={-1} id="town-decoration-editor-title">Decorate Town Square</h2><p>{schedule.name} · {dirty?'Unsaved changes':'Saved layout'}</p></div>
   <div className="town-decoration-actions"><button className="btn" type="button" onClick={close}>Cancel</button><button className="btn primary" type="button" disabled={!!gesture.current} onClick={()=>onSave(objects)}>Save layout</button></div></header>
  <div className="town-decoration-editor-toolbar">
   <button className="btn" type="button" title="Undo (Ctrl/Cmd+Z)" disabled={!history.past.length} onClick={undo}>Undo</button>
   <button className="btn" type="button" title="Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y)" disabled={!history.future.length} onClick={redo}>Redo</button>
   <button className="btn" type="button" title="Copy selected object (Ctrl/Cmd+C)" disabled={!item} onClick={()=>copy()}>Copy</button>
   <button className="btn" type="button" title="Cut selected object (Ctrl/Cmd+X)" disabled={!item||item.locked} onClick={()=>copy(true)}>Cut</button>
   <button className="btn" type="button" title="Paste object (Ctrl/Cmd+V)" disabled={!clipboard||objects.length>=MAX_DECORATION_OBJECTS} onClick={paste}>Paste</button>
   <button className="btn" type="button" title="Center view on selected object (F)" disabled={!item} onClick={centerSelection}>Find selected</button>
   <button className="btn" type="button" onClick={()=>setZoom(value=>Math.max(.5,value-.25))} disabled={zoom<=.5} aria-label="Zoom editor out">−</button>
   <button className="btn" type="button" onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button>
   <button className="btn" type="button" onClick={()=>setZoom(value=>Math.min(3,value+.25))} disabled={zoom>=3} aria-label="Zoom editor in">+</button>
   <label><input type="checkbox" checked={grid} onChange={event=>setGrid(event.target.checked)}/>Grid</label>
   <label><input type="checkbox" checked={snap} onChange={event=>setSnap(event.target.checked)}/>Snap</label>
   <label><input type="checkbox" checked={animate} onChange={event=>setAnimate(event.target.checked)}/>Animate effects</label>
  </div>
  <div className="town-decoration-editor-body">
   <aside className="town-decoration-editor-library" aria-label="Decoration library"><h3>Add decorations</h3><p>Drag onto the square or click to add.</p>
    {TOWN_DECORATIONS.map(option=><button className="town-decoration-library-item" key={option.id} type="button" draggable
     onDragStart={event=>{event.dataTransfer.setData('application/x-mana-decoration',option.id);event.dataTransfer.effectAllowed='copy';}}
     onClick={()=>add(option.id)} disabled={objects.length>=MAX_DECORATION_OBJECTS}>
     <span className="town-decoration-library-art town-decoration-object"><DecorationArtwork kind={option.id} animate={false}/></span>{option.label}</button>)}
    <h3>Objects ({objects.length})</h3>
    <div className="town-decoration-object-list">{objects.map((object,index)=><button key={object.id} type="button" aria-pressed={object.id===selected} onClick={()=>setSelected(object.id)}>
     {index+1}. {TOWN_DECORATIONS.find(option=>option.id===object.kind)?.label}{object.locked?' · locked':''}{object.hidden?' · hidden':''}</button>)}</div>
   </aside>
   <main className="town-decoration-editor-canvas">
    <p>Drag to move, use the corner to resize, or drag the round handle to rotate. Hold Shift to rotate in 15° steps. Escape cancels a drag.</p>
    <div ref={viewport} className="town-decoration-editor-viewport" onPointerMove={move} onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)} onLostPointerCapture={event=>finish(event)}>
     <div ref={stage} className="town-decoration-editor-stage" style={{width:`${zoom*100}%`}} onPointerDown={event=>{setSelected('');start(event,'pan');}}
      onDragOver={event=>{if(event.dataTransfer.types.includes('application/x-mana-decoration')){event.preventDefault();event.dataTransfer.dropEffect='copy';}}}
      onDrop={event=>{event.preventDefault();const kind=event.dataTransfer.getData('application/x-mana-decoration');if(TOWN_DECORATIONS.some(option=>option.id===kind))add(kind as TownDecoration,point(event.clientX,event.clientY));}}>
      <img className="manaverse-street-art" src="./companion-room/manaverse-square.webp" alt="Town Square decoration preview" draggable={false}/>
      {grid&&<div className="town-decoration-editor-grid" aria-hidden="true"/>}
      {objects.filter(object=>!object.hidden).map(object=><div key={object.id} className="town-decoration-object town-decoration-edit-object" data-selected={object.id===selected} data-locked={object.locked} data-kind={object.kind}
       style={decorationObjectStyle(object)} onPointerDown={event=>start(event,'move',object)}>
       <DecorationArtwork kind={object.kind} animate={animate}/>
       {object.id===selected&&!object.locked&&<>
        <button type="button" className="town-decoration-resize" aria-label="Resize selected decoration" onPointerDown={event=>start(event,'resize',object)}/>
        <button type="button" className="town-decoration-rotate" aria-label="Rotate selected decoration" title="Drag to rotate; Shift snaps to 15°" onPointerDown={event=>start(event,'rotate',object)}>↻</button>
       </>}
      </div>)}
     </div>
    </div>
    {feedback&&<p role="status">{feedback}</p>}
   </main>
   <aside className="town-decoration-editor-inspector" aria-label="Selected object settings"><h3>{item?TOWN_DECORATIONS.find(option=>option.id===item.kind)?.label:'Select an object'}</h3>
    {item&&<>
     <label><input type="checkbox" checked={item.locked} onChange={event=>commit(objects.map(object=>object.id===item.id?{...object,locked:event.target.checked}:object))}/>Lock object</label>
     <label><input type="checkbox" checked={!item.hidden} disabled={item.locked} onChange={event=>edit({hidden:!event.target.checked})}/>Visible</label>
     <label><input type="checkbox" checked={keepRatio} onChange={event=>setKeepRatio(event.target.checked)}/>Keep proportions</label>
     {numeric('Horizontal %','x',0,100,.25)}{numeric('Vertical %','y',0,100,.25)}
     {numeric('Width %','width',1,100,.25)}{numeric('Height %','height',1,100,.25)}
     {numeric('Rotation °','rotation',-180,180)}{numeric('Layer','layer',1,100)}{numeric('Opacity','opacity',0,1,.05)}
     <p>Higher layers appear in front. Character depth changes with their position.</p>
     <div className="town-decoration-actions"><button className="btn" type="button" disabled={item.locked} onClick={()=>edit({flipped:!item.flipped})}>Flip</button>
      <button className="btn" type="button" disabled={item.locked||item.rotation===0} onClick={()=>edit({rotation:0})}>Reset rotation</button>
      <button className="btn" type="button" disabled={item.locked} onClick={()=>edit({layer:100})}>Bring to front</button>
      <button className="btn" type="button" disabled={item.locked} onClick={()=>edit({layer:1})}>Send to back</button>
      <button className="btn" type="button" onClick={duplicate} disabled={objects.length>=MAX_DECORATION_OBJECTS}>Duplicate</button>
      <button className="btn" type="button" disabled={item.locked} onClick={remove}>Delete</button></div>
    </>}
    <button className="btn" type="button" onClick={()=>{commit(defaultDecorationLayout(schedule.decorations.length?schedule.decorations:decorationKinds(objects)));setSelected('');}}>Reset arrangement</button>
    <details className="town-decoration-shortcuts"><summary>Keyboard shortcuts</summary>
     <p>Ctrl/Cmd+C, X, V: copy, cut, paste objects<br/>Ctrl/Cmd+D: duplicate<br/>Ctrl/Cmd+Z: undo<br/>Ctrl/Cmd+Shift+Z or Ctrl+Y: redo<br/>Ctrl/Cmd+S: save layout<br/>F: find selected<br/>[ / ]: rotate by 15°<br/>Arrow keys: nudge; Shift: larger steps<br/>Delete: remove; Escape: cancel drag</p>
     <p>Copied objects stay available between schedule editors while Mana is open.</p>
    </details>
   </aside>
  </div>
  {discard&&<div className="town-decoration-discard" role="alertdialog" aria-label="Discard decoration changes"><p>Discard your unsaved layout changes?</p><button ref={discardButton} className="btn" type="button" onClick={()=>setDiscard(false)}>Keep editing</button><button className="btn" type="button" onClick={onClose}>Discard changes</button></div>}
 </div>,document.body);
}
