import {journalClock} from '../core/clock';
import {townCharacterName} from '../core/townCharacters';
import type {CharacterGathering} from '../core/characterGatherings';
export default function CharacterGatheringList({plans,timeZone,date}:{plans:readonly CharacterGathering[];timeZone:string;date?:string}){
 const format=new Intl.DateTimeFormat(undefined,{timeZone,dateStyle:'medium',timeStyle:'short'});
 const selected=plans.filter(plan=>!date||journalClock(new Date(plan.startsAt),timeZone).date===date).slice().sort((a,b)=>b.startsAt.localeCompare(a.startsAt)).slice(0,12);
 return <section aria-label="Character gatherings"><h4>Character gatherings</h4><p>One-time plans organized by characters, after a friend agrees.</p>
  {selected.length?selected.map(plan=><article className="town-project-card" key={plan.id}>
   <strong>{plan.title}</strong><p>Hosted by {townCharacterName(plan.host)} · With {townCharacterName(plan.guest)} · {plan.kind==='cafe'?'Coffee Shop':'Park'}</p>
   <time dateTime={plan.startsAt}>{format.format(new Date(plan.startsAt))}</time>
   <p>{plan.status==='planned'?'Agreed · Waiting for the time':plan.status==='going'?'Walking to meet / spending time together':plan.status==='completed'?'Shared activity completed':'Cancelled / missed'}{plan.reason?` · ${plan.reason}`:''}</p>
   <details><summary>Invitation and reply</summary><p>{townCharacterName(plan.host)}: {plan.message}</p><p>{townCharacterName(plan.guest)}: {plan.reply}</p></details>
  </article>):<p>No character-organized gatherings{date?' on this date':' yet'}.</p>}
 </section>;
}
