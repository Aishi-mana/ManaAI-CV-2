/** Fixed input adapter, also embedded in offline exports. Click pulses survive between ticks. */
export function createGamePointer(canvas:HTMLCanvasElement){
 let state={x:0,y:0,inside:false,down:false,clicked:false,released:false};
 function locate(e:PointerEvent){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return false;const x=(e.clientX-r.left)*480/r.width,y=(e.clientY-r.top)*280/r.height;state.x=Math.max(0,Math.min(480,x));state.y=Math.max(0,Math.min(280,y));state.inside=x>=0&&x<480&&y>=0&&y<280;return state.inside;}
 const primary=(e:PointerEvent)=>e.isPrimary!==false;
 const reset=()=>{state={x:0,y:0,inside:false,down:false,clicked:false,released:false};};
 canvas.onpointermove=e=>{if(primary(e))locate(e);};
 canvas.onpointerdown=e=>{if(!primary(e)||e.button!==0||!locate(e))return;e.preventDefault();canvas.focus();canvas.setPointerCapture?.(e.pointerId);state.down=true;state.clicked=true;};
 const release=(e:PointerEvent)=>{if(!primary(e)||e.button!==0)return;if(state.down)state.released=true;state.down=false;};
 canvas.onpointerup=e=>{if(primary(e))locate(e);release(e);};
 canvas.onpointerleave=()=>{state.inside=false;state.down=false;};
 canvas.onpointercancel=reset;canvas.onlostpointercapture=()=>{state.down=false;};
 window.addEventListener('pointerup',release);window.addEventListener('blur',reset);
 return {take(){const result={...state};state.clicked=false;state.released=false;return result;},reset,stop(){reset();canvas.onpointermove=null;canvas.onpointerdown=null;canvas.onpointerup=null;canvas.onpointerleave=null;canvas.onpointercancel=null;canvas.onlostpointercapture=null;window.removeEventListener?.('pointerup',release);window.removeEventListener?.('blur',reset);}};
}
export const MOUSE_GAME_EXAMPLE=`let playing=false,score=0;
let target={x:250,y:140};
api.onFrame=(dt,keys,mouse)=>{
 api.clear('#202637');
 if(!playing){
  api.text('Click target game',145,65,'#ffffff');
  if(api.button('Start game',160,100,160,48)){playing=true;score=0;}
  api.text('Move your mouse and click the yellow target.',55,205,'#ffffff');
  return;
 }
 api.text('Score: '+score,15,25,'#ffffff');
 if(api.button('Menu',365,8,100,32)){playing=false;return;}
 if(mouse.clicked&&mouse.inside&&Math.hypot(mouse.x-target.x,mouse.y-target.y)<22){score++;target={x:30+Math.random()*420,y:80+Math.random()*170};}
 api.circle(target.x,target.y,22,'#ffc636');
 if(mouse.inside){api.rect(mouse.x-8,mouse.y,16,2,'#ffffff');api.rect(mouse.x,mouse.y-8,2,16,'#ffffff');}
 api.text('Click the yellow target to score.',15,270,'#ffffff');
};`;
