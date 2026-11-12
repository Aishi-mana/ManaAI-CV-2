import {useEffect,useRef,useState} from 'react';
import {open} from '@tauri-apps/plugin-dialog';
import CodePlayground from './CodePlayground';
import {developmentAttempts,developmentDue,GAME_DEV_GENRES,GAME_DEV_LIMIT,GAME_DEV_STEPS,type DailyAttempts,type GameDevState} from '../core/gameDev';
import {inTauri} from '../core/useLlama';

export default function GameDevWorkspace({state,date,busy,ready,modelStatus,onSettings,onWork,onPublish,onStop,onClose,onPlaying}:{
 state:GameDevState;date:string;busy:boolean;ready:boolean;modelStatus:string;
 onSettings:(settings:Partial<Pick<GameDevState,'developmentEnabled'|'playtestsEnabled'|'developmentPerDay'|'playsPerDay'|'diary'|'developmentModelPath'>>)=>void;
 onWork:(target?:string)=>void;onPublish:(id:string)=>void;onStop:()=>void;onClose:()=>void;onPlaying:(playing:boolean)=>void;
}){
 const [tab,setTab]=useState<'projects'|'published'>('projects');
 const [selected,setSelected]=useState('');
 const details=useRef<HTMLDialogElement>(null);
 const [playing,setPlaying]=useState(false);
 const [modelError,setModelError]=useState('');
 const projects=state.projects.filter(project=>!!project.publishedAt===(tab==='published'));
 const active=projects.find(project=>project.id===selected);
 useEffect(()=>{
  const panel=details.current;
  if(active&&panel&&!panel.open)panel.showModal();
 },[active]);
 const awaitingReview=!!active?.genre&&active.step===2;
 const isProjects=tab==='projects';
 const enabledKey=isProjects?'developmentEnabled':'playtestsEnabled';
 const attemptsKey=isProjects?'developmentPerDay':'playsPerDay';
 const due=developmentDue(state,date);
 async function chooseModel(){
  setModelError('');
  try{
   const path=await open({multiple:false,filters:[{name:'GGUF model',extensions:['gguf']}]});
   if(typeof path==='string')onSettings({developmentModelPath:path});
  }catch{
   setModelError('Could not open the model picker.');
  }
 }
 return <section className="wardrobe-workspace game-dev" role="dialog" aria-label="Mana's Game Dev">
  <header className="drawer-head"><h2>Mana's Game Dev</h2><button className="btn" onClick={onClose}>Back to chat</button></header>
  <main className="game-dev-content">
   <div className="builder-actions" role="group" aria-label="Game Dev views">
    <button className={tab==='projects'?'btn primary':'btn'} aria-pressed={tab==='projects'} disabled={playing} onClick={()=>setTab('projects')}>Projects</button>
    <button className={tab==='published'?'btn primary':'btn'} aria-pressed={tab==='published'} disabled={playing} onClick={()=>setTab('published')}>Published</button>
   </div>
   <details key={tab} className="wardrobe-fold"><summary>{isProjects?'Development schedule':'Playtest schedule'}</summary><div className="wardrobe-fold-content">
    <label className="check"><input type="checkbox" checked={state[enabledKey]} disabled={busy} onChange={event=>onSettings({[enabledKey]:event.target.checked})}/>{isProjects?'Develop automatically':'Playtest automatically'}</label>
    <label className="field">{isProjects?'Development attempts per day':'Playtest attempts per day'}<select value={state[attemptsKey]} disabled={busy} onChange={event=>onSettings({[attemptsKey]:Number(event.target.value) as DailyAttempts})}>
     {[1,2,3].map(count=><option key={count} value={count}>{count}</option>)}
    </select></label>
    <p className="hint-soft">{isProjects?'Automatic development runs while Mana is visible and idle. Failed checks count as attempts.':'Playtests run while Mana is visible and idle and are spaced across the day. Missed slots do not pile up.'}</p>
   </div></details>
   {isProjects&&<details className="wardrobe-fold"><summary>Development model</summary><div className="wardrobe-fold-content">
    <p title={state.developmentModelPath}>{state.developmentModelPath?.split(/[\\/]/).pop()??'Use active chat model'}</p>
    <div className="builder-actions">
     <button className="btn" disabled={busy||!inTauri} onClick={()=>void chooseModel()}>Choose GGUF model</button>
     {state.developmentModelPath&&<button className="btn" disabled={busy} onClick={()=>onSettings({developmentModelPath:undefined})}>Use chat model</button>}
    </div>
    <p className="hint-soft">Start the chat model from Mana to switch models for drafting. Mana restores it when drafting ends.</p>
    {modelError&&<p role="alert">{modelError}</p>}
   </div></details>}
   <label className="check"><input type="checkbox" checked={state.diary} disabled={busy} onChange={event=>onSettings({diary:event.target.checked})}/>Include development and playtests in Mana's diary</label>
   {tab==='projects'&&<div className="builder-actions">
    <button className="btn primary" disabled={!ready||busy||!due} onClick={()=>onWork()}>Work on today's project</button>
    {!!projects.length&&<button className="btn" disabled={!ready||busy||!due||state.projects.length>=GAME_DEV_LIMIT} onClick={()=>onWork('new')}>Start a genre project</button>}
    <span role="status">{modelStatus||(busy?'Game Dev is running.':`${developmentAttempts(state,date)} of ${state.developmentPerDay} development attempts used today`)}</span>
   </div>}
   {busy&&<button className="btn" onClick={onStop}>Stop Game Dev</button>}
   {isProjects&&<p className="hint-soft">Mana invents a game from one of {GAME_DEV_GENRES.length} genres · {GAME_DEV_GENRES.join(', ')}</p>}
   {projects.length?<div className="game-dev-grid" role="group" aria-label={isProjects?'Projects':'Published games'}>
    {projects.map(project=><button key={project.id} className="btn game-dev-card" aria-haspopup="dialog" onClick={()=>setSelected(project.id)}>
     <strong>{project.title}</strong>
     <span>{project.genre&&project.genre+' · '}{project.publishedAt?'Published':project.genre&&project.step===2?'Ready for review':GAME_DEV_STEPS[project.step]}</span>
     {project.theme&&<span>{project.theme}</span>}
    </button>)}
   </div>:<p>{isProjects?'Mana has no ongoing project.':'Mana has no published games yet.'}</p>}
   {active&&<dialog ref={details} className="game-dev-details" aria-labelledby="game-dev-detail-title" onClose={()=>setSelected('')}>
    <header className="drawer-head"><h2 id="game-dev-detail-title">{active.title}</h2>
     <button className="btn" onClick={()=>details.current?.close()}>Close details</button></header>
    <div className="drawer-body">
     {active.theme&&<p>{active.theme}</p>}
     <p>{active.genre&&active.genre+' · '}{active.publishedAt?'Published in Mana’s local library':awaitingReview?'Ready for playability review':GAME_DEV_STEPS[active.step]}</p>
     <div className="builder-actions">
      {isProjects&&!awaitingReview&&<button className="btn" disabled={!ready||busy||playing||!due} onClick={()=>onWork(active.id)}>Continue project</button>}
      {awaitingReview&&<button className="btn" disabled={busy||playing} onClick={()=>onPublish(active.id)}>Confirm playable and publish</button>}
      {busy&&<button className="btn" onClick={onStop}>Stop Game Dev</button>}
     </div>
     {busy&&<p role="status">{modelStatus||'Game Dev is running.'}</p>}
     {active.code?<CodePlayground key={active.id+active.step} playOnly runLabel="Play test" code={active.code} onCode={()=>{}} generating={busy} onRunning={running=>{setPlaying(running);onPlaying(running);}}/>:<p>A playable draft will appear here after the first successful build.</p>}
     <h4>Development and playtest notes</h4>
     {[...state.notes].reverse().filter(note=>note.projectId===active.id).map(note=><p key={note.id}><small>{new Date(note.createdAt).toLocaleString()}{note.model&&' · Model reported by server: '+note.model}</small> · {note.text}</p>)}
    </div>
   </dialog>}
  </main>
 </section>;
}
