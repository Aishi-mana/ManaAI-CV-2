import {friendshipHabitSummaries,friendName,friendActivityLabels} from '../core/friendshipHabits';
import type {SharedMemory} from '../core/residentRelationships';

export default function FriendshipHabits({memories,timeZone='Asia/Singapore'}:{memories:SharedMemory[];timeZone?:string}){
 const habits=friendshipHabitSummaries(memories);
 return <details className="town-friendship-habits"><summary>Friendship habits</summary>
  <p>Shared experiences gently influence optional meetups. Familiar activities can shape invitations, while recent meetups leave room for other company. These are shared habits, not friendship scores.</p>
  {habits.length?habits.map(habit=><article key={`${habit.first}-${habit.second}`}>
   <strong>{friendName(habit.first)} &amp; {friendName(habit.second)}</strong>
   {!!habit.profile.filter(item=>item.sessions>=2).length&&<p>Often shared: {habit.profile.filter(item=>item.sessions>=2).map(item=>`${friendActivityLabels[item.activity]} (${item.sessions} sessions)`).join(', ')}.</p>}
   <p>Last shared moment: {new Intl.DateTimeFormat(undefined,{timeZone,dateStyle:'medium'}).format(new Date(habit.lastTogether))}.</p>
   {habit.catchingUp&&<p>A chance to catch up when both are free.</p>}
   <p>{habit.moments} remembered shared {habit.moments===1?'moment':'moments'} · {habit.activities.join(', ')}</p>
  </article>):<p>Shared moments will appear here as everyone spends time together.</p>}
 </details>;
}
