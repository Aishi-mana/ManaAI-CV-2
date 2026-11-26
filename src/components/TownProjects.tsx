import {residentIds,residentProfiles} from '../core/residentProfiles';
import {townGoalChoices,townGoalChoice,townProjectStages,townProjectNextStep,canChooseTownGoal,type TownPersonalGoal,type TownGoalId} from '../core/townPersonalGoals';
import type {TownCharacter} from '../core/residentRelationships';

export default function TownProjects({goals,owner,timeZone,onOpenOwner,onStart}:{goals:TownPersonalGoal[];owner?:TownCharacter;timeZone:string;onOpenOwner:(owner:TownCharacter)=>void;onStart?:(owner:TownCharacter,choice:TownGoalId)=>boolean}){
 const owners:TownCharacter[]=['mana',...residentIds],name=(id:TownCharacter)=>id==='mana'?'Mana':residentProfiles[id].name;
 if(!owner)return <div className="room-phone-list town-projects"><p>Little projects, one real work session at a time.</p><div className="town-project-grid">
  {owners.map(id=>{
   const project=goals.find(goal=>goal.owner===id&&!goal.completedAt),latest=goals.filter(goal=>goal.owner===id).slice(-1)[0];
   return <button className="town-project-person" type="button" key={id} onClick={()=>onOpenOwner(id)}>
    <img src={id==='mana'?'./companion-room/mana_idle_1.webp':residentProfiles[id].avatar} alt=""/>
    <strong>{name(id)}</strong><span>{project?townGoalChoice(project).title:latest?'Taking a little break':'Choose a project'}</span>
    {project&&<progress value={project.evidence.length} max={townGoalChoice(project).target} aria-label={`${name(id)}’s project progress`}/>}
   </button>;
  })}
 </div></div>;
 const active=goals.find(goal=>goal.owner===owner&&!goal.completedAt),finished=goals.filter(goal=>goal.owner===owner&&goal.completedAt).slice(-3).reverse();
 const card=(project:TownPersonalGoal)=>{
  const choice=townGoalChoice(project);
  return <article className="town-project-card" key={project.id}>
   <h3>{choice.title}</h3><p>{project.reason}</p><p className="hint-soft">{project.startedBy==='aishi'?'Chosen by you':`Chosen by ${name(owner)}`}</p>
   <progress value={project.evidence.length} max={choice.target} aria-label="Completed project sessions"/>
   <p>{project.completedAt?'All planned work sessions are complete.':`${project.evidence.length} of ${choice.target} sessions · Next: ${townProjectNextStep(project)}`}</p>
   <ol className="town-project-stages">{townProjectStages(project).map((stage,index)=><li key={index} data-done={stage.done}>
    <span aria-hidden="true">{stage.done?'✓':'○'}</span> {stage.label}
    {stage.at&&<time dateTime={stage.at}>{new Intl.DateTimeFormat(undefined,{timeZone,dateStyle:'medium'}).format(new Date(stage.at))}</time>}
   </li>)}</ol>
  </article>;
 };
 return <div className="room-phone-list town-projects">
  <p>Projects use their usual activities. One session can add progress per town day; work, visits, and bedtime keep their places.</p>
  {active?card(active):canChooseTownGoal(goals,owner)?<section><h3>Choose a little project for {name(owner)}</h3>
   {townGoalChoices[owner].map(choice=><button className="btn town-project-choice" type="button" key={choice.id} disabled={!onStart} onClick={()=>onStart?.(owner,choice.id)}>{choice.title}<small>{choice.target} {choice.target===1?'session':'sessions'}</small></button>)}
   <p className="hint-soft">They can also choose a project themselves when the AI is available.</p>
  </section>:<p>{name(owner)} is taking a break before choosing another project.</p>}
  {!!finished.length&&<details><summary>Finished projects</summary>{finished.map(card)}</details>}
 </div>;
}
