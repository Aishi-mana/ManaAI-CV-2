import {gameProgressValue} from './gameProgress';
import {createTileTools} from './gameTiles';
import {bundleGameProject,readGameProject} from './gameProject';
/** Fixed sandbox bootstrap. User code only runs inside a worker in an opaque-origin frame. */
export const SANDBOX_EXAMPLE=`let score = 0;
let x = 120, y = 120;
let stars = [];
let wasSpace = false;
function newStar() {
  return {x: 12 + Math.random() * 456, y: 65 + Math.random() * 203, r: 3};
}
function reset() {
  score = 0; x = 120; y = 120;
  stars = Array.from({length: 20}, newStar);
}
reset(); // Initialize once, before the frame callback.
api.onFrame = (dt, keys) => {
  if (keys.Space && !wasSpace) reset();
  wasSpace = !!keys.Space;
  const speed = 150;
  x += ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * speed * dt;
  y += ((keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)) * speed * dt;
  x = Math.max(10, Math.min(470, x));
  y = Math.max(65, Math.min(270, y));
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    if (Math.hypot(x - star.x, y - star.y) < star.r + 10) {
      score++; stars[i] = newStar();
    }
  }
  api.clear("#000000");
  api.text("Collect stars! Arrow keys move.", 12, 21, "#ffffff");
  api.text("Space resets. Score: " + score, 12, 43, "#ffffff");
  for (const star of stars) api.circle(star.x, star.y, star.r, "#ffffff");
  api.circle(x, y, 10, "#ffff00");
};`;
export const SANDBOX_POWERUP_EXAMPLE=`// State persists between frames; reset only on a new Space press.
let score = 0, x = 120, y = 120;
let stars = [], powerUps = [], wasSpace = false;
let speedTimer = 0, shieldTimer = 0;
function point(r) {
  return {x: 12 + Math.random() * 456, y: 65 + Math.random() * 203, r};
}
function newStar() { return point(3); }
function newPowerUp() {
  return {...point(6), type: Math.random() < 0.5 ? "speed" : "shield"};
}
function reset() {
  score = 0; x = 120; y = 120;
  speedTimer = 0; shieldTimer = 0;
  stars = Array.from({length: 20}, newStar);
  powerUps = Array.from({length: 5}, newPowerUp);
}
reset();
api.onFrame = (dt, keys) => {
  if (keys.Space && !wasSpace) reset();
  wasSpace = !!keys.Space;
  speedTimer = Math.max(0, speedTimer - dt);
  shieldTimer = Math.max(0, shieldTimer - dt);
  const speed = speedTimer > 0 ? 225 : 150;
  x += ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * speed * dt;
  y += ((keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)) * speed * dt;
  x = Math.max(10, Math.min(470, x));
  y = Math.max(65, Math.min(270, y));
  for (let i = 0; i < stars.length; i++) {
    if (Math.hypot(x - stars[i].x, y - stars[i].y) < 13) {
      score++; stars[i] = newStar();
    }
  }
  for (let i = 0; i < powerUps.length; i++) {
    const item = powerUps[i];
    if (Math.hypot(x - item.x, y - item.y) < 16) {
      if (item.type === "speed") speedTimer = 5;
      else shieldTimer = 5;
      api.log(item.type + " pickup: 5 seconds");
      powerUps[i] = newPowerUp();
    }
  }
  api.clear("#000000");
  api.text("Stars: " + score + " | Arrows move | Space resets", 10, 20, "#ffffff");
  api.text("Cyan = speed boost, blue = shield glow (no hazards)", 10, 39, "#cccccc");
  api.text("Boost: " + speedTimer.toFixed(1) + "s | Glow: " + shieldTimer.toFixed(1) + "s", 10, 57, "#ffffff");
  for (const star of stars) api.circle(star.x, star.y, star.r, "#ffffff");
  for (const item of powerUps) api.circle(item.x, item.y, item.r, item.type === "speed" ? "#00ffff" : "#4488ff");
  if (shieldTimer > 0) api.circle(x, y, 14, "#4488ff");
  api.circle(x, y, 10, "#ffff00");
};`;
export function sandboxCode(value:string):string{
 const code=value.trim().replace(/^```(?:javascript|js)?\s*\n([\s\S]*?)\n```$/i,'$1');
 if(!code||code.length>16000&&!readGameProject(code))throw Error('Use 1–16,000 characters of JavaScript.');return code;
}
/** Parse only; never invoke the generated function or run user code in the app window. */
export function checkedSandboxDraft(value:string):string{
 const cleaned=value.replace(/^(?:\s*<think>[\s\S]*?<\/think>\s*)+/,'').trim();
 const source=cleaned.startsWith('{')?bundleGameProject(JSON.parse(cleaned)):sandboxCode(cleaned);
 try{new Function('api','"use strict";\n'+source);}catch(error){throw Error('Draft has a JavaScript syntax error: '+String(error)+'. Previous source kept.');}
 return source;
}
export const SANDBOX_WORKER=`
const send = self.postMessage.bind(self);
let started=false, frame=null, commands=[],logs=[];
const number=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000;
const color=c=>typeof c==='string'&&/^#[0-9a-f]{3,8}$/i.test(c)?c:'#ffffff';
function draw(type,args){if(commands.length>=200)throw Error('Too many drawing commands.');commands.push({type,args});}
const progressValue=${gameProgressValue.toString()};
let progress=null,progressStatus='ready',lastSave=-Infinity;
let mouse={x:0,y:0,inside:false,down:false,clicked:false,released:false};
const api={
 loadProgress(fallback={}){return progressValue(progress??fallback);},
 saveProgress(value){if(Date.now()-lastSave<20){progressStatus='error';return false;}const clean=progressValue(value);lastSave=Date.now();progress=clean;progressStatus='pending';send({type:'saveProgress',value:clean});return true;},
 get progressStatus(){return progressStatus;},
 ...(${createTileTools.toString()})((x,y,w,h,c)=>draw('rect',[x,y,w,h,color(c)])),
 get mouse(){return {...mouse};},
 button(label,x,y,w,h){if(![x,y,w,h].every(number)||w<=0||h<=0)return false;const hover=mouse.inside&&mouse.x>=x&&mouse.x<x+w&&mouse.y>=y&&mouse.y<y+h;draw('rect',[x,y,w,h,hover?'#ed8ab5':'#46536e']);draw('text',[String(label).slice(0,160),x+10,y+h/2+5,'#ffffff']);return hover&&mouse.clicked;},
 clear(c){draw('clear',[color(c)]);},
 rect(x,y,w,h,c){if([x,y,w,h].every(number))draw('rect',[x,y,w,h,color(c)]);},
 circle(x,y,r,c){if([x,y,r].every(number)&&r>=0)draw('circle',[x,y,r,color(c)]);},
 sprite(name,sx,sy,sw,sh,x,y,w,h){if(typeof name!=='string'||name.length>80||![sx,sy,sw,sh,x,y,w,h].every(number)||![sx,sy,sw,sh].every(Number.isInteger)||sx<0||sy<0||sw<=0||sh<=0||sx+sw>2048||sy+sh>2048||w<=0||h<=0)throw Error('Invalid sprite rectangle.');draw('sprite',[name,sx,sy,sw,sh,x,y,w,h]);},
 animationFrame(seconds,fps,count,loop=true){if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(fps)||fps<=0||fps>60||!Number.isInteger(count)||count<1||count>256)throw Error('Use nonnegative animation time, 1–60 fps and 1–256 frames.');const index=Math.floor(seconds*fps);return loop?index%count:Math.min(count-1,index);},
 image(name,x,y,w,h){if(typeof name==='string'&&name.length<=80&&[x,y,w,h].every(number))draw('image',[name,x,y,w,h]);},
 sound(name,volume=0.5){if(typeof name==='string'&&name.length<=80&&number(volume)&&volume>=0&&volume<=1&&commands.filter(c=>c.type==='sound').length<2)draw('sound',[name,volume]);},
 text(t,x,y,c){if(number(x)&&number(y))draw('text',[String(t).slice(0,160),x,y,color(c)]);},
 log(t){if(logs.length<8)logs.push(String(t).slice(0,300));},
 set onFrame(fn){if(typeof fn!=='function')throw Error('onFrame must be a function.');frame=fn;}
};
self.onmessage=e=>{try{
 const m=e.data;
 if(m.type==='progressResult'){progressStatus=m.ok?'saved':'error';}
 else if(m.type==='start'&&!started){started=true;progress=m.progress===undefined?null:progressValue(m.progress);new Function('api','"use strict";\\n'+m.code)(api);if(!frame)throw Error('Set api.onFrame to run a game.');send({type:'ready'});}
 else if(m.type==='tick'&&started){commands=[];logs=[];const p=m.mouse;mouse={x:p&&number(p.x)?Math.max(0,Math.min(480,p.x)):0,y:p&&number(p.y)?Math.max(0,Math.min(280,p.y)):0,inside:p?.inside===true,down:p?.down===true,clicked:p?.clicked===true,released:p?.released===true};frame(m.dt,m.keys,mouse);send({type:'frame',commands,logs});}
}catch(error){send({type:'error',error:String(error).slice(0,500)});}};
`;
export function sandboxFrame():string{
 const worker=JSON.stringify(SANDBOX_WORKER).replace(/</g,'\\u003c');
 return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><script>
 let worker=null;
 const relay=e=>{if(e.source!==parent)return;const m=e.data;if(m.type==='start'){if(worker)worker.terminate();const url=URL.createObjectURL(new Blob([${worker}],{type:'text/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);worker.onmessage=e=>parent.postMessage(e.data,'*');worker.onerror=()=>parent.postMessage({type:'error',error:'Game worker failed to start.'},'*');worker.postMessage(m);}else if(m.type==='stop'&&worker){worker.terminate();worker=null;}else if(m.type==='tick'&&worker)worker.postMessage(m);};
 addEventListener('message',relay);parent.postMessage({type:'boot'},'*');
 </script>`;
}
export interface SandboxFrameResult{commands:{type:string;args:(number|string)[]}[];logs:string[]}
/** Validate the untrusted worker's drawing protocol before touching canvas. */
export function validateSandboxFrame(value:unknown):SandboxFrameResult{
 const v=value as SandboxFrameResult;
 if(!v||!Array.isArray(v.commands)||v.commands.length>200||!Array.isArray(v.logs)||v.logs.length>8)throw Error('Invalid game output.');
 for(const c of v.commands){if(!c||!Array.isArray(c.args))throw Error('Invalid drawing command.');const counts:Record<string,number>={clear:1,rect:5,circle:4,text:4,image:5,sound:2,sprite:9};if(!Object.prototype.hasOwnProperty.call(counts,c.type)||c.args.length!==counts[c.type])throw Error('Unsupported drawing command.');
 if(c.type==='image'||c.type==='sprite'||c.type==='sound'){if(typeof c.args[0]!=='string'||!/^[-a-zA-Z0-9_]+\.(png|jpg|jpeg|wav|mp3)$/i.test(c.args[0])||c.args.slice(1).some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>10000)||c.type==='sound'&&(Number(c.args[1])<0||Number(c.args[1])>1))throw Error('Invalid asset command.');if(c.type==='sprite'&&(!c.args.slice(1,5).every(Number.isInteger)||Number(c.args[1])<0||Number(c.args[2])<0||Number(c.args[3])<=0||Number(c.args[4])<=0||Number(c.args[1])+Number(c.args[3])>2048||Number(c.args[2])+Number(c.args[4])>2048||Number(c.args[7])<=0||Number(c.args[8])<=0))throw Error('Invalid sprite rectangle.');continue;}
 const color=c.args[c.args.length-1];if(typeof color!=='string'||!/^#[0-9a-f]{3,8}$/i.test(color))throw Error('Invalid color.');
 const nums=c.type==='clear'?[]:c.type==='text'?c.args.slice(1,-1):c.args.slice(0,-1);
 if(nums.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>10000)||c.type==='circle'&&Number(c.args[2])<0||c.type==='text'&&(typeof c.args[0]!=='string'||c.args[0].length>160))throw Error('Invalid coordinates.');}
 if(v.commands.filter(c=>c.type==='sound').length>2)throw Error('Too many sounds.');
 if(v.logs.some(l=>typeof l!=='string'||l.length>300))throw Error('Invalid game log.');return v;
}
export const SANDBOX_INSTRUCTIONS='Return only JavaScript, under 16000 characters. No HTML, imports, fetch, DOM, timers or external libraries. This is a 480x280 canvas game. Set api.onFrame=(dt,keys,mouse)=>{...}, called 30 times/second with seconds dt and keys.ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Space booleans. Mouse has x/y in 480x280 canvas coordinates, inside, down, clicked/released one-frame pulses. api.mouse also exposes it. api.button(label,x,y,w,h) draws a button and returns true on a primary click inside; use its return for menus. Never implement a repeated click from mouse.down. Sprite sheets: api.sprite(imageName,sx,sy,frameWidth,frameHeight,x,y,drawWidth,drawHeight) crops integer pixel rectangles inside the image; sizes must be positive. api.animationFrame(elapsedSeconds,fps,frameCount,loop=true) picks an index; fps <=60, frames <=256. Accumulate dt outside state changes, reset elapsed on animation change. Use loop=false for a one-shot reaction. Tiles/collision: api.tileMap(rows,tileSize,offsetX=0,offsetY=0) accepts rectangular ASCII strings (max 256 cells, 32 per side), # is solid, other characters open. map.draw(hexColor) draws walls. map.move({x,y,w,h},dx,dy) returns a NEW box with hitX/hitY, slides along walls and treats map edges as solid; start clear of walls, assign the result to persistent state. api.overlaps(boxA,boxB) detects positive-area overlap. No gravity is automatic. Progress: api.loadProgress(defaultObject) returns a local saved JSON object; api.saveProgress(object) requests a save (max4096 chars, depth8, at most once per game frame). Save on milestones/settings changes, never every frame. api.progressStatus is ready/pending/saved/error; only saved confirms host acceptance. Do not store personal information. Drawing calls: api.clear(hexColor), api.rect(x,y,width,height,hexColor), api.circle(x,y,radius,hexColor), api.text(text,x,y,hexColor), api.log(text). Colors must be hex. Max 200 drawing commands and 8 short logs per frame. Keep state in top-level let variables. Always redraw the scene each frame. Include simple visible instructions, score and a playable objective. Do not claim it has run or been tested. A bounded isolated smoke check tests startup and simulated frames; it does not establish correctness. The user reviews the source and explicitly presses Run to play.';

export function sandboxDraftInstructions():string{
 return SANDBOX_INSTRUCTIONS+'\nCRITICAL: api.onFrame is called repeatedly. Initialize player position, score, arrays of objects and reset-key latch OUTSIDE the callback. Never reinitialize them at the start of each frame. Inside onFrame only update persistent state, handle input and draw. Multiply movement speed by dt. Reset state only on an explicit restart, and trigger Space reset on a press edge rather than every held frame. Adapt this working example to the user request, retaining its state lifetime pattern:\n'+SANDBOX_EXAMPLE;
}
