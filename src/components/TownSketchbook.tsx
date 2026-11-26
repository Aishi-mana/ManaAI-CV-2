import {useMemo,useState} from 'react';
import {townSketchbookDays,filterTownSketchbook,sketchbookPeople,type TownSketchMoment} from '../core/townSketchbook';
import type {RecordedEvent} from '../core/events';
import type {SharedMemory} from '../core/residentRelationships';
import {friendName,type Friend} from '../core/friendshipHabits';
import {residentProfiles} from '../core/residentProfiles';
import {manaversePlaces,type ManaverseArea} from './ManaverseMap';

const portrait=(person:Friend)=>person==='mana'?'./companion-room/mana_idle_1.png':person==='aishi'?'./companion-room/aishi-sprites.png':residentProfiles[person].avatar;
function People({people}:{people:Friend[]}){
 return <span className="town-sketchbook-people" aria-label={people.map(friendName).join(', ')}>
  {people.map(person=><span key={person} aria-hidden="true" className="town-sketchbook-portrait" data-person={person} style={{backgroundImage:`url("${portrait(person)}")`}}/>)}
 </span>;
}
function placeArt(area?:ManaverseArea){
 const map=area==='park'?'park-small-pond':area==='square'||area==='town-hall'?'square':['cafe','workshop','office','district'].includes(area??'')?'second-street':'street';
 return `./companion-room/manaverse-${map}.webp`;
}
const kindLabels={sketch:'By the pond',read:'A quiet chapter',tinker:'At the workbench',favor:'A little help',evening:'Winding down',visit:'Time together',project:'A little project'};
function Doodle({kind}:{kind:TownSketchMoment['kind']}){
 return <svg viewBox="0 0 40 40" className="town-sketchbook-doodle" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  {kind==='read'?<><path d="M20 12Q12 7 5 11v21q8-4 15 0 7-4 15 0V11q-7-4-15 1v20"/><path d="m10 17 6 1m8 0 6-1"/></>:
   kind==='sketch'?<><path d="m9 27 17-17 5 5-17 17-7 2zM23 13l5 5M9 27l5 5"/><path d="M5 37h30"/></>:
   kind==='tinker'||kind==='project'?<><circle cx="20" cy="20" r="9"/><circle cx="20" cy="20" r="3"/>{[0,45,90,135,180,225,270,315].map(angle=><path key={angle} d="M20 5v5" transform={`rotate(${angle} 20 20)`}/>)}</>:
   kind==='evening'?<><path d="M26 6a14 14 0 1 0 8 24A15 15 0 0 1 26 6Z"/><path d="m9 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></>:
   kind==='favor'?<><path d="m7 22 9 9 18-19M8 8v6m-3-3h6"/></>:
    <><path d="M8 15h21v10a9 9 0 0 1-18 0V15M29 17h3a5 5 0 0 1 0 10h-3M6 36h28M15 4v5m8-5v5"/></>}
 </svg>;
}
const dateLabel=(date:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));

export default function TownSketchbook({events,memories,timeZone,date,onOpenDay,onViewPlace}:{events:RecordedEvent[];memories:SharedMemory[];timeZone:string;date?:string;onOpenDay:(date:string)=>void;onViewPlace:(area:ManaverseArea)=>void}){
 const [person,setPerson]=useState<Friend|'all'>('all'),[query,setQuery]=useState('');
 const days=useMemo(()=>townSketchbookDays(events,memories,timeZone),[events,memories,timeZone]);
 const filtered=filterTownSketchbook(days,person,query),page=date?filtered.find(day=>day.date===date):undefined;
 return <div className="room-phone-list town-sketchbook">
  <p className="town-sketchbook-intro">Little moments from life in town.</p>
  <div className="town-sketchbook-filters">
   <label>With<select aria-label="Sketchbook character" value={person} onChange={event=>setPerson(event.target.value as Friend|'all')}><option value="all">Everyone</option>{sketchbookPeople.map(person=><option key={person} value={person}>{friendName(person)}</option>)}</select></label>
   <label>Find a moment<input type="search" aria-label="Find a sketchbook moment" value={query} onChange={event=>setQuery(event.target.value)} placeholder="A place, favor, or date…"/></label>
  </div>
  {date?<>
   <h3><time dateTime={date}>{dateLabel(date)}</time></h3>
   {page?.moments.length?page.moments.map(moment=><article className="town-sketchbook-moment" key={moment.id}>
    <div className="town-sketchbook-place-art"><img loading="lazy" src={placeArt(moment.area)} alt=""/><Doodle kind={moment.kind}/><span>{kindLabels[moment.kind]}</span></div>
    <div className="town-sketchbook-moment-body"><People people={moment.people}/><h4>{moment.title}</h4>
     <p className="town-sketchbook-byline">{moment.people.map(friendName).join(' · ')}<time dateTime={moment.at}> · {new Intl.DateTimeFormat(undefined,{timeZone,hour:'numeric',minute:'2-digit'}).format(new Date(moment.at))}</time></p>
     <p>{moment.text}</p>
     {moment.area&&<button className="btn" type="button" onClick={()=>onViewPlace(moment.area!)}>View {manaversePlaces[moment.area]}</button>}
    </div>
   </article>):<p>No matching moments on this page. Try Everyone or clear your search.</p>}
  </>:filtered.length?<div className="town-sketchbook-days">{filtered.map(day=>{
   const cover=day.moments[0],people=sketchbookPeople.filter(person=>day.moments.some(moment=>moment.people.includes(person)));
   return <button className="town-sketchbook-day" type="button" key={day.date} aria-label={`Open town sketchbook for ${day.date}`} onClick={()=>onOpenDay(day.date)}>
    <div className="town-sketchbook-day-cover"><img loading="lazy" src={placeArt(cover.area)} alt=""/><Doodle kind={cover.kind}/></div>
    <time dateTime={day.date}>{dateLabel(day.date)}</time><People people={people}/><span>{day.moments.length} {day.moments.length===1?'moment':'moments'}</span>
   </button>;
  })}</div>:<p>{days.length?'No matching moments. Try Everyone or clear your search.':'Your first pages will appear after a shared activity, small favor, workshop session, or evening wind-down.'}</p>}
 </div>;
}
