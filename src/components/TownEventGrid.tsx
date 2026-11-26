import {useEffect,useRef,useState} from 'react';
import {townEventsForMonth,validTownEvent,birthdayTitle,birthdayOwner,type CustomTownEvent,type TownEventCalendar,type TownEventDraft} from '../core/townEvents';
import {residentIds,residentProfiles} from '../core/residentProfiles';
import type {TownCharacter} from '../core/residentRelationships';

export type TownEventGridProps={
 townEventClock:TownEventCalendar['clock'];
 customTownEvents:readonly CustomTownEvent[];
 onAddTownEvent:(draft:TownEventDraft)=>void;
 onUpdateTownEvent?:(id:string,draft:TownEventDraft)=>boolean;
 onDeleteTownEvent?:(id:string)=>boolean;
};

const monthLabel=new Intl.DateTimeFormat(undefined,{month:'long',timeZone:'UTC'});
const dateLabel=new Intl.DateTimeFormat(undefined,{month:'long',day:'numeric',timeZone:'UTC'});

export default function TownEventGrid({townEventClock,customTownEvents,onAddTownEvent,onUpdateTownEvent,onDeleteTownEvent}:TownEventGridProps){
 // A leap year supplies month lengths for this annual calendar.
 const [month,setMonth]=useState('2000-'+townEventClock.date.slice(5,7));
 const [draft,setDraft]=useState<TownEventDraft>();
 const [feedback,setFeedback]=useState('');
 const [editing,setEditing]=useState<string>();
 const [deleting,setDeleting]=useState<string>();
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
  setEditing(undefined);setDeleting(undefined);
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
     onClick={()=>{setFeedback('');setEditing(undefined);setDeleting(undefined);setDraft({date,title:'',start:'16:00',end:'18:00'});}}>
     <span>{day}</span>
     {dayEvents.length>0&&<small aria-hidden="true">{dayEvents.some(event=>event.active)?'● ':''}{dayEvents[0].title}</small>}
    </button>;
   })}
  </div>
  {draft&&<section className="town-event-details" aria-label="Selected date">
   <h5>{dateLabel.format(new Date(draft.date+'T12:00:00Z'))}</h5>
   {selected.length>0&&<ul>{selected.map(event=><li key={event.id}>
    <strong>{event.title}{event.active?' · Happening now':''}</strong> <time>{event.start}–{event.end}</time>
    {customTownEvents.some(saved=>saved.id===event.id)?<div className="town-event-actions">
     <button className="btn" type="button" disabled={!onUpdateTownEvent} aria-label={`Edit ${event.title}`} onClick={()=>{
      const saved=customTownEvents.find(saved=>saved.id===event.id)!;
      setEditing(saved.id);setDeleting(undefined);setFeedback('');
      setDraft({title:saved.title,date:'2000-'+saved.date.slice(5),start:saved.start,end:saved.end,birthdayFor:birthdayOwner(saved)});
     }}>Edit</button>
     <button className="btn" type="button" disabled={!onDeleteTownEvent} aria-label={`Delete ${event.title}`} onClick={()=>setDeleting(event.id)}>Delete</button>
     {deleting===event.id&&<div role="group" aria-label={`Confirm deletion of ${event.title}`}>
      <p>Remove this annual event? Past memories and keepsakes will stay saved.</p>
      <button className="btn" type="button" onClick={()=>{
       if(!onDeleteTownEvent?.(event.id)){setFeedback('This event is no longer available.');return;}
       setDeleting(undefined);setFeedback('Annual event removed.');
       if(editing===event.id){setEditing(undefined);setDraft({...draft,title:'',birthdayFor:undefined});}
      }}>Remove event</button><button className="btn" type="button" onClick={()=>setDeleting(undefined)}>Keep event</button>
     </div>}
    </div>:<small>Town tradition</small>}
   </li>)}</ul>}
   <form onSubmit={event=>{
    event.preventDefault();
    if(!validTownEvent(draft)){setFeedback(draft.birthdayFor?'Choose a celebration of up to one hour between 08:00 and 21:00.':'Enter an event name and an end time after the start time.');return;}
    if(editing){
     if(!onUpdateTownEvent?.(editing,draft)){setFeedback('This event could not be updated. Reopen it and try again.');return;}
     setMonth(draft.date.slice(0,7));setEditing(undefined);setFeedback('Annual event updated.');
    }else{onAddTownEvent(draft);setFeedback(draft.birthdayFor?'Birthday saved. Saving another date for this character replaces it.':'Event added to Town Square.');}
    if(!draft.birthdayFor)setDraft({...draft,title:''});
   }}>
    <h5>{editing?'Edit annual event':'Add an annual event'}</h5>
    {editing&&<div className="town-event-times">
     <label>Month <select aria-label="Event month" value={Number(draft.date.slice(5,7))} onChange={event=>{
      const nextMonth=Number(event.target.value),lastDay=new Date(Date.UTC(2000,nextMonth,0)).getUTCDate();
      setDraft({...draft,date:`2000-${String(nextMonth).padStart(2,'0')}-${String(Math.min(Number(draft.date.slice(8)),lastDay)).padStart(2,'0')}`});
     }}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{monthLabel.format(new Date(Date.UTC(2000,i,1)))}</option>)}</select></label>
     <label>Day <select aria-label="Event day" value={Number(draft.date.slice(8))} onChange={event=>setDraft({...draft,date:draft.date.slice(0,8)+event.target.value.padStart(2,'0')})}>
      {Array.from({length:new Date(Date.UTC(2000,Number(draft.date.slice(5,7)),0)).getUTCDate()},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
     </select></label>
    </div>}
    <label>Event type <select disabled={!!editing} value={draft.birthdayFor??'custom'} onChange={event=>{
     const owner=event.target.value==='custom'?undefined:event.target.value as TownCharacter;
     setDraft({...draft,birthdayFor:owner,title:owner?birthdayTitle(owner):'',start:'16:00',end:owner?'16:30':'18:00'});
    }}><option value="custom">Custom event</option>{(['mana',...residentIds] as TownCharacter[]).map(owner=><option key={owner} value={owner}>{owner==='mana'?'Mana':residentProfiles[owner].name}’s birthday</option>)}</select></label>
    <label>Event name <input ref={titleField} value={draft.title} required maxLength={80} readOnly={!!draft.birthdayFor}
     onChange={event=>setDraft({...draft,title:event.target.value})}/></label>
    <div className="town-event-times">
     <label>Starts <input type="time" required value={draft.start} onChange={event=>setDraft({...draft,start:event.target.value})}/></label>
     <label>Ends <input type="time" required value={draft.end} onChange={event=>setDraft({...draft,end:event.target.value})}/></label>
    </div>
    <button className="btn" type="submit">{editing?'Save changes':draft.birthdayFor?'Save birthday':'Add event'}</button>
    {editing&&<button className="btn" type="button" onClick={()=>{
     const original=customTownEvents.find(event=>event.id===editing),date=original?'2000-'+original.date.slice(5):draft.date;
     setEditing(undefined);setDeleting(undefined);setMonth(date.slice(0,7));setDraft({date,title:'',start:'16:00',end:'18:00'});setFeedback('Changes cancelled.');
    }}>Cancel editing</button>}
    <small>{draft.birthdayFor?'Repeats yearly. February 29 birthdays use February 28 in other years.':draft.date.endsWith('-02-29')?'Repeats in leap years.':'Repeats every year.'}</small>
   </form>
   {feedback&&<p role="status">{feedback}</p>}
  </section>}
 </>;
}
