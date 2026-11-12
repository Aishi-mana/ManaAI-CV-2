import { STAR_COLLECTOR_MARKER, STAR_COLLECTOR_FRAMES, starCollectorCheck, starCollectorKeys } from "./starCollectorCheck";
import {readGameProject} from './gameProject';
import {checkedSandboxDraft,sandboxFrame,validateSandboxFrame} from './codeSandbox';
import type {GameRunEvidence,GameRunReason} from './codeGames';
import type {GameGenre} from './gameDev';
export interface SmokeCheckResult{passed:boolean;warnings:string[];evidence:GameRunEvidence}
export const SMOKE_FRAMES=92;
export function smokeKeys(frame:number):Record<string,boolean>{
 if(frame<10)return {};if(frame<30)return {ArrowRight:true};if(frame<50)return {ArrowDown:true};if(frame<70)return {ArrowLeft:true};if(frame<90)return {ArrowUp:true};return frame===90?{Space:true}:{};
}
export function smokeMouse(frame:number){return {x:frame<4?240:250,y:frame<4?124:140,inside:true,down:frame===2||frame===4,clicked:frame===2||frame===4,released:frame===3||frame===5};}
const genreKeys:Record<GameGenre,readonly (readonly string[])[]>={
 Puzzle:[['ArrowLeft'],['ArrowUp'],['ArrowRight'],['Space']],
 Platformer:[['ArrowRight'],['ArrowRight','Space'],['ArrowLeft'],['ArrowLeft','Space']],
 Arcade:[['ArrowRight','Space'],['ArrowDown'],['ArrowLeft','Space'],['ArrowUp']],
 Strategy:[['ArrowUp'],['Space'],['ArrowRight'],['Space']],
 Adventure:[['ArrowUp'],['ArrowRight'],['Space'],['ArrowDown']],
 Rhythm:[['ArrowLeft'],['ArrowDown'],['ArrowUp'],['ArrowRight']],
 Racing:[['ArrowUp'],['ArrowUp','ArrowLeft'],['ArrowUp','ArrowRight'],['ArrowDown']],
 Simulation:[['Space'],['ArrowRight'],['ArrowDown'],['Space']],
};
export function genreSmokeKeys(genre:GameGenre,frame:number):Record<string,boolean>{
 if(frame===90)return {Space:true};
 if(frame<10||frame>=90)return {};
 const offset=frame-10;
 if(genre==='Rhythm'&&offset%20>=2)return {};
 return Object.fromEntries(genreKeys[genre][Math.floor(offset/20)].map(key=>[key,true]));
}
/** Executes only in the existing opaque-frame worker, never in the app window. */
export async function checkGameSmoke(value:string,signal?:AbortSignal,genre?:GameGenre):Promise<SmokeCheckResult>{
 const code=checkedSandboxDraft(value);const collector=code.startsWith(STAR_COLLECTOR_MARKER+'\n');const verify=collector?starCollectorCheck():undefined;const frameLimit=collector?STAR_COLLECTOR_FRAMES:SMOKE_FRAMES;if(document.visibilityState==='hidden')throw Error('Smoke check requires Mana to be visible.');if(signal?.aborted)throw new DOMException('Check cancelled.','AbortError');
 return new Promise((resolve,reject)=>{
  const startedAt=new Date().toISOString(),start=performance.now(),element=document.createElement('iframe');
  element.setAttribute('sandbox','allow-scripts');element.setAttribute('title','Game smoke check');element.hidden=true;element.srcdoc=sandboxFrame();
  let phase:'boot'|'starting'|'frame'='boot',deadline=start+2500,done=false,frames=0,drawFrames=0,changedFrames=0,lastDraw='',logs:string[]=[];
  const keys=new Set<string>();
  const dispose=()=>{window.removeEventListener('message',receive);document.removeEventListener('visibilitychange',hide);signal?.removeEventListener('abort',abort);clearInterval(timer);element.contentWindow?.postMessage({type:'stop'},'*');element.remove();};
  const finish=(passed:boolean,reason:GameRunReason,detail:string)=>{if(done)return;done=true;const warnings:string[]=[];
   if(passed&&!collector&&changedFrames===0)warnings.push('No drawing changes were observed during simulated input. Check controls and movement manually.');
   dispose();resolve({passed,warnings,evidence:{code,checkKind:collector?'star-collector':'smoke',startedAt,endedAt:new Date(Math.max(Date.now(),Date.parse(startedAt))).toISOString(),elapsedMs:Math.round(Math.max(0,Math.min(86400000,performance.now()-start))),frames,keysUsed:[...keys].sort(),reason,detail:(detail+(warnings.length?' '+warnings.join(' '):'')).slice(0,600),logs}});
  };
  const abort=()=>{if(done)return;done=true;dispose();reject(new DOMException('Check cancelled.','AbortError'));};
  const hide=()=>{if(document.visibilityState==='hidden')finish(false,'hidden','Smoke check stopped while Mana was hidden.');};
  const tick=()=>{const input=collector?starCollectorKeys(frames):genre?genreSmokeKeys(genre,frames):smokeKeys(frames);Object.keys(input).forEach(k=>keys.add(k));phase='frame';deadline=performance.now()+750;element.contentWindow?.postMessage({type:'tick',dt:1/30,keys:input,mouse:collector?undefined:smokeMouse(frames)},'*');};
  const receive=(event:MessageEvent)=>{if(done||event.source!==element.contentWindow)return;const m=event.data;
   try{
    if(m?.type==='saveProgress'){element.contentWindow?.postMessage({type:'progressResult',ok:false},'*');}
    else if(m?.type==='boot'&&phase==='boot'){phase='starting';deadline=performance.now()+1500;element.contentWindow?.postMessage({type:'start',code},'*');}
    else if(m?.type==='ready'&&phase==='starting')tick();
    else if(m?.type==='frame'&&phase==='frame'){
     const result=validateSandboxFrame(m);verify?.(frames,result.commands);for(const command of result.commands){if(command.type==='image'||command.type==='sprite'||command.type==='sound'){const asset=readGameProject(code)?.assets?.find(a=>a.name===command.args[0]);if(!asset||!asset.data.startsWith(command.type!=='sound'?'data:image/':'data:audio/'))throw Error('Missing or incorrect asset: '+command.args[0]);}}const visible=result.commands.filter(c=>c.type!=='sound'),drawing=JSON.stringify(visible);
     if(visible.length)drawFrames++;if(frames>0&&drawing!==lastDraw)changedFrames++;lastDraw=drawing;logs=[...logs,...result.logs].slice(-30);frames++;
     if(frames>=frameLimit){if(collector){finish(true,'stopped','Star Collector passed arrow-key movement, star collection, scoring, win and restart checks.');return;}finish(drawFrames>0,drawFrames?'stopped':'error',drawFrames?`Smoke check completed startup and 92 simulated frames with ${genre?genre.toLowerCase()+' keyboard':'keyboard'} and pointer input without a runtime error. Playability still needs a manual test.`:'Smoke check produced no drawing commands.');}else tick();
    }else if(m?.type==='error')finish(false,'error','Smoke check runtime error: '+String(m.error).slice(0,450));
   }catch(error){finish(false,'error','Smoke check failed: '+String(error).slice(0,450));}
  };
  const timer=setInterval(()=>{const now=performance.now();if(now>start+8000||now>deadline)finish(false,'timeout','Smoke check stopped: game took too long to respond.');},50);
  window.addEventListener('message',receive);document.addEventListener('visibilitychange',hide);signal?.addEventListener('abort',abort,{once:true});
  document.body.appendChild(element);
 });
}
