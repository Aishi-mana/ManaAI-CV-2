import {GAME_PROGRESS_EXAMPLE} from '../core/gameProgressExample';
import {flushPersistence,persistenceStatus} from '../core/persistence';
import {readGameProgress,writeGameProgress} from '../core/codeGames';
import {gameProgressScope} from '../core/gameProgress';
import {createGamePointer,MOUSE_GAME_EXAMPLE} from '../core/gamePointer';
import {createGameMedia} from '../core/gameMedia';
import GameProjectEditor from './GameProjectEditor';
import {readGameProject} from '../core/gameProject';
import type {GameRunEvidence,GameRunReason} from '../core/codeGames';
import {useEffect,useRef,useState} from 'react';
import {SANDBOX_EXAMPLE,SANDBOX_POWERUP_EXAMPLE,sandboxCode,sandboxFrame,validateSandboxFrame} from '../core/codeSandbox';
interface Props{progressScope?:string;busyLabel?:string;code:string;onCode:(value:string)=>void;generating?:boolean;onGenerate?:(request:string)=>void;onStopGeneration?:()=>void;canGenerate?:boolean;onRunning?:(running:boolean)=>void;onRunFinished?:(evidence:GameRunEvidence)=>void;beforeRun?:()=>boolean}
export default function CodePlayground(p:Props){
 const [running,setRunning]=useState(false),[status,setStatus]=useState('Ready. Review the code, then Run.'),[logs,setLogs]=useState<string[]>([]),[request,setRequest]=useState('Make a small star-collecting game using arrow keys.');
 const pointer=useRef<ReturnType<typeof createGamePointer>|null>(null);
 const media=useRef<ReturnType<typeof createGameMedia>|null>(null);
 const latest=useRef(p);latest.current=p;
 const evidence=useRef<{code:string;startedAt:string;start:number;frames:number;mouseClicks:number;keys:Set<string>;logs:string[]}|null>(null);
 useEffect(()=>{p.onRunning?.(running);},[running,p.onRunning]);
 function finishEvidence(reason:GameRunReason,detail:string){const run=evidence.current;if(!run)return;evidence.current=null;latest.current.onRunFinished?.({code:run.code,startedAt:run.startedAt,endedAt:new Date(Math.max(Date.now(),Date.parse(run.startedAt))).toISOString(),elapsedMs:Math.round(Math.min(86400000,Math.max(0,performance.now()-run.start))),frames:run.frames,keysUsed:[...run.keys].sort(),reason,detail:(detail+' Pointer clicks sent: '+run.mouseClicks+'.').slice(0,600),logs:run.logs});}
 const canvas=useRef<HTMLCanvasElement>(null),frame=useRef<HTMLIFrameElement|null>(null),timer=useRef<ReturnType<typeof setInterval>|undefined>(undefined),keys=useRef<Record<string,boolean>>({}),cleanup=useRef<(()=>void)|null>(null);
 function stop(reason='Stopped.',kind:GameRunReason='stopped'){pointer.current?.stop();pointer.current=null;media.current?.stop();media.current=null;finishEvidence(kind,reason);cleanup.current?.();cleanup.current=null;frame.current?.contentWindow?.postMessage({type:'stop'},'*');frame.current?.remove();frame.current=null;clearInterval(timer.current);keys.current={};setRunning(false);setStatus(reason);}
 useEffect(()=>()=>{pointer.current?.stop();media.current?.stop();finishEvidence('closed','Playground closed.');latest.current.onRunning?.(false);cleanup.current?.();frame.current?.contentWindow?.postMessage({type:'stop'},'*');frame.current?.remove();clearInterval(timer.current);},[]);
 function run(){if(latest.current.beforeRun&&!latest.current.beforeRun())return;stop();let code:string;try{code=sandboxCode(p.code);}catch(e){setStatus(String(e));return;}
  if(canvas.current)pointer.current=createGamePointer(canvas.current);
  media.current=createGameMedia(readGameProject(code)?.assets??[]);
  const drawing=canvas.current?.getContext('2d');if(drawing){drawing.fillStyle='#202637';drawing.fillRect(0,0,480,280);}
  evidence.current={code,startedAt:new Date().toISOString(),start:performance.now(),frames:0,mouseClicks:0,keys:new Set(),logs:[]};
  const element=document.createElement('iframe');element.setAttribute('sandbox','allow-scripts');element.setAttribute('title','Isolated game execution');element.hidden=true;element.srcdoc=sandboxFrame();frame.current=element;
  const scope=p.progressScope??gameProgressScope(code);
  let lastProgressSave=-Infinity;
  let deadline=performance.now()+3000,ends=performance.now()+120000,waiting=true,ready=false,last=performance.now();
  const receive=async(event:MessageEvent)=>{if(event.source!==element.contentWindow||frame.current!==element)return;const message=event.data;
   try{
    if(message?.type==='saveProgress'){try{if(Date.now()-lastProgressSave<20)throw Error('Save too frequently.');lastProgressSave=Date.now();writeGameProgress(scope,message.value);await flushPersistence();if(persistenceStatus().error)throw Error(persistenceStatus().error);if(frame.current!==element)return;element.contentWindow?.postMessage({type:'progressResult',ok:true},'*');}catch(error){element.contentWindow?.postMessage({type:'progressResult',ok:false},'*');setStatus('Progress could not be saved: '+String(error));}}
    else if(message?.type==='boot'&&!ready){ready=true;deadline=performance.now()+1500;element.contentWindow!.postMessage({type:'start',code,progress:readGameProgress(scope)},'*');}
    else if(message?.type==='ready'&&waiting){waiting=false;setStatus('Running · click the game and use arrow keys.');}
    else if(message?.type==='frame'&&waiting){const result=validateSandboxFrame(message),ctx=canvas.current?.getContext('2d');if(!ctx)return;
     for(const c of result.commands){const a=c.args;if(c.type==='image'||c.type==='sprite'||c.type==='sound'){media.current?.draw(ctx,c.type,a);continue;}ctx.fillStyle=String(a[a.length-1]);if(c.type==='clear')ctx.fillRect(0,0,480,280);else if(c.type==='rect')ctx.fillRect(Number(a[0]),Number(a[1]),Number(a[2]),Number(a[3]));else if(c.type==='circle'){ctx.beginPath();ctx.arc(Number(a[0]),Number(a[1]),Number(a[2]),0,Math.PI*2);ctx.fill();}else{ctx.font='16px sans-serif';ctx.fillText(String(a[0]),Number(a[1]),Number(a[2]));}}
     if(evidence.current){evidence.current.frames++;evidence.current.logs=[...evidence.current.logs,...result.logs].slice(-30);}
     if(result.logs.length)setLogs(previous=>[...previous,...result.logs].slice(-30));waiting=false;
    }else if(message?.type==='error')stop('Game error: '+String(message.error).slice(0,500),'error');
   }catch(e){stop(String(e),'error');}
  };
  const hide=()=>{if(document.visibilityState==='hidden')stop('Stopped while Mana was hidden.','hidden');};
  window.addEventListener('message',receive);document.addEventListener('visibilitychange',hide);
  cleanup.current=()=>{window.removeEventListener('message',receive);document.removeEventListener('visibilitychange',hide);};
  setRunning(true);setLogs([]);setStatus('Starting isolated game…');document.body.appendChild(element);canvas.current?.focus();
  timer.current=setInterval(()=>{const now=performance.now();if(now>ends){stop('Session finished after two minutes. Run again to restart.','limit');return;}if(waiting){if(now>deadline)stop('Stopped: game took too long to respond.','timeout');return;}waiting=true;deadline=now+750;for(const key of Object.keys(keys.current))if(keys.current[key])evidence.current?.keys.add(key);const mouse=pointer.current?.take();if(mouse?.clicked&&evidence.current)evidence.current.mouseClicks++;element.contentWindow?.postMessage({type:'tick',dt:Math.min(.1,(now-last)/1000),keys:{...keys.current},mouse},'*');last=now;},33);
 }
 return <section className="code-playground"><p className="hint-soft">Small JavaScript canvas games. Runs separately from Mana’s controls, with network access blocked. Run is manual; Stop removes the running game. {p.onRunFinished?'Save a game version to keep source changes. Stop a run to review and save its report; unsaved run reports are discarded when this panel closes.':'This temporary copy does not change the saved work artifact. Use More → Code playground to save game versions and run reports.'}</p>
 {p.onGenerate&&<div className="playground-request"><label className="field">Ask Mana for a game<textarea maxLength={1000} rows={2} value={request} disabled={p.generating||running} onChange={e=>setRequest(e.target.value)}/></label><button className="btn" disabled={!p.canGenerate||p.generating||running||!request.trim()} onClick={()=>p.onGenerate?.(request)}>{p.generating?(p.busyLabel??'Drafting game…'):'Draft game'}</button>{p.generating&&<button className="btn" onClick={p.onStopGeneration}>{p.busyLabel?'Stop check':'Stop drafting'}</button>}</div>}
 <GameProjectEditor code={p.code} onCode={p.onCode} disabled={!!(running||p.generating)}/>{!readGameProject(p.code)&&<label className="field">JavaScript source<textarea className="playground-source" spellCheck={false} rows={10} maxLength={16000} value={p.code} disabled={running||p.generating} onChange={e=>p.onCode(e.target.value)}/></label>}
 <div className="builder-actions"><button className="btn" disabled={running||p.generating} onClick={()=>{if(window.confirm('Load saved-progress example? Unsaved source changes will be replaced.'))p.onCode(GAME_PROGRESS_EXAMPLE);}}>Load progress example</button><button className="btn" disabled={running||p.generating} onClick={()=>{if(window.confirm('Load mouse/button example? Unsaved source changes will be replaced.'))p.onCode(MOUSE_GAME_EXAMPLE);}}>Load mouse example</button><button className="btn" disabled={running||p.generating} onClick={()=>p.onCode(SANDBOX_EXAMPLE)}>Load example</button><button className="btn" disabled={running||p.generating} onClick={()=>p.onCode(SANDBOX_POWERUP_EXAMPLE)}>Load power-up example</button><button className="btn primary" disabled={running||p.generating||!p.code.trim()} onClick={run}>Run game</button><button className="btn" disabled={!running} onClick={()=>stop()}>Stop game</button></div>
 <p role="status">{status}</p><canvas ref={canvas} width={480} height={280} tabIndex={0} aria-label="Game canvas. Mouse clicks, arrow keys and Space are supported. Tab leaves the game." onBlur={()=>{keys.current={};pointer.current?.reset();}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();keys.current[e.key===' '?'Space':e.key]=true;}}} onKeyUp={e=>{keys.current[e.key===' '?'Space':e.key]=false;}}/>
 <details><summary>Game log ({logs.length})</summary><pre>{logs.join('\n')||'No game messages yet.'}</pre></details><details><summary>Supported game tools</summary><p className="hint-soft">480 × 280 canvas; api.onFrame(dt, keys, mouse), api.button(label,x,y,w,h), api.tileMap(rows,size,ox,oy), api.overlaps(a,b), api.sprite(name,sx,sy,sw,sh,x,y,w,h), api.animationFrame(seconds,fps,count,loop), api.clear(color), api.rect(x,y,w,h,color), api.circle(x,y,r,color), api.text(text,x,y,color), api.log(text). Use hex colors. Arrow keys and Space are provided only when the canvas has focus. Slow code is stopped; each run lasts up to two minutes. No HTML, external libraries or file access.</p></details>
 </section>;
}
