import {useEffect,useRef,useState} from 'react';
import {townEventsForMonth,validTownEvent,type CustomTownEvent,type TownEventCalendar,type TownEventDraft} from '../core/townEvents';

export type TownEventGridProps={
 townEventClock:TownEventCalendar['clock'];
 customTownEvents:readonly CustomTownEvent[];
 onAddTownEvent:(draft:TownEventDraft)=>void;
};

const monthLabel=new Intl.DateTimeFormat(undefined,{month:'long',timeZone:'UTC'});
const dateLabel=new Intl.DateTimeFormat(undefined,{month:'long',day:'numeric',timeZone:'UTC'});

export default function TownEventGrid({townEventClock,customTownEvents,onAddTownEvent}:TownEventGridProps){
 // A leap year supplies month lengths for this annual calendar.
 const [month,setMonth]=useState('2000-'+townEventClock.date.slice(5,7));
 const [draft,setDraft]=useState<TownEventDraft>();
 const [feedback,setFeedback]=useState('');
 const titleField=useRef<HTMLInputElement>(null);
 const first=new Date(month+'-01T12:00:00Z');
 const days=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 const events=townEventsForMonth(month,customTownEvents,townEventClock);
 const selected=draft?events.filter(event=>event.date===draft.date):[];
 useEffect(()=>{if(draft?.date)titleField.current?.focus();},[draft?.date]);

 function changeMonth(amount:number){
  const next=(first.getUTCMonth()+amount+12)%12+1;
  setMonth('2000-'+String(next).padStart(2,'0'));
  setDraft(undefined);
  setFeedback('');
 }

 return <>
  <div className="town-event-month">
   <button className="btn" type="button" aria-label="Previous month" onClick={()=>changeMonth(-1)}>‹</button>
   <strong aria-live="polite">{monthLabel.format(first)}</strong>
   <button className="btn" type="button" aria-label="Next month" onClick={()=>changeMonth(1)}>›</button>
  </div>
  <div className="town-event-grid" role="group" aria-label={monthLabel.format(first)}>
   {Array.from({length:days},(_,index)=>{
    const day=index+1;
    const date=`${month}-${String(day).padStart(2,'0')}`;
    const dayEvents=events.filter(event=>event.date===date);
    const description=dayEvents.length?` · ${dayEvents.length} ${dayEvents.length===1?'event':'events'}`:'';
    return <button key={date} type="button" className="btn town-event-date"
     aria-label={dateLabel.format(new Date(date+'T12:00:00Z'))+description}
     aria-current={date.slice(5)===townEventClock.date.slice(5)?'date':undefined} aria-pressed={date===draft?.date}
     onClick={()=>{setFeedback('');setDraft({date,title:'',start:'16:00',end:'18:00'});}}>
     <span>{day}</span>
     {dayEvents.length>0&&<small aria-hidden="true">{dayEvents.some(event=>event.active)?'● ':''}{dayEvents[0].title}</small>}
    </button>;
   })}
  </div>
  {draft&&<section className="town-event-details" aria-label="Selected date">
   <h5>{dateLabel.format(new Date(draft.date+'T12:00:00Z'))}</h5>
   {selected.length>0&&<ul>{selected.map(event=><li key={event.id}>
    <strong>{event.title}{event.active?' · Happening now':''}</strong> <time>{event.start}–{event.end}</time>
   </li>)}</ul>}
   <form onSubmit={event=>{
    event.preventDefault();
    if(!validTownEvent(draft)){setFeedback('Enter an event name and an end time after the start time.');return;}
    onAddTownEvent(draft);
    setFeedback('Event added to Town Square.');
    setDraft({...draft,title:''});
   }}>
    <label>Event name <input ref={titleField} value={draft.title} required maxLength={80}
     onChange={event=>setDraft({...draft,title:event.target.value})}/></label>
    <div className="town-event-times">
     <label>Starts <input type="time" required value={draft.start} onChange={event=>setDraft({...draft,start:event.target.value})}/></label>
     <label>Ends <input type="time" required value={draft.end} onChange={event=>setDraft({...draft,end:event.target.value})}/></label>
    </div>
    <button className="btn" type="submit">Add event</button>
    <small>{draft.date.endsWith('-02-29')?'Repeats in leap years.':'Repeats every year.'}</small>
   </form>
   {feedback&&<p role="status">{feedback}</p>}
  </section>}
 </>;
}
