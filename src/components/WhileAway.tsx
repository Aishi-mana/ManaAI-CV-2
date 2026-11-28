import {manaversePlaces} from './ManaverseMap';
import type {AwayReport} from '../core/manaverseReturn';
export default function WhileAway({report,onDismiss}:{report?:AwayReport;onDismiss?:()=>void}){
 if(!report||onDismiss&&report.dismissed)return null;
 const minutes=Math.floor((Date.parse(report.to)-Date.parse(report.from))/60000),duration=minutes<60?`${minutes} minutes`:minutes<1440?`${Math.floor(minutes/60)} hours`:`${Math.floor(minutes/1440)} days`;
 const date=new Intl.DateTimeFormat(undefined,{timeZone:report.timeZone,dateStyle:'medium',timeStyle:'short'});
 return <aside className="manaverse-away-summary" aria-label="While you were away">
  <details><summary>While you were away · {duration}</summary>
   <p>Routine update for {date.format(new Date(report.to))}.</p>
   <ul><li>Mana: {report.sleeping?'Resting in bed':`Current routine at ${manaversePlaces[report.targets.mana]}`}.</li>
    <li>Luna: Current routine at {manaversePlaces[report.targets.luna]}.</li><li>Lyra: Current routine at {manaversePlaces[report.targets.lyra]}.</li>
    <li>Pet Bot: {report.sleeping?'Charging at home':'At home, ready to roam'}.</li></ul>
   {report.energyAdded>0&&<p>Scheduled night-rest allowance: +{report.energyAdded} energy for Mana.</p>}
   {report.missedGatherings>0&&<p>{report.missedGatherings} gathering {report.missedGatherings===1?'was':'were'} missed or interrupted.</p>}
   {report.expiredVisits>0&&<p>{report.expiredVisits} old visit {report.expiredVisits===1?'plan expired':'plans expired'}.</p>}
   {report.zoneChanged&&<p>The town timezone changed; routines were updated without an offline rest allowance.</p>}
   <p className="hint-soft">This covers routine changes. Conversations, shared activities and project creations need recorded activity in the app.</p>
  </details>
  {onDismiss&&<button type="button" className="btn" onClick={onDismiss}>Got it</button>}
 </aside>;
}
