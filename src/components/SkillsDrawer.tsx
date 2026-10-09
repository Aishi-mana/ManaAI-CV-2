import {useState} from 'react';
import {SKILLS,PRACTICE_LIMIT,practiceSources,confirmPractice,practiceProgress} from '../core/skills';
import type {Practice,Skill} from '../core/skills';
import type {WorkArtifact} from '../core/work';
import type {SharedActivities} from '../core/sharedActivities';
export default function SkillsDrawer({entries,work,activities,editable,onChange,onClose}:{entries:Practice[];work:WorkArtifact[];activities:SharedActivities;editable:boolean;onChange:(entries:Practice[])=>void;onClose:()=>void}){
 const [skill,setSkill]=useState<Skill>('coding'),[sourceKey,setSourceKey]=useState(''),[notes,setNotes]=useState(''),[confirmed,setConfirmed]=useState(false),[query,setQuery]=useState('');
 const sources=practiceSources(work,activities.sessions),source=sources.find(s=>`${s.kind}:${s.id}`===sourceKey);
 const duplicate=!!source&&entries.some(p=>p.skill===skill&&p.source.kind===source.kind&&p.source.id===source.id);
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Skill practice"><header className="drawer-head"><h2>Skills &amp; practice</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <p>Record practice you actually took part in using saved work or activities. Generating a draft alone does not prove learning or proficiency. Practice stages count confirmed records, not grades or tested ability.</p>
 <div className="grid2">{(Object.keys(SKILLS) as Skill[]).map(k=>{const p=practiceProgress(entries,k);return <article className="memory-card" key={k}><h3>{SKILLS[k]}</h3><p>{p.count} confirmed {p.count===1?'record':'records'} · Practice stage {p.stage}</p><p className="hint-soft">{p.next?`Next milestone: ${p.next} ${p.next===1?'record':'records'}`:'All practice-count milestones reached'}{p.milestones.length?` · Reached: ${p.milestones.join(', ')}`:''}</p></article>;})}</div>
 <h3>Confirm a practice record ({entries.length}/{PRACTICE_LIMIT})</h3><label className="field"><span>Practice area</span><select value={skill} disabled={!editable} onChange={e=>{setSkill(e.target.value as Skill);setConfirmed(false);}}>{Object.entries(SKILLS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label className="field"><span>Saved source</span><select value={sourceKey} disabled={!editable} onChange={e=>{setSourceKey(e.target.value);setConfirmed(false);}}><option value="">Choose saved work or an activity with your contribution</option>{sources.map(s=><option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>{s.kind} · {s.title}</option>)}</select></label>
 {source&&<p className="hint-soft">{source.outcome}</p>}{sources.length===0&&<p>Save a reviewed work draft or contribute to an activity first.</p>}
 <label className="field"><span>What did you practice? (optional)</span><textarea rows={3} maxLength={1000} value={notes} disabled={!editable} onChange={e=>{setNotes(e.target.value);setConfirmed(false);}}/></label>
 <label className="check"><input type="checkbox" checked={confirmed} disabled={!editable} onChange={e=>setConfirmed(e.target.checked)}/>I confirm we practiced with this source; this is not a proficiency assessment.</label>
 {duplicate&&<p role="status">This source already counts for this practice area.</p>}
 <button className="btn primary" disabled={!editable||!confirmed||!source||duplicate||entries.length>=PRACTICE_LIMIT} onClick={()=>{if(source){onChange(confirmPractice(entries,skill,source,notes));setNotes('');setConfirmed(false);setSourceKey('');}}}>Save practice record</button>
 <p className="hint-soft">One record per source per area. No automatic pruning. Deleting a record recalculates practice stages; it does not delete its source or change wardrobe coding levels.</p>
 <label className="field"><span>Search practice history</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {[...entries].reverse().filter(p=>`${SKILLS[p.skill]} ${p.notes} ${p.source.title}`.toLowerCase().includes(query.trim().toLowerCase())).map(p=><article className="memory-card" key={p.id}><h3>{SKILLS[p.skill]}</h3><p>{p.notes||p.source.title}</p><p className="hint-soft">Confirmed {new Date(p.confirmedAt).toLocaleString()}</p><details><summary>Recorded source</summary><p>{p.source.title}</p><p>{p.source.outcome}</p><p className="hint-soft">{p.source.kind}: {p.source.id} · Saved {new Date(p.source.createdAt).toLocaleString()}. This snapshot remains if the source is deleted.</p></details><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm('Delete this practice record and recalculate its practice stage? The source stays unchanged.'))onChange(entries.filter(e=>e.id!==p.id));}}>Delete record</button></article>)}
 </div></section></>;
}
