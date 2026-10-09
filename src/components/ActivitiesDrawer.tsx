import {useState} from 'react';
import ExportActivityButton from './ExportActivityButton';
import type {SharedActivities,SharedKind,SharedSession} from '../core/sharedActivities';
import {SHARED_LABELS,DEFAULT_ACTIVITY_PROMPTS,newSharedSession,wordChainTurn,addActivityContribution,activityTurnStatus} from '../core/sharedActivities';

function SessionCard({session,name,editable,modelReady,generating,preview,error,onUpdate,onGenerate,onStop}:{session:SharedSession;name:string;editable:boolean;modelReady:boolean;generating:boolean;preview:string;error:string;onUpdate:(s:SharedSession)=>void;onGenerate:()=>void;onStop:()=>void}){
 const [input,setInput]=useState(''),[notice,setNotice]=useState('');
 const waiting=session.turns[session.turns.length-1]?.role==='user';
 function contribute(){
  if(session.kind==='words'){const result=wordChainTurn(session,input);setNotice(result.error);if(!result.error){onUpdate(result.session);setInput('');}}
  else {const next=addActivityContribution(session,input);if(!next){setNotice('Finish the pending turn, or resume an active session first.');return;}onUpdate(next);setInput('');setNotice('');}
 }
 return <article className="memory-card"><strong>{SHARED_LABELS[session.kind]} · {session.status}</strong><p className="memory-content">{session.prompt}</p><p className="hint-soft">Started {new Date(session.createdAt).toLocaleString()} · {session.turns.length} saved turns</p>
 {session.kind==='words'&&<p className="hint-soft">Start each word with the last letter of the previous word. Use 3–20 English letters without repeats. Your spelling is not checked against a dictionary; Mana uses a built-in word list. This game works without the model.</p>}
 {session.kind==='story'&&<p className="hint-soft">Take turns writing one short paragraph. The last twelve turns are supplied to the model; older turns remain saved here. All events are fictional.</p>}
 {session.kind==='challenge'&&<p className="hint-soft">Write your response, then optionally ask for Mana's feedback. Completion is your choice; feedback is not a grade or proof of tested work.</p>}
 <details open><summary>Session transcript</summary>{session.turns.length?session.turns.map(turn=><div key={turn.id}><strong>{turn.role==='user'?'You':name}</strong><p className="memory-content">{turn.text}</p></div>):<p>Your turn first.</p>}</details>
 {session.result&&<p role="status">{session.result}</p>}
 <ExportActivityButton session={session} name={name} generating={generating}/>
 <p className="hint-soft">Export saves the prompt, status and saved turns to exports\activities. Unsaved input and unfinished replies are excluded.</p>
 {session.status==='active'&&(!waiting||session.kind==='words')&&!(session.kind==='challenge'&&session.turns.length>0)&&<><label className="field"><span>{session.kind==='words'?'Your next word':'Your contribution'}</span><textarea rows={session.kind==='words'?1:4} value={input} maxLength={session.kind==='words'?20:2000} disabled={!editable} onChange={e=>setInput(e.target.value)}/></label><button className="btn primary" disabled={!editable||!input.trim()} onClick={contribute}>{session.kind==='words'?'Play word':'Save your turn'}</button></>}
 {session.kind!=='words'&&session.status==='active'&&waiting&&<button className="btn primary" disabled={!modelReady||generating} onClick={onGenerate}>{session.kind==='story'?`Ask ${name} for the next paragraph`:`Ask ${name} for feedback`}</button>}
 {generating&&<><p role="status">{name} is writing...</p><p className="memory-content">{preview}</p><button className="btn" onClick={onStop}>Stop activity reply</button></>}
 {error&&<p className="msg-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {activityTurnStatus(session,generating)&&<p role="status">{activityTurnStatus(session,generating)}</p>}
 <div className="chips">{session.status==='active'?<><button className="btn" disabled={!editable} onClick={()=>onUpdate({...session,status:'paused'})}>Pause session</button><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Mark this activity session completed? Its transcript remains saved.'))onUpdate({...session,status:'completed'});}}>Finish session</button></>:<button className="btn" disabled={!editable||session.turns.length>=59||session.kind==='words'&&!!session.result} onClick={()=>onUpdate({...session,status:'active',result:undefined})}>Resume session</button>}</div>
 </article>;
}
export default function ActivitiesDrawer({name,state,editable,modelReady,generatingId,preview,error,onState,onGenerate,onStop,onClose}:{name:string;state:SharedActivities;editable:boolean;modelReady:boolean;generatingId:string|null;preview:string;error:string;onState:(state:SharedActivities)=>void;onGenerate:(id:string)=>void;onStop:()=>void;onClose:()=>void}){
 const session=state.sessions.find(s=>s.id===state.selectedId);
 const [kind,setKind]=useState<SharedKind>(session?.kind??'words'),[prompt,setPrompt]=useState(DEFAULT_ACTIVITY_PROMPTS[session?.kind??'words']),[notice,setNotice]=useState('');
 const sessions=state.sessions.filter(s=>s.kind===kind);
 function selectKind(next:SharedKind){setKind(next);setPrompt(DEFAULT_ACTIVITY_PROMPTS[next]);const latest=[...state.sessions].reverse().find(s=>s.kind===next);onState({...state,selectedId:latest?.id??null});setNotice('');}
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Shared activities"><header className="drawer-head"><h2>Activities with {name}</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body"><p className="hint-soft">Small text activities with saved sessions. Model replies share the normal model lock. Activities stay separate from chat, memory suggestions and diary sources, and do not automatically award bond or complete goals.</p>
 <div className="tabs">{(['words','story','challenge'] as const).map(k=><button key={k} className="tab" disabled={!editable} aria-pressed={kind===k} onClick={()=>selectKind(k)}>{SHARED_LABELS[k]}</button>)}</div>
 <label className="field"><span>{kind==='words'?'Starting word':'New session prompt'}</span><textarea rows={2} maxLength={500} value={prompt} disabled={!editable} onChange={e=>setPrompt(e.target.value)}/></label>
 <button className="btn" disabled={!editable||state.sessions.length>=50} onClick={()=>{const next=newSharedSession(kind,prompt);if(!next){setNotice('Use a starting word of 3–20 English letters, or a prompt up to 500 characters.');return;}onState({sessions:[...state.sessions,next],selectedId:next.id});setNotice('New session saved. Older sessions remain available below.');}}>Start new session</button>
 <p className="hint-soft">Up to 50 saved sessions; each has a bounded turn limit. Starting a new session preserves old transcripts.</p>{notice&&<p role="status">{notice}</p>}
 {!!sessions.length&&<label className="field"><span>Saved sessions ({sessions.length})</span><select disabled={!editable} value={session?.kind===kind?session.id:''} onChange={e=>onState({...state,selectedId:e.target.value||null})}><option value="">Choose a session</option>{[...sessions].reverse().map(s=><option key={s.id} value={s.id}>{s.prompt.slice(0,50)} · {s.status} · {new Date(s.createdAt).toLocaleString()}</option>)}</select></label>}
 {session?.kind===kind&&<><SessionCard key={session.id} session={session} name={name} editable={editable} modelReady={modelReady} generating={generatingId===session.id} preview={preview} error={error} onUpdate={next=>onState({...state,sessions:state.sessions.map(s=>s.id===next.id?{...next,updatedAt:new Date().toISOString()}:s)})} onGenerate={()=>onGenerate(session.id)} onStop={onStop}/><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Permanently delete this activity session and its transcript?'))onState({sessions:state.sessions.filter(s=>s.id!==session.id),selectedId:null});}}>Delete session</button></>}
 {!modelReady&&kind!=='words'&&!generatingId&&<p className="hint-soft">You can save your turn without the model. Start the model to request Mana's contribution.</p>}
 </div></section></>;
}
