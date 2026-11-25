import {friendshipHabitSummaries,friendName} from '../core/friendshipHabits';
import type {SharedMemory} from '../core/residentRelationships';

export default function FriendshipHabits({memories}:{memories:SharedMemory[]}){
 const habits=friendshipHabitSummaries(memories);
 return <details className="town-friendship-habits"><summary>Friendship habits</summary>
  <p>Shared experiences gently influence optional meetups. A recent meetup leaves more room for other company.</p>
  {habits.length?habits.map(habit=><article key={`${habit.first}-${habit.second}`}>
   <strong>{friendName(habit.first)} &amp; {friendName(habit.second)}</strong>
   <p>{habit.moments} remembered shared {habit.moments===1?'moment':'moments'} · {habit.activities.join(', ')}</p>
  </article>):<p>Shared moments will appear here as everyone spends time together.</p>}
 </details>;
}
