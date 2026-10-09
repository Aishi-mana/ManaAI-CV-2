import type {Thoughts,Thought} from '../core/thoughts';

export default function ThoughtsDrawer({name,state,draft,generating,ready,error,onState,onGenerate,onStop,onSave,onClose}:{name:string;state:Thoughts;draft:Thought|null;generating:boolean;ready:boolean;error:string;onState:(state:Thoughts)=>void;onGenerate:()=>void;onStop:()=>void;onSave:()=>void;onClose:()=>void}){
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Simulated thoughts"><header className="drawer-head"><h2>{name}'s thoughts</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <p>Short simulated character reflections, generated only when you ask. These are separate from chat, memories and diary entries. Nothing is generated while the app is closed.</p>
 <label className="check"><input type="checkbox" checked={state.enabled} disabled={generating} onChange={e=>onState({...state,enabled:e.target.checked})}/>Enable simulated thoughts</label>
 <button className="btn" disabled={!state.enabled||!ready||generating||!!draft||state.entries.length>=100} onClick={onGenerate}>Draft a thought</button>
 {generating&&<p role="status">Writing a short reflection… <button className="btn" onClick={onStop}>Stop</button></p>}
 {error&&<p className="msg-error" role="alert">{error}</p>}
 {draft&&<article className="memory-card"><h3>Review thought</h3><p className="memory-content">{draft.text}</p><button className="btn" disabled={generating} onClick={onSave}>Save thought</button><button className="btn" disabled={generating} onClick={onClose}>Close without saving</button></article>}
 <h3>Saved thoughts ({state.entries.length}/100)</h3><p className="hint-soft">No automatic pruning. Delete an old thought to make room.</p>
 {[...state.entries].reverse().map(entry=><article className="memory-card" key={entry.id}><p className="hint-soft">{new Date(entry.createdAt).toLocaleString()} · Mood: {entry.mood}</p><p className="memory-content">{entry.text}</p><details><summary>Recorded conversation ({entry.sources.length} excerpts)</summary>{entry.sources.map(s=><div key={s.id}><b>{s.role==='user'?'You':name}</b><p className="memory-content">{s.text}</p></div>)}</details><button className="btn" disabled={generating} onClick={()=>{if(window.confirm('Permanently delete this saved thought?'))onState({...state,entries:state.entries.filter(e=>e.id!==entry.id)});}}>Delete thought</button></article>)}
 </div></section></>;
}
