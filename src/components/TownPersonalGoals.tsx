import {residentProfiles} from '../core/residentProfiles';
import {townGoalChoice,type TownPersonalGoal} from '../core/townPersonalGoals';

export default function TownPersonalGoals({goals}:{goals:TownPersonalGoal[]}){
 if(!goals.length)return null;
 return <section className="town-personal-goals" aria-label="Personal goals">
  <h3>Personal goals</h3>
  {[...goals.filter(goal=>!goal.completedAt),...goals.filter(goal=>goal.completedAt).slice(-3).reverse()].map(goal=>{
   const choice=townGoalChoice(goal);
   const name=goal.owner==='mana'?'Mana':residentProfiles[goal.owner].name;
   return <article key={goal.id}>
    <strong>{name} · {choice.title}</strong>
    <p>{goal.reason}</p>
    <progress value={goal.evidence.length} max={choice.target} aria-label={`${name}’s goal progress`}/>
    <p>{goal.completedAt?'Completed':`${goal.evidence.length} of ${choice.target} sessions completed`}</p>
   </article>;
  })}
 </section>;
}
