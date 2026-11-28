import {townDailyIntention,type TownPersonalGoal} from '../core/townPersonalGoals';
import {townCharacterIds,townCharacterName} from '../core/townCharacters';

export default function TownDailyIntentions({goals,timeZone,now=Date.now()}:{goals:TownPersonalGoal[];timeZone:string;now?:number}){
 const intentions=townCharacterIds.flatMap(owner=>{
  const intention=townDailyIntention(goals,owner,new Date(now),timeZone);
  return intention?[intention]:[];
 });
 if(!intentions.length)return null;
 return <section className="town-personal-goals" aria-label="Daily intentions">
  <h3>A little intention for today</h3>
  <p>Small steps in their ongoing projects. Unfinished steps can wait for another day.</p>
  {intentions.map(intention=><article key={intention.owner}>
   <strong>{townCharacterName(intention.owner)} · {intention.title}</strong>
   <p>{intention.reason}</p>
   <small>{intention.done?'Finished a session today':intention.carriedFrom?`Still hoping to do this · carried from ${intention.carriedFrom}`:'Hoping to do this today'}</small>
   <p>Part of: {intention.project}</p>
  </article>)}
 </section>;
}
