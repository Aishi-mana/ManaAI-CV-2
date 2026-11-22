import {useState} from 'react';
import {activeDecorationSchedules,TOWN_DECORATIONS,validDecorationDate,validateTownDecorations,type DecorationSchedule,type TownDecorationSettings} from '../core/townFestivities';
import type {TownEventCalendar} from '../core/townEvents';
import TownDecorationEditor from './TownDecorationEditor';
import {decorationKinds,scheduleDecorationObjects,type DecorationObject} from '../core/townDecorationLayout';

const eventOptions=[['@other','Town events (except Christmas)'],['@christmas','Christmas events'],['@new-year','New Year events']] as const;
function describe(schedule:DecorationSchedule){
 if(schedule.trigger==='event')return `${eventOptions.find(([id])=>id===schedule.event)?.[1]??schedule.event} · scheduled event hours`;
 const display=(date:string)=>schedule.yearly?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`)):date;
 return `${display(schedule.start)} – ${display(schedule.end)} · ${schedule.yearly?'every year':'one time'}`;
}
export default function TownDecorationControls({settings,onChange,clock,events}:{settings:TownDecorationSettings;onChange:(settings:TownDecorationSettings)=>void;clock:TownEventCalendar['clock'];events:TownEventCalendar['active']}){
 const [draft,setDraft]=useState<DecorationSchedule>();
 const [error,setError]=useState('');
 const [layoutSchedule,setLayoutSchedule]=useState<DecorationSchedule>();
 const schedules=validateTownDecorations(settings).schedules;
 const activeIds=new Set(activeDecorationSchedules(events,settings,clock.date).map(schedule=>schedule.id));
 const update=(next:Partial<DecorationSchedule>)=>setDraft(previous=>previous?{...previous,...next}:previous);
 function saveLayout(objects:DecorationObject[]){
  if(!layoutSchedule)return;
  const changes={objects,decorations:decorationKinds(objects)};
  if(draft?.id===layoutSchedule.id)setDraft({...draft,...changes});
  else onChange(validateTownDecorations({schedules:schedules.map(schedule=>schedule.id===layoutSchedule.id?{...schedule,...changes}:schedule)}));
  setLayoutSchedule(undefined);
 }
 function save(){
  if(!draft)return;
  if(!draft.name.trim())return setError('Give this schedule a name.');
  if(!draft.decorations.length&&draft.objects===undefined)return setError('Choose at least one decoration.');
  if(draft.trigger==='dates'&&(!validDecorationDate(draft.start)||!validDecorationDate(draft.end)))return setError('Choose a start and end date.');
  if(draft.trigger==='dates'&&!draft.yearly&&draft.start>draft.end)return setError('The end date must be on or after the start date.');
  if(draft.trigger==='event'&&!draft.event.trim())return setError('Enter the event name.');
  const next={...draft,name:draft.name.trim()};
  onChange(validateTownDecorations({schedules:schedules.some(item=>item.id===next.id)?schedules.map(item=>item.id===next.id?next:item):[...schedules,next]}));
  setDraft(undefined);setError('');
 }
 return <section className="town-decoration-controls" aria-label="Town decorations">
  {layoutSchedule&&<TownDecorationEditor schedule={layoutSchedule} onSave={saveLayout} onClose={()=>setLayoutSchedule(undefined)}/>}
  <p>Choose decorations and when they appear in Town Square. Overlapping schedules combine their decorations.</p>
  <p>Town calendar: <time dateTime={clock.date}>{clock.date}</time> · {clock.time}</p>
  {!draft&&<>
   <button className="btn" type="button" onClick={()=>{setError('');setDraft({id:crypto.randomUUID(),name:'',enabled:true,decorations:['garlands','lights'],trigger:'dates',start:`${new Date().getFullYear()}-12-01`,end:`${new Date().getFullYear()}-12-31`,yearly:true,event:'@other'});}}>Add decoration schedule</button>
   <div className="town-decoration-schedules">
    {schedules.map(schedule=><article key={schedule.id}>
     <label><input type="checkbox" checked={schedule.enabled} onChange={event=>onChange({schedules:schedules.map(item=>item.id===schedule.id?{...item,enabled:event.target.checked}:item)})}/><strong>{schedule.name}</strong></label>
     <p>{describe(schedule)}</p>
     <p><strong>{activeIds.has(schedule.id)?'Active now in Town Square':schedule.enabled?'Not active now':'Disabled'}</strong></p>
     <p>{TOWN_DECORATIONS.filter(option=>schedule.decorations.includes(option.id)).map(option=>option.label).join(' · ')||'Empty layout'} · {scheduleDecorationObjects(schedule).length} objects</p>
     <div className="town-decoration-actions"><button className="btn" type="button" onClick={()=>{setDraft({...schedule});setError('');}}>Edit</button>
      <button className="btn" type="button" onClick={()=>setLayoutSchedule(schedule)}>Edit layout</button>
      <button className="btn" type="button" aria-label={`Delete ${schedule.name}`} onClick={()=>onChange({schedules:schedules.filter(item=>item.id!==schedule.id)})}>Delete</button></div>
    </article>)}
    {!schedules.length&&<p>No decoration schedules yet.</p>}
   </div>
  </>}
  {draft&&<form onSubmit={event=>{event.preventDefault();save();}}>
   <label>Schedule name<input value={draft.name} maxLength={100} onChange={event=>update({name:event.target.value})}/></label>
   {draft.objects===undefined?<fieldset><legend>Decorations</legend>{TOWN_DECORATIONS.map(option=><label key={option.id}><input type="checkbox" checked={draft.decorations.includes(option.id)} onChange={event=>update({decorations:event.target.checked?[...draft.decorations,option.id]:draft.decorations.filter(id=>id!==option.id)})}/>{option.label}</label>)}</fieldset>:<p>Custom layout · {draft.objects.length} objects. Add and remove decorations in the layout editor.</p>}
   <button className="btn" type="button" onClick={()=>setLayoutSchedule(draft)}>Edit layout</button>
   <label>Show during<select value={draft.trigger} onChange={event=>update({trigger:event.target.value as DecorationSchedule['trigger']})}><option value="dates">Chosen dates</option><option value="event">Calendar event hours</option></select></label>
   {draft.trigger==='dates'?<>
    <label>Start date<input type="date" required value={draft.start} onChange={event=>update({start:event.target.value})}/></label>
    <label>End date<input type="date" required value={draft.end} onChange={event=>update({end:event.target.value})}/></label>
    <label><input type="checkbox" checked={draft.yearly} onChange={event=>update({yearly:event.target.checked})}/>Repeat every year</label>
    <p>{draft.yearly?'Uses the month and day, including both dates. December–January ranges cross into the next year. February 29 appears only in leap years.':'Includes both dates, following the town calendar.'}</p>
   </>:<>
    <label>Event<select value={eventOptions.some(([id])=>id===draft.event)?draft.event:'custom'} onChange={event=>update({event:event.target.value==='custom'?'':event.target.value})}>{eventOptions.map(([id,label])=><option key={id} value={id}>{label}</option>)}<option value="custom">Specific event name</option></select></label>
    {!eventOptions.some(([id])=>id===draft.event)&&<label>Event name<input value={draft.event} maxLength={120} onChange={event=>update({event:event.target.value})}/></label>}
    <p>Appears only during that event’s scheduled hours.</p>
   </>}
   {error&&<p role="alert">{error}</p>}
   <div className="town-decoration-actions"><button className="btn" type="submit">Save schedule</button><button className="btn" type="button" onClick={()=>{setDraft(undefined);setError('');}}>Cancel</button></div>
  </form>}
 </section>;
}

