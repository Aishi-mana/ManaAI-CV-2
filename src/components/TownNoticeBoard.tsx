import {useEffect,useId,useRef,useState} from 'react';
import {ROOM_CONTACTS,pendingHostVisit,pendingVisitRequest,type PhoneMessage,type RoomContact} from '../core/roomPhone';
import TownEventGrid,{type TownEventGridProps} from './TownEventGrid';
import {townGuestbookNote,type TownGuestbookVisit} from '../core/townGuestbook';
import TownDecorationControls from './TownDecorationControls';
import type {TownDecorationSettings} from '../core/townFestivities';
import {townEventsForMonth} from '../core/townEvents';

export type TownNoticePlans=TownEventGridProps&{
 decorationSettings:TownDecorationSettings;
 onDecorationChange:(settings:TownDecorationSettings)=>void;
 messages:PhoneMessage[];
 meetup?:RoomContact;
 meetupPlace:'park'|'cafe';
 meetupStarted:boolean;
 sleeping:boolean;
 timeZone:string;
 guestbookEntries:readonly TownGuestbookVisit[];
};

export default function TownNoticeBoard({messages,meetup,meetupPlace,meetupStarted,sleeping,timeZone,guestbookEntries,decorationSettings,onDecorationChange,...calendar}:TownNoticePlans){
 const panelId=useId();
 const [open,setOpen]=useState(false);
 const [page,setPage]=useState<'notices'|'guestbook'|'decorations'>('notices');
 const trigger=useRef<HTMLButtonElement>(null);
 const panel=useRef<HTMLElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const close=()=>{
  setOpen(false);
  trigger.current?.focus();
 };
 useEffect(()=>{
  if(!open)return;
  closeButton.current?.focus({preventScroll:true});
  const dismiss=(event:PointerEvent)=>{
   if(event.target instanceof Element&&event.target.closest('[data-scene-editor]'))return;
   if(event.target instanceof Node&&!panel.current?.contains(event.target)&&!trigger.current?.contains(event.target))setOpen(false);
  };
  document.addEventListener('pointerdown',dismiss);
  return ()=>document.removeEventListener('pointerdown',dismiss);
 },[open]);
 const home=pendingVisitRequest(messages);
 const host=pendingHostVisit(messages);
 const time=new Intl.DateTimeFormat(undefined,{timeZone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const guestbookDate=new Intl.DateTimeFormat(undefined,{dateStyle:'long',timeZone:'UTC'});
 const meetupName=meetupPlace==='cafe'?'Coffee Shop':'Park';
 const notices=[
  ...(meetup?[{id:meetupPlace,title:`${meetupName} meetup with ${ROOM_CONTACTS[meetup].name}`,place:meetupPlace==='cafe'?'Coffee Shop':'Manaverse Park',
   status:meetupStarted?'In progress':'When both arrive',scheduledFor:undefined}]:[]),
  ...[home&&{id:'home',title:`Visit with ${ROOM_CONTACTS[home.contact].name}`,place:'Mana’s Living Space',
   status:sleeping?'Waiting for Mana to wake up':'Proposed',scheduledFor:home.scheduledFor},
  host&&{id:'host',title:host.kind==='library-story-invite'?'Lyra’s framed-note story':`Visit with ${ROOM_CONTACTS[host.contact].name}`,
   place:host.contact==='luna'?'Luna’s Home':'Lyra’s Library',
   status:host.confirmed?'Confirmed':sleeping?'Waiting for Mana to wake up':'Proposed',scheduledFor:host.scheduledFor}]
   .filter(notice=>notice!==undefined),
 ].sort((a,b)=>(a.scheduledFor??'').localeCompare(b.scheduledFor??''));

 return <>
  <button ref={trigger} type="button" className="town-notice-button" aria-controls={panelId}
   aria-expanded={open} aria-label="Notice board" onClick={()=>setOpen(value=>!value)}>
   <span aria-hidden="true">Notice board</span>
  </button>
  <section ref={panel} id={panelId} hidden={!open} className="town-notice-panel" role="dialog" aria-label="Town notice board"
   onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}}}>
   <header><h3>Town notice board</h3><button ref={closeButton} type="button" className="btn" onClick={close}>Close</button></header>
   <div className="town-notice-pages" role="group" aria-label="Town Hall pages">
    <button className="btn" type="button" aria-pressed={page==='notices'} onClick={()=>setPage('notices')}>Notices</button>
    <button className="btn" type="button" aria-pressed={page==='guestbook'} onClick={()=>setPage('guestbook')}>Guestbook</button>
    <button className="btn" type="button" aria-pressed={page==='decorations'} onClick={()=>setPage('decorations')}>Decorations</button>
   </div>
   {page==='guestbook'?(
    <section className="town-guestbook" aria-label="Guestbook">
     {guestbookEntries.length===0?<p>Entries appear here after characters attend a Town Square event.</p>:
      guestbookEntries.map(visit=><article key={JSON.stringify([visit.date,visit.id])}>
       <h4>{visit.title}</h4>
       <time dateTime={visit.date}>{guestbookDate.format(new Date(visit.date+'T12:00:00Z'))}</time>
       {visit.guests.map(guest=><blockquote key={guest}>
        <p>{townGuestbookNote(guest,visit)}</p>
        <footer>{guest}</footer>
       </blockquote>)}
      </article>)}
    </section>
   ):page==='decorations'?<TownDecorationControls settings={decorationSettings} onChange={onDecorationChange} clock={calendar.townEventClock}
    events={townEventsForMonth(calendar.townEventClock.date.slice(0,7),calendar.customTownEvents,calendar.townEventClock).filter(event=>event.active)}/>:<>
   <h4>Town Square events</h4>
   {open&&<TownEventGrid {...calendar}/>}
   <h4>Meetups and visits</h4>
   {notices.length===0?<p>No upcoming meetups or visits.</p>:<ul>
    {notices.map(notice=><li key={notice.id}>
     <strong>{notice.title}</strong>
     <div>{notice.place} · {notice.status}</div>
     {notice.scheduledFor&&<time dateTime={notice.scheduledFor}>{time.format(new Date(notice.scheduledFor))}</time>}
    </li>)}
   </ul>}
   </>}
  </section>
 </>;
}
