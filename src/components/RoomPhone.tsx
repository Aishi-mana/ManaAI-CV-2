import {townPortraits} from '../core/townPortraits';
import KeepsakeAlbum from './KeepsakeAlbum';
import {keepDialogFocus} from '../core/dialogFocus';
import {keepsakeAlbumEntries} from '../core/keepsakeAlbum';
import type {ActivityKeepsake} from '../core/activityKeepsakes';
import type {TownGuestbookVisit} from '../core/townGuestbook';
import TownToday from './TownToday';
import TownWeatherControls from './TownWeather';
import type {TownTodayState} from '../core/townToday';
import {latestPhoneIncoming,phoneMessageReadKey,unreadPhoneContacts,type PhoneReadState} from '../core/phoneReadState';
import TownPersonalGoals from './TownPersonalGoals';
import TownDailyIntentions from './TownDailyIntentions';
import FriendshipHabits from './FriendshipHabits';
import TownSketchbook from './TownSketchbook';
import TownProjects from './TownProjects';
import type {TownPersonalGoal,TownGoalId} from '../core/townPersonalGoals';
import type {PetBotFriends} from '../core/petBot';
import type {SharedMemory,TownCharacter} from '../core/residentRelationships';
import type {Memory} from '../core/character';
import {ROOM_ART} from '../core/companionRoom';
import {homeStoryDays,type RecordedEvent} from '../core/events';
import {type PondSketchGoal} from '../core/pondSketch';
import type {LibraryStory} from '../core/libraryStory';
import type {ManaKeepsake} from '../core/manaKeepsake';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import ManaverseMap,{type ManaverseArea,type MapCharacters} from './ManaverseMap';
import {ROOM_CONTACTS,pendingHostVisit,pendingVisitRequest,phoneMessage,phoneReply,visitIsDue,phoneCanSend,type PhoneMessage,type RoomContact} from '../core/roomPhone';

const phoneApps=[
 {id:'weather',label:'Weather',art:<><path d="M6 15a4 4 0 1 1 1-8 5 5 0 0 1 10-1 4.5 4.5 0 0 1 0 9H6"/><path d="m7 18-1 3m6-3-1 3m6-3-1 3"/></>},
 {id:'contacts',label:'Contacts',art:<><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></>},
 {id:'messages',label:'Messages',art:<><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8m-8 3h6"/></>},
 {id:'map',label:'Map',art:<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>},
 {id:'stories',label:'Home Stories',art:<path d="M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2zm0 15a2 2 0 0 1 2-2h12M9 7h6m-6 4h6"/>},
 {id:'town-sketchbook',label:'Town Sketchbook',art:<><path d="M5 4h25v32H5zM10 4v32" transform="scale(.6) translate(4 1)"/><path d="m10 15 6-6 3 3-6 6-4 1z"/></>},
 {id:'keepsake-album',label:'Keepsake Album',art:<><path d="M4 3h16v18H4zM7 3v18"/><path d="m14 7 1 3 3 .2-2.3 2 1 3-2.7-1.7-2.7 1.7 1-3-2.3-2 3-.2z"/></>},
 {id:'town-projects',label:'Little Projects',art:<><path d="M5 4h14v17H5zM9 2v4h6V2"/><path d="m8 11 2 2 5-5m-7 9h8"/></>},
 {id:'memories',label:'Memories',art:<><path d="M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2zm0 15a2 2 0 0 1 2-2h12"/><path d="m9 8 2 2 4-4"/></>},
 {id:'today',label:'Today',art:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>},
 {id:'plans',label:'Plans',art:<><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4"/></>},
] as const;

type PhoneApp=typeof phoneApps[number];
const memoryCharacters=[
 {id:'mana',name:'Mana',avatar:'./companion-room/mana_idle_1.webp'},
 ...(Object.keys(ROOM_CONTACTS) as RoomContact[]).map(id=>({id,...ROOM_CONTACTS[id],avatar:townPortraits[id].path})),
 {id:'pet-bot',name:'Pet Bot',avatar:ROOM_ART+'pet_bot.webp'},
] satisfies {id:TownCharacter|'pet-bot';name:string;avatar:string}[];

function PhoneAppIcon({app,unread}:{app:PhoneApp;unread:boolean}){
 return <span className="room-phone-app-icon" data-app={app.id} data-unread={app.id==='messages'&&unread} aria-hidden="true">
  <svg viewBox="0 0 24 24">{app.art}</svg>
 </span>;
}

export default function RoomPhone({activityKeepsakes=[],birthdayVisits=[],onStartTownProject,preferenceSummaries=[],backgroundActive,visible,sleeping,messages,onSend,readMessages,onReadMessages,timeZone,events,projects,meetup,meetupPlace,area,characters,onChooseArea,onMapOpenChange,diving,pondSketch,libraryStory,manaKeepsake,sharedKeepsake,coreMemories,onForgetMemory,sharedMemories,onForgetSharedMemory,petBotMemories,onForgetPetMemory,manaMemories,onForgetManaMemory,petBotFriends,onForgetPetFriend,personalGoals,today}:{
 backgroundActive?:boolean;activityKeepsakes?:ActivityKeepsake[];birthdayVisits?:TownGuestbookVisit[];
 onStartTownProject?:(owner:TownCharacter,choice:TownGoalId)=>boolean;
 preferenceSummaries?:{owner:TownCharacter;likes:string[];reason?:string}[];
 readMessages:PhoneReadState;onReadMessages:(read:PhoneReadState)=>void;
 today:TownTodayState;
 personalGoals:TownPersonalGoal[];
 petBotFriends:PetBotFriends;
 onForgetPetFriend:(contact:RoomContact)=>void;
 manaMemories:Memory[];
 onForgetManaMemory:(id:string)=>void;
 sharedMemories:SharedMemory[];
 onForgetSharedMemory:(id:string)=>void;
 petBotMemories:string[];
 onForgetPetMemory:(fact:string)=>void;
 coreMemories:Partial<Record<RoomContact,string[]>>;
 onForgetMemory:(resident:RoomContact,fact:string)=>void;
 diving?:boolean;visible:boolean;sleeping:boolean;messages:PhoneMessage[];onSend:(message:PhoneMessage)=>void;
 timeZone:string;events:RecordedEvent[];projects:Parameters<typeof homeStoryDays>[1];
 meetup?:RoomContact;meetupPlace:'park'|'cafe';
 area:ManaverseArea;characters:MapCharacters;onChooseArea:(area:ManaverseArea)=>void;onMapOpenChange:(open:boolean)=>void;
 pondSketch?:PondSketchGoal;libraryStory?:LibraryStory;manaKeepsake?:ManaKeepsake;sharedKeepsake?:ManaKeepsake;
}){
 const phoneActive=backgroundActive??visible;
 const [open,setOpen]=useState(false);
 const [screen,setScreen]=useState<'home'|'thread'|'memory-details'|'town-sketchbook-day'|'town-project-detail'|'keepsake-owner'|PhoneApp['id']>('home');
 const [albumOwner,setAlbumOwner]=useState<TownCharacter>('mana');
 const album=useMemo(()=>open&&(screen==='keepsake-album'||screen==='keepsake-owner')?keepsakeAlbumEntries(activityKeepsakes,personalGoals,birthdayVisits,events,sharedMemories,timeZone):[],[open,screen,activityKeepsakes,personalGoals,birthdayVisits,events,sharedMemories,timeZone]);
 const [projectOwner,setProjectOwner]=useState<TownCharacter>('mana');
 const [sketchbookDay,setSketchbookDay]=useState<string>();
 const [shortcutsOpen,setShortcutsOpen]=useState(false);
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{
  if(!open||screen!=='plans'&&screen!=='today')return;
  setNow(Date.now());
  const timer=window.setInterval(()=>setNow(Date.now()),1000);
  return ()=>clearInterval(timer);
 },[open,screen]);
 const stories=useMemo(()=>open&&screen==='stories'?homeStoryDays(events,projects,timeZone):[],[open,screen,events,projects,timeZone]);
 const heading=useRef<HTMLHeadingElement>(null);
 const shell=useRef<HTMLDivElement>(null);
 const button=useRef<HTMLButtonElement>(null);
 const launcher=useRef<HTMLButtonElement|null>(null);
 const end=useRef<HTMLDivElement>(null);
 const send=useRef(onSend);
 send.current=onSend;
 const [historyShown,setHistoryShown]=useState(40);
 const [memoryOwner,setMemoryOwner]=useState<TownCharacter|'pet-bot'>('mana');
 useEffect(()=>{setHistoryShown(40);},[screen,memoryOwner]);
 const [contact,setContact]=useState<RoomContact>('luna');
 const profile=ROOM_CONTACTS[contact];
 const thread=messages.filter(message=>message.contact===contact);
 const latest=thread[thread.length-1];
 const pendingVisit=pendingVisitRequest(messages);
 const hostVisit=pendingHostVisit(messages);
 const incoming=latestPhoneIncoming(messages);
 const incomingKey=incoming[contact]?phoneMessageReadKey(incoming[contact]!):undefined;
 const unreadContacts=unreadPhoneContacts(messages,readMessages);
 const unread=unreadContacts.length>0;
 const unreadAt=unreadContacts.map(id=>phoneMessageReadKey(incoming[id]!)).join(';');
 useEffect(()=>{
  if(!visible)setOpen(false);
 },[visible]);
 useEffect(()=>{
  onMapOpenChange(open&&visible&&screen==='map');
 },[open,visible,screen,onMapOpenChange]);
 useEffect(()=>{
  if(open&&screen==='thread'&&visible&&incomingKey&&readMessages[contact]!==incomingKey)onReadMessages({[contact]:incomingKey});
 },[open,screen,visible,contact,incomingKey,readMessages,onReadMessages]);
 useEffect(()=>{
  if(!open)return;
  heading.current?.focus({preventScroll:true});
  if(screen!=='thread')shell.current?.querySelectorAll<HTMLElement>('.room-phone-list, .room-phone-apps').forEach(page=>{page.scrollTop=0;});
 },[open,screen,memoryOwner,albumOwner,projectOwner,sketchbookDay]);
 useEffect(()=>{
  if(open&&end.current?.parentElement)end.current.parentElement.scrollTop=end.current.parentElement.scrollHeight;
 },[open,screen,contact,latest]);
 useEffect(()=>{
  if(!phoneActive)return;
  let timers:ReturnType<typeof window.setTimeout>[]=[];
  const schedule=()=>{
   timers.forEach(clearTimeout);
   if(!phoneCanSend(new Date(),timeZone,sleeping)){timers=[];return;}
   timers=(Object.keys(ROOM_CONTACTS) as RoomContact[]).flatMap(id=>{
   const message=[...messages].reverse().find(item=>item.contact===id);
   const response=message?.text&&phoneReply(message.kind);
   if(!response)return [];
   return [window.setTimeout(()=>{if(phoneCanSend(new Date(),timeZone,sleeping))send.current(phoneMessage(id,response));},response==='reply-to-mana'?2200:8000)];
  });
  };
  schedule();
  const wakeCheck=window.setInterval(schedule,15_000);
  return ()=>{timers.forEach(clearTimeout);clearInterval(wakeCheck);};
 },[phoneActive,sleeping,timeZone,messages]);
 const launch=(destination:'home'|PhoneApp['id'],trigger:HTMLButtonElement)=>{
  launcher.current=trigger;
  setScreen(destination);
  setOpen(true);
 };
 const close=()=>{setOpen(false);launcher.current?.focus();};
 const room=open&&visible?button.current?.closest('.companion-room'):null;
 const back=()=>setScreen(screen==='thread'?'messages':screen==='memory-details'?'memories':screen==='town-sketchbook-day'?'town-sketchbook':screen==='town-project-detail'?'town-projects':screen==='keepsake-owner'?'keepsake-album':'home');
 const memoryName=memoryCharacters.find(character=>character.id===memoryOwner)!.name;
 const title={home:'Mana’s phone','keepsake-album':'Keepsake Album','keepsake-owner':`${albumOwner==='mana'?'Mana':ROOM_CONTACTS[albumOwner].name}’s keepsakes`,weather:'Town weather',contacts:'Contacts',messages:'Messages',thread:profile.name,map:'Manaverse Map',stories:'Home Stories',plans:'Plans',today:'Today around town',memories:'Memories','memory-details':`${memoryName}’s memories`,'town-sketchbook':'Town Sketchbook','town-sketchbook-day':'A day in town','town-projects':'Little Projects','town-project-detail':`${projectOwner==='mana'?'Mana':ROOM_CONTACTS[projectOwner].name}’s projects`}[screen];
 const visitStatus=(visit:PhoneMessage,confirmed=false)=>{
  if(!visit.scheduledFor)return sleeping?'Waiting until Mana wakes up':confirmed?'Confirmed':'Proposed';
  const time=clock.format(new Date(visit.scheduledFor));
  if(!visitIsDue(visit,now))return `Scheduled · ${time}`;
  return sleeping?`Was due ${time} · Waiting until Mana wakes up`:`Due since ${time} · Starts when both are free`;
 };
 const homeTime=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZone});
 const clock=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone});
 return <>
  {visible&&<div className="room-phone-shortcuts">
   <button type="button" className="btn room-phone-shortcut" aria-expanded={shortcutsOpen}
    aria-controls="room-phone-shortcut-apps" aria-label={shortcutsOpen?'Hide phone shortcuts':'Show phone shortcuts'}
    title={shortcutsOpen?'Hide phone shortcuts':'Show phone shortcuts'} onClick={()=>setShortcutsOpen(value=>!value)}>
    <span aria-hidden="true">{shortcutsOpen?'<':'>'}</span>
   </button>
   <div className="room-phone-shortcut-apps" id="room-phone-shortcut-apps" hidden={!shortcutsOpen}>
    {phoneApps.map(app=><button key={app.id} type="button" className="btn room-phone-shortcut"
     aria-label={app.id==='messages'&&unread?'Messages, unread messages':app.label} title={app.label}
     aria-haspopup="dialog" onClick={event=>launch(app.id,event.currentTarget)}>
     <PhoneAppIcon app={app} unread={unread}/>
    </button>)}
   </div>
  </div>}
  {visible&&<button ref={button} className="btn room-phone-button" data-unread={unread}
   aria-label={unread?'Phone, new message':'Phone'} title={unread?'New message':'Phone'}
   aria-haspopup="dialog" aria-expanded={open} aria-controls="room-phone"
   onClick={event=>launch('home',event.currentTarget)}>
   <svg key={unreadAt} className="room-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="6" y="2.5" width="12" height="19" rx="2.5"/>
    <path d="M10.5 18h3" strokeLinecap="round"/>
   </svg>
  </button>}
  {room&&createPortal(<div className="room-phone-overlay"
   onClick={event=>{if(event.target===event.currentTarget)close();}}>
   <section className="room-phone" id="room-phone" role="dialog" aria-modal="true" aria-labelledby="room-phone-title"
    onKeyDown={event=>{keepDialogFocus(event);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}>
   <div ref={shell} className="room-phone-shell" data-screen={screen}>
    <div className="room-phone-top">
     <span>{homeTime.format(new Date())}</span>
     <span className="room-phone-camera" aria-hidden="true"/>
     <button className="btn room-phone-close" onClick={close} aria-label="Close phone">×</button>
    </div>
    <div className="room-phone-header">
     {screen!=='home'&&<button className="btn" onClick={back} aria-label="Back">‹</button>}
     <h2 id="room-phone-title" ref={heading} tabIndex={-1}>{title}</h2>
    </div>
    {screen==='home'&&<nav className="room-phone-apps" aria-label="Phone apps">
     {phoneApps.map(app=><button key={app.id} onClick={()=>setScreen(app.id)}>
      <PhoneAppIcon app={app} unread={unread}/>
      {app.label}
      {app.id==='messages'&&unread&&<span className="room-phone-sr-only">, unread messages</span>}
     </button>)}
    </nav>}
    {screen==='stories'&&<div className="room-phone-list room-phone-stories">
     {stories.length===0?<p>Completed room activities and published games will appear here.</p>:
      stories.slice(0,historyShown).map(({date,entries})=><details key={date}>
       <summary><time dateTime={date}>{date}</time> · {entries.length} {entries.length===1?'moment':'moments'}</summary>
       <ul>{entries.map((entry,index)=><li key={index}>{entry}</li>)}</ul>
      </details>)}
     {stories.length>historyShown&&<button className="btn" type="button" onClick={()=>setHistoryShown(value=>value+40)}>Load older story days</button>}
    </div>}
    {(screen==='town-sketchbook'||screen==='town-sketchbook-day')&&<TownSketchbook events={events} memories={sharedMemories} timeZone={timeZone}
     date={screen==='town-sketchbook-day'?sketchbookDay:undefined} onOpenDay={date=>{setSketchbookDay(date);setScreen('town-sketchbook-day');}}
     onViewPlace={destination=>{onChooseArea(destination);close();}}/>}
    {(screen==='keepsake-album'||screen==='keepsake-owner')&&<KeepsakeAlbum key={screen==='keepsake-owner'?albumOwner:'grid'} entries={album} owner={screen==='keepsake-owner'?albumOwner:undefined} timeZone={timeZone} onOpenOwner={owner=>{setAlbumOwner(owner);setScreen('keepsake-owner');}}/>}
    {(screen==='town-projects'||screen==='town-project-detail')&&<TownProjects goals={personalGoals} owner={screen==='town-project-detail'?projectOwner:undefined} timeZone={timeZone}
     onOpenOwner={owner=>{setProjectOwner(owner);setScreen('town-project-detail');}} onStart={onStartTownProject}/>}
    {screen==='map'&&<ManaverseMap diving={diving} area={area} characters={characters}
     onChoose={destination=>{onChooseArea(destination);close();}}/>}
    {screen==='weather'&&<div className="room-phone-list"><TownWeatherControls/></div>}
    {screen==='today'&&<TownToday state={today} pendingVisit={pendingVisit} hostVisit={hostVisit} timeZone={timeZone} now={now}
     onView={destination=>{onChooseArea(destination);close();}}/>}
    {screen==='plans'&&<div className="room-phone-list room-phone-plans">
     <TownDailyIntentions goals={personalGoals} timeZone={timeZone} now={now}/>
     <FriendshipHabits memories={sharedMemories}/>
     <TownPersonalGoals goals={personalGoals}/>
     {!!preferenceSummaries.length&&<section aria-label="Free-time preferences"><h3>Free-time preferences</h3>
      {preferenceSummaries.map(preference=><article key={preference.owner}>
       <strong>{preference.owner==='mana'?'Mana':ROOM_CONTACTS[preference.owner].name}</strong>
       <p>Usually enjoys: {preference.likes.join(', ')}.</p>
       <p>{preference.reason??'Her usual interests; saved memories may shape these over time.'}</p>
      </article>)}
      <p>These gently influence spare-time choices. Appointments, sleep, and travel still follow the town schedule.</p>
     </section>}
     {manaKeepsake&&<article>
      <strong>Mana’s photo board keepsake</strong>
      <p>{manaKeepsake.pinned?'Pinned to the photo board':sleeping?'Waiting until Mana wakes up':
       manaKeepsake.spot&&!manaKeepsake.revisited?'Moment chosen · Revisiting the spot next':'Waiting for time at the photo board'}</p>
      <p>{manaKeepsake.moment}</p>
      {manaKeepsake.pinned&&<p>“{manaKeepsake.caption}”</p>}
     </article>}
     {sharedKeepsake?.shared&&<article>
      <strong>Shared keepsake with {ROOM_CONTACTS[sharedKeepsake.shared.contact].name}</strong>
      <p>{sharedKeepsake.pinned?'Pinned to the photo board':sharedKeepsake.shared.answered?'Reply received · Waiting for time at the photo board':
       sleeping?'Waiting until Mana wakes up':'Moment chosen · Mana will ask what her friend remembers'}</p>
      <p>{sharedKeepsake.moment}</p>
      {sharedKeepsake.shared.answered&&<p>“{sharedKeepsake.caption}”</p>}
     </article>}
     {libraryStory&&hostVisit?.kind!=='library-story-invite'&&<article>
      <strong>Lyra’s story of the framed note</strong>
      <p>{libraryStory.stage==='finished'?'Saved in Home Stories':libraryStory.stage==='deferred'?'Lyra kept her draft and will try another day.':'Lyra has started a draft.'}</p>
      {libraryStory.stage==='finished'&&<button className="btn" onClick={()=>setScreen('stories')}>Open Home Stories</button>}
     </article>}
     {pondSketch&&<article>
      <strong>Luna’s pond sketch</strong>
      <p>{pondSketch.status==='finished'?'Finished together':pondSketch.status==='deferred'?'Luna will follow up on another day.':
       meetup==='luna'&&meetupPlace==='park'?'Meetup in progress':'Luna invited Mana to finish the sketch with her.'}</p>
     </article>}
     {meetup&&<article>
      <strong>{meetupPlace==='cafe'?'Coffee Shop':'Park'} meetup with {ROOM_CONTACTS[meetup].name}</strong>
      <p>Confirmed · {meetupPlace==='cafe'?'Table by the window':'Bench by the pond'}</p>
      <button className="btn" onClick={()=>{onChooseArea(meetupPlace);close();}}>View {meetupPlace==='cafe'?'Coffee Shop':'park'}</button>
     </article>}
     {pendingVisit&&<article>
      <strong>Visit with {ROOM_CONTACTS[pendingVisit.contact].name}</strong>
      <p>Mana’s living space · {visitStatus(pendingVisit)}</p>
      <button className="btn" onClick={()=>{onChooseArea('living');close();}}>View living space</button>
     </article>}
     {hostVisit&&<article>
      <strong>{hostVisit.kind==='library-story-invite'?'Lyra’s story of the framed note':hostVisit.contact==='luna'?'Luna’s Home':'Lyra’s Library'}</strong>
      <p>{visitStatus(hostVisit,hostVisit.confirmed)}</p>
      <button className="btn" onClick={()=>{onChooseArea(ROOM_CONTACTS[hostVisit.contact].home);close();}}>View destination</button>
     </article>}
     {!meetup&&!pendingVisit&&!hostVisit&&!personalGoals.length&&<p>No upcoming plans.</p>}
    </div>}
    {(screen==='contacts'||screen==='messages')&&<div className="room-phone-list">
     {screen==='messages'&&unread&&<button className="btn" type="button" onClick={()=>onReadMessages(Object.fromEntries(
      unreadContacts.map(id=>[id,phoneMessageReadKey(incoming[id]!)])))}>Mark all read</button>}
     {(Object.keys(ROOM_CONTACTS) as RoomContact[]).map(id=>{
      const person=ROOM_CONTACTS[id];
      const preview=[...messages].reverse().find(message=>message.contact===id);
      const newMessage=unreadContacts.includes(id);
      return <button key={id} className="room-phone-row" onClick={()=>{setContact(id);setScreen('thread');}}>
       <img src={townPortraits[id].path} alt=""/>
       <span><strong>{person.name}</strong><small>{screen==='contacts'?person.description:preview?(preview.text??'Waiting for AI message…'):'No messages yet'}</small></span>
       {screen==='messages'&&newMessage&&<span className="room-phone-new" aria-label="Unread"/>}
      </button>;
     })}
    </div>}
    {screen==='memories'&&<div className="room-phone-list">
     <div className="room-phone-memory-characters" role="group" aria-label="Whose memories?">
      {memoryCharacters.map(character=><button key={character.id} type="button" className="btn"
       onClick={()=>{setMemoryOwner(character.id);setScreen('memory-details');}}>
       <img src={character.avatar} alt="" draggable={false}/>
       <span>{character.name}</span>
      </button>)}
     </div>
    </div>}
    {screen==='memory-details'&&<div className="room-phone-list" key={memoryOwner}>
     {memoryOwner!=='mana'&&<section className="room-phone-memory-facts">
      <h3>Core memories</h3>
      {(memoryOwner==='pet-bot'?petBotMemories:coreMemories[memoryOwner]??[]).length?
       <ul>{(memoryOwner==='pet-bot'?petBotMemories:coreMemories[memoryOwner]??[]).map(fact=><li key={fact}>
        <span>{fact}</span>
        <button type="button" className="btn" aria-label={`Forget: ${fact}`} onClick={()=>{
         if(memoryOwner==='pet-bot')onForgetPetMemory(fact);
         else onForgetMemory(memoryOwner,fact);
        }}>Forget</button>
       </li>)}</ul>:<p>No saved core memories.</p>}
     </section>}
     {memoryOwner==='pet-bot'&&<section className="room-phone-memory-facts">
      <h3>Friends met at home</h3>
      {Object.keys(petBotFriends).length?<ul>{(Object.keys(petBotFriends) as RoomContact[]).map(contact=><li key={contact}>
       <span>{ROOM_CONTACTS[contact].name}<br/><small>{petBotFriends[contact]!.visits} visits · Last met {clock.format(new Date(petBotFriends[contact]!.lastMetAt))}</small></span>
       <button type="button" className="btn" onClick={()=>onForgetPetFriend(contact)}>Forget</button>
      </li>)}</ul>:<p>No friends met yet.</p>}
     </section>}     {memoryOwner==='mana'&&<section className="room-phone-memory-facts">
      <h3>Core memories</h3>
      {manaMemories.length?<ul>{manaMemories.map(memory=><li key={memory.id}>
       <span>{memory.content}</span>
       <button type="button" className="btn" aria-label={`Forget: ${memory.content}`} onClick={()=>onForgetManaMemory(memory.id)}>Forget</button>
      </li>)}</ul>:<p>No saved core memories.</p>}
     </section>}
     {memoryOwner!=='pet-bot'&&<section className="room-phone-memory-facts">
      <h3>Shared activities</h3>
      {sharedMemories.some(memory=>memory.owner===memoryOwner)?
       <ul>{sharedMemories.filter(memory=>memory.owner===memoryOwner).slice().reverse().slice(0,historyShown).map(memory=><li key={memory.id}>
        <span>{memory.fact}<br/><small>{clock.format(new Date(memory.at))}</small></span>
        <button type="button" className="btn" aria-label={`Forget: ${memory.fact}`} onClick={()=>onForgetSharedMemory(memory.id)}>Forget</button>
       </li>)}</ul>:<p>No shared activities remembered yet.</p>}
      {sharedMemories.filter(memory=>memory.owner===memoryOwner).length>historyShown&&<button className="btn" type="button" onClick={()=>setHistoryShown(value=>value+40)}>Load older shared memories</button>}
     </section>}
    </div>}
    {screen==='thread'&&<>
   <div className="companion-room-stories-list room-phone-thread" role="log" aria-label={`Conversation with ${profile.name}`}>
    {thread.length===0&&<p>No messages yet.</p>}
    {thread.map((message,index)=><article key={`${message.at}-${index}`} data-from={message.from}>
     <small>{message.from==='mana'?'Mana':ROOM_CONTACTS[message.contact].name} · <time dateTime={message.at}>{clock.format(new Date(message.at))}</time></small>
     <p>{message.text??'Waiting for AI message…'}</p>
    </article>)}
    <div ref={end}/>
   </div>
    </>}
    {screen!=='home'&&<button className="room-phone-home" onClick={()=>setScreen('home')} aria-label="Phone home"><span/></button>}
   </div>
   </section>
  </div>,room)}
 </>;
}


