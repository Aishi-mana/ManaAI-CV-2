import { useState } from "react";
import ExportPlaytestButton from './ExportPlaytestButton';
import type { Goal } from "../core/goals";
import { interestKey, interestLevel } from "../core/interests";
import type { Interests } from "../core/interests";
import type { WorkArtifact, WorkDraft, WorkKind } from "../core/work";
import { revisionChanges, findWork } from "../core/work";
import { validateWorkJson } from "../core/workValidation";
import type { WorkValidation } from "../core/workValidation";
import BattlePreview from "./BattlePreview";
import type { Playtest } from "../core/playtests";

function ArtifactCard({artifact,work,ready,onRevise,onDelete,playtests,onSavePlaytest,onDeletePlaytest}:{artifact:WorkArtifact;work:WorkArtifact[];ready:boolean;onRevise:(instruction:string)=>void;onDelete:()=>void;playtests:Playtest[];onSavePlaytest:(report:Playtest)=>void;onDeletePlaytest:(id:string)=>void}) {
  const [instruction,setInstruction]=useState("");
  const [validation,setValidation]=useState<WorkValidation|null>(null);
  const parent=work.find((a)=>a.id===artifact.parentId);
  const reports=playtests.filter((r)=>r.artifactId===artifact.id);
  return <article className="memory-card"><strong>{artifact.title} · v{artifact.version??1}</strong>
    <p className="hint-soft">{artifact.goalTitle} · {artifact.kind} · Saved {new Date(artifact.createdAt).toLocaleString()}. Reviewed draft; not executed or tested.</p>
    {artifact.parentId&&<p className="hint-soft">Revises {parent?`${parent.title} · v${parent.version??1}`:"an earlier version that was deleted"}.</p>}
    {parent&&<ChangeSummary changes={revisionChanges(parent.content,artifact.content)} />}
    <details><summary>View artifact</summary><pre className="memory-content" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{artifact.content}</pre></details>
    <button className="btn" onClick={()=>setValidation(validateWorkJson(artifact.content))}>Validate JSON</button>
    <ExportWorkButton artifact={artifact}/>
    <details><summary>Battle preview</summary><BattlePreview content={artifact.content} artifact={artifact} onSave={onSavePlaytest} /></details>
    {!!reports.length&&<details><summary>Saved playtests ({reports.length})</summary>{[...reports].reverse().map((r)=><div key={r.id}><strong>{r.player} vs {r.enemy}: {r.outcome} · {r.turns} turns · v{r.version}</strong><p className="hint-soft">{new Date(r.createdAt).toLocaleString()} · Final health: {r.playerHealth} / {r.enemyHealth}. Basic player damage {r.playerAttackDamage}; enemy counter {r.enemyCounterDamage}.</p><p>{r.notes}</p><details><summary>Recent battle log (up to 40 entries)</summary>{r.recentLog.map((line,i)=><p key={i}>{line}</p>)}</details><ExportPlaytestButton report={r}/><button className="btn" onClick={()=>{if(window.confirm("Delete this playtest report?"))onDeletePlaytest(r.id);}}>Delete report</button></div>)}</details>}
    {validation&&<section role="status"><strong>{!validation.syntaxValid?"Invalid JSON":validation.errors.length?"Valid JSON · game-data errors":validation.gameData?"JSON and game-data checks passed":"JSON syntax passed"}</strong>
      {validation.errors.map((error,i)=><p className="msg-error" key={`e${i}`}>{error}</p>)}
      {validation.warnings.map((warning,i)=><p className="hint-soft" key={`w${i}`}>{warning}</p>)}
      <p className="hint-soft">Data checks only. No code execution or game behavior tests; no goal or progress changes.</p>
    </section>}
    <label className="field"><span>Requested revision</span><textarea rows={2} maxLength={1000} value={instruction} onChange={(e)=>setInstruction(e.target.value)} placeholder="For example: add a healing item and explain how it works" /></label>
    <button className="btn" disabled={!ready||!instruction.trim()} onClick={()=>onRevise(instruction)}>Draft revision</button>
    <p className="hint-soft">Balancing uses this version's saved playtests ({reports.length}). Save a completed battle report on each new version to give Mana updated results.</p>
    <p className="hint-soft">Review before saving a new version. Original remains saved. Requires a ready model and an active goal.</p>
    <button className="btn" onClick={()=>{if(window.confirm("Delete this artifact version and its playtest reports? Other versions remain saved."))onDelete();}}>Delete artifact</button>
  </article>;
}

function ChangeSummary({changes}:{changes:string[]}) {
  return changes.length?<details><summary>Content changes (up to 40)</summary>{changes.map((change,i)=><p className="memory-content" style={{overflowWrap:"anywhere"}} key={i}>{change}</p>)}<p className="hint-soft">Changes do not prove improved balance. Playtest the new version.</p></details>:<p role="status" className="msg-error">No content changes. Formatting and JSON key order do not count as revisions.</p>;
}

function GoalCard({ goal, onUpdate, onDelete, onWork, ready }: {goal:Goal;onUpdate:(goal:Goal)=>void;onDelete:()=>void;onWork:(kind:WorkKind,instruction:string)=>void;ready:boolean}) {
  const [title,setTitle] = useState(goal.title);
  const [plan,setPlan] = useState(goal.plan);
  const [notes,setNotes] = useState(goal.notes);
  const [kind,setKind] = useState<WorkKind>("design");
  const [instruction,setInstruction] = useState("Draft one small next contribution to this goal.");
  return <article className="memory-card"><strong>{goal.title} · {goal.status}</strong>
    <label className="field"><span>Title</span><input value={title} maxLength={150} onChange={(e)=>setTitle(e.target.value)} /></label>
    <label className="field"><span>Plan</span><textarea value={plan} rows={3} maxLength={2000} onChange={(e)=>setPlan(e.target.value)} /></label>
    <label className="field"><span>Progress you recorded</span><textarea value={notes} rows={3} maxLength={2000} onChange={(e)=>setNotes(e.target.value)} /></label>
    <button className="btn" disabled={!title.trim()} onClick={()=>onUpdate({...goal,title:title.trim(),plan,notes})}>Save changes</button>
    <div className="chips">{(["active","paused","completed"] as const).map((status)=><button className="btn" key={status} disabled={status===goal.status || !title.trim()} onClick={()=>onUpdate({...goal,title:title.trim(),plan,notes,status})}>{status === "active" ? "Resume" : status === "paused" ? "Pause" : "Mark completed"}</button>)}<button className="btn" onClick={()=>{if(window.confirm("Delete this goal?")) onDelete();}}>Delete</button></div>
    <p className="hint-soft">Updated {new Date(goal.updatedAt).toLocaleString()}</p>
    <label className="field"><span>Work contribution</span><select value={kind} onChange={(e)=>setKind(e.target.value as WorkKind)}><option value="design">Design notes</option><option value="writing">Writing</option><option value="code">Code draft</option></select></label>
    <label className="field"><span>What should Mana draft?</span><textarea rows={2} maxLength={1000} value={instruction} onChange={(e)=>setInstruction(e.target.value)} /></label>
    <button className="btn" disabled={!ready||goal.status!=="active"||!instruction.trim()||title!==goal.title||plan!==goal.plan||notes!==goal.notes} onClick={()=>onWork(kind,instruction)}>Work on this goal</button>
    <p className="hint-soft">Save edits first. Active goals only. Creates a reviewable text draft; code is not run or tested.</p>
  </article>;
}
export default function GoalsDrawer({ name,goals,draft,onDraft,generating,ready,error,onPropose,onStop,onAccept,onUpdate,onDelete,onClose,interestNames,interests,onInterests,work,workDraft,onWorkDraft,workGenerating,onWork,onSaveWork,onDeleteWork,onRevise,playtests,onSavePlaytest,onDeletePlaytest }: {
  name:string;goals:Goal[];draft:string;onDraft:(text:string)=>void;generating:boolean;ready:boolean;error:string;onPropose:()=>void;onStop:()=>void;onAccept:()=>void;onUpdate:(goal:Goal)=>void;onDelete:(id:string)=>void;onClose:()=>void;
  interestNames:string[];interests:Interests;onInterests:(state:Interests)=>void;
  work:WorkArtifact[];workDraft:WorkDraft|null;onWorkDraft:(draft:WorkDraft|null)=>void;workGenerating:boolean;onWork:(id:string,kind:WorkKind,instruction:string)=>void;onSaveWork:()=>void;onDeleteWork:(id:string)=>void;
  onRevise:(id:string,instruction:string)=>void;
  playtests:Playtest[];onSavePlaytest:(report:Playtest)=>void;onDeletePlaytest:(id:string)=>void;
}) {
  const draftSource=work.find((a)=>a.id===workDraft?.parentId);
  const [workQuery,setWorkQuery]=useState('');
  const [workKind,setWorkKind]=useState<WorkKind|'all'>('all');
  const [latestOnly,setLatestOnly]=useState(true);
  const visibleWork=findWork(work,workQuery,workKind,latestOnly);
  const draftChanges=draftSource&&workDraft?revisionChanges(draftSource.content,workDraft.content):null;
  return <><div className="scrim" onClick={onClose} /><section className="drawer" role="dialog" aria-label="Goals"><header className="drawer-head"><h2>{name}'s goals</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
    <p className="hint-soft">Explore a small idea together. Review a proposal or write your own, then record progress explicitly. Saving a goal does not mean Mana performed the work.</p>
    <h3>Interests</h3><p className="hint-soft">Edit interest names in Memories → Identity. Enthusiasm starts at 60; accepting a goal with matching words adds 3 once. You can adjust it here.</p>
    {!interestNames.length && <p className="hint-soft">Add an interest in Identity to begin.</p>}
    {interestNames.map((interest,index)=><label className="field" key={index}><span>{interest}: {interestLevel(interests,interest)}/100</span><input type="range" min={0} max={100} value={interestLevel(interests,interest)} onChange={(e)=>onInterests({...interests,levels:{...interests.levels,[interestKey(interest)]:Number(e.target.value)}})} /></label>)}
    <button className="btn primary" disabled={!ready || generating} onClick={onPropose}>Ask {name} for an idea</button>{generating && <button className="btn" onClick={onStop}>Stop proposal</button>}
    {error && <p role="alert" className="msg-error">{error}</p>}
    {workGenerating&&<><p role="status">Drafting a contribution...</p><button className="btn" onClick={onStop}>Stop work session</button></>}
    {workDraft&&<section><h3>{workDraft.parentId?"Review revision draft":"Review work draft"} · v{workDraft.version??1}</h3><p className="hint-soft">For {workDraft.goalTitle} · {workDraft.kind}. Saving records a reviewed draft, not completed or tested work. {workDraft.parentId&&"Original version remains saved."} Unsaved drafts are lost on restart.</p>
      <label className="field"><span>Artifact title</span><input disabled={workGenerating} value={workDraft.title} maxLength={200} onChange={(e)=>onWorkDraft({...workDraft,title:e.target.value})} /></label>
      <label className="field"><span>Artifact text</span><textarea rows={10} disabled={workGenerating} maxLength={16000} value={workDraft.content} onChange={(e)=>onWorkDraft({...workDraft,content:e.target.value})} /></label>
      {draftChanges&&<ChangeSummary changes={draftChanges} />}
      <button className="btn primary" disabled={workGenerating||!workDraft.title.trim()||!workDraft.content.trim()||draftChanges?.length===0} onClick={onSaveWork}>Save artifact</button><button className="btn" disabled={workGenerating} onClick={()=>onWorkDraft(null)}>Dismiss work draft</button>
    </section>}
    <label className="field"><span>Goal draft: title on the first line, plan below</span><textarea rows={6} value={draft} maxLength={2150} disabled={generating} onChange={(e)=>onDraft(e.target.value)} /></label>
    <div className="chips"><button className="btn primary" disabled={generating || !draft.trim()} onClick={onAccept}>Accept goal</button><button className="btn" disabled={generating || !draft} onClick={()=>onDraft("")}>Dismiss draft</button></div>
    <h3>Saved goals ({goals.length})</h3>{!goals.length && <p className="hint-soft">No goals yet. You can save your own idea without starting the model.</p>}
    {[...goals].reverse().map((goal)=><GoalCard key={goal.id} goal={goal} onUpdate={onUpdate} onDelete={()=>onDelete(goal.id)} ready={ready&&!workGenerating} onWork={(kind,instruction)=>onWork(goal.id,kind,instruction)} />)}
    <h3>Saved work ({work.length})</h3>
    <label className="field"><span>Search saved work</span><input value={workQuery} maxLength={200} onChange={e=>setWorkQuery(e.target.value)} placeholder="Title, goal or artifact text" /></label>
    <label className="field"><span>Artifact type</span><select value={workKind} onChange={e=>setWorkKind(e.target.value as WorkKind|'all')}><option value="all">All types</option><option value="design">Design</option><option value="writing">Writing</option><option value="code">Code</option></select></label>
    <label className="check"><input type="checkbox" checked={latestOnly} onChange={e=>setLatestOnly(e.target.checked)} /><span>Show latest version in each artifact family</span></label>
    <p className="hint-soft">Showing {visibleWork.length} of {work.length} saved versions. Turn off latest-only to inspect or revise older versions. Filters do not delete work.</p>
    {!visibleWork.length&&<p>No work matches these filters.</p>}
    {visibleWork.map((artifact)=><ArtifactCard key={artifact.id} artifact={artifact} work={work} playtests={playtests} onSavePlaytest={onSavePlaytest} onDeletePlaytest={onDeletePlaytest} ready={ready&&!workGenerating&&goals.some((g)=>g.id===artifact.goalId&&g.status==="active")} onRevise={(instruction)=>onRevise(artifact.id,instruction)} onDelete={()=>onDeleteWork(artifact.id)} />)}
  </div></section></>;
}
import ExportWorkButton from './ExportWorkButton';
