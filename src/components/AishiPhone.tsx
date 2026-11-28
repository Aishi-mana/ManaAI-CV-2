import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {aishiContacts,aishiUnreadContacts,aishiOfferId,type AishiPhoneState} from '../core/aishiPhone';
import {hangoutName,aishiHangoutKinds,type AishiHangout,type CharacterHangoutOffer} from '../core/aishiHangouts';
import type {TownCharacter,SharedMemory} from '../core/residentRelationships';
import {townPortraits} from '../core/townPortraits';
import {keepDialogFocus} from '../core/dialogFocus';
import ManaverseMap,{type MapCharacters,type ManaverseArea} from './ManaverseMap';
import TownEventGrid,{type TownEventGridProps} from './TownEventGrid';
import TownWeatherControls from './TownWeather';
import type {PhoneFact} from '../core/aishiPhoneMemories';

const apps=[
 ['messages','Messages',<path d="M4 5h16v11H9l-5 4zM8 9h8m-8 3h6"/>],
 ['contacts','Contacts',<><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></>],
 ['plans','My plans',<path d="M5 4h14v17H5zM8 11l3 3 5-6M8 18h8"/>],
 ['map','Map',<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>],
 ['calendar','Calendar',<path d="M4 5h16v16H4zM8 2v6m8-6v6M4 11h16m-12 4h2m4 0h2"/>],
 ['moments','Shared moments',<path d="M12 20 4 12C-1 6 8 1 12 7c4-6 13-1 8 5z"/>],
 ['memories','Memories',<path d="M5 3h14v18H5zM8 3v18m3-12 2 2 3-4"/>],
 ['weather','Weather',<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2"/></>],
] as const;
type Screen='home'|'thread'|'memory-details'|typeof apps[number][0];
type Props={facts?:PhoneFact[];onForgetFact?:(sourceId:string)=>void;visible:boolean;state:AishiPhoneState;ready:boolean;busy:boolean;status:string;timeZone:string;characters:MapCharacters;area:ManaverseArea;calendar:TownEventGridProps;memories:SharedMemory[];offer?:CharacterHangoutOffer;hangout?:AishiHangout;onAccept:()=>void;onDecline:()=>void;onEnd:()=>void;onMapOpenChange:(open:boolean)=>void;onChooseArea:(area:ManaverseArea)=>void;onSend:(contact:TownCharacter,text?:string,replyTo?:string)=>Promise<void>;onRead:(contact:TownCharacter,id:string)=>void};
export default function AishiPhone(props:Props){
 const {visible,state,ready,busy,status,timeZone}=props;
 const [open,setOpen]=useState(false),[screen,setScreen]=useState<Screen>('home'),[contact,setContact]=useState<TownCharacter>('mana'),[draft,setDraft]=useState('');
 const [replyTo,setReplyTo]=useState<string>();
 const [shown,setShown]=useState(40);
 const button=useRef<HTMLButtonElement>(null),shell=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),end=useRef<HTMLDivElement>(null);
 const unread=aishiUnreadContacts(state),thread=state.messages.filter(message=>message.contact===contact),incoming=thread.filter(message=>message.from==='contact').slice(-1)[0],last=thread.slice(-1)[0];
 const close=()=>{setOpen(false);button.current?.focus();};
 useEffect(()=>{if(!visible){setOpen(false);setScreen('home');setDraft('');setReplyTo(undefined);}},[visible]);
 useEffect(()=>{props.onMapOpenChange(visible&&open&&screen==='map');},[visible,open,screen,props.onMapOpenChange]);
 useEffect(()=>{if(visible&&open&&screen==='thread'&&incoming&&state.read[contact]!==incoming.id)props.onRead(contact,incoming.id);},[visible,open,screen,contact,incoming?.id,state.read,props.onRead]);
 useEffect(()=>{if(open){heading.current?.focus({preventScroll:true});if(screen!=='thread')shell.current?.querySelector<HTMLElement>('.room-phone-list')?.scrollTo(0,0);}},[open,screen,contact]);
 useEffect(()=>{if(open&&screen==='thread'&&end.current?.parentElement)end.current.parentElement.scrollTop=end.current.parentElement.scrollHeight;},[open,screen,contact,last?.id]);
 useEffect(()=>{setDraft('');setReplyTo(undefined);setShown(40);},[contact,screen]);
 const room=visible&&open?button.current?.closest('.companion-room'):null;
 const title=screen==='home'?'Aishi’s phone':screen==='thread'?hangoutName(contact):screen==='memory-details'?hangoutName(contact)+' remembers':apps.find(app=>app[0]===screen)?.[1];
 const clock=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone});
 const replyingTo=state.messages.find(message=>message.contact===contact&&message.id===replyTo&&message.from==='contact'&&!message.invitation);
 const offerId=props.offer?aishiOfferId(props.offer):undefined;
 const openThread=(owner:TownCharacter)=>{setContact(owner);setScreen('thread');};
 const accept=()=>{props.onAccept();close();};
 const factCount=(owner:TownCharacter)=>{const count=(props.facts??[]).filter(fact=>fact.contact===owner).length;return count===1?'1 fact':`${count} facts`;};
 const moments=props.memories.filter(memory=>memory.with==='aishi').slice().reverse();
 return <>
  {visible&&<button ref={button} type="button" className="btn room-phone-button" data-unread={unread.length>0} aria-label={unread.length?'Aishi’s phone, new message':'Aishi’s phone'} title="Aishi’s phone" aria-expanded={open} aria-haspopup="dialog" onClick={()=>{setOpen(true);setScreen('home');}}><svg className="room-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18h3"/></svg></button>}
  {room&&createPortal(<div className="room-phone-overlay" onClick={event=>{if(event.target===event.currentTarget)close();}}><section className="room-phone" role="dialog" aria-modal="true" aria-labelledby="aishi-phone-title" onKeyDown={event=>{keepDialogFocus(event);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}><div className="room-phone-shell" ref={shell} data-screen={screen}>
   <div className="room-phone-top"><span>{new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZone}).format(new Date())}</span><span className="room-phone-camera" aria-hidden="true"/><button type="button" className="btn room-phone-close" onClick={close} aria-label="Close Aishi’s phone">×</button></div>
   <div className="room-phone-header">{screen!=='home'&&<button type="button" className="btn" aria-label="Back" onClick={()=>setScreen(screen==='thread'?'messages':screen==='memory-details'?'memories':'home')}>‹</button>}<h2 id="aishi-phone-title" ref={heading} tabIndex={-1}>{title}</h2></div>
   {screen==='home'&&<nav className="room-phone-apps" aria-label="Aishi’s phone apps">{apps.map(([id,label,icon])=><button type="button" key={id} onClick={()=>setScreen(id)}><span className="room-phone-app-icon" data-app={id} data-unread={id==='messages'&&unread.length>0} aria-hidden="true"><svg viewBox="0 0 24 24">{icon}</svg></span>{label}</button>)}</nav>}
   {(screen==='messages'||screen==='contacts')&&<div className="room-phone-list">{screen==='messages'&&unread.length>0&&<button type="button" className="btn" onClick={()=>unread.forEach(owner=>{const message=state.messages.filter(item=>item.contact===owner&&item.from==='contact').slice(-1)[0];if(message)props.onRead(owner,message.id);})}>Mark all read</button>}{aishiContacts.map(owner=>{const preview=state.messages.filter(message=>message.contact===owner).slice(-1)[0];return <button type="button" className="room-phone-row" key={owner} onClick={()=>openThread(owner)}><img src={owner==='mana'?'./companion-room/mana_idle_1.webp':townPortraits[owner].path} alt=""/><span><strong>{hangoutName(owner)}</strong><small>{preview?.text??'Start a conversation'}</small></span>{unread.includes(owner)&&<span className="room-phone-new" aria-label="Unread"/>}</button>;})}</div>}
   {screen==='thread'&&<><div className="room-phone-list room-phone-thread" role="log" aria-label="Aishi conversation">{thread.length>shown&&<button type="button" className="btn" onClick={()=>setShown(value=>value+40)}>Load older messages</button>}{thread.slice(-shown).map(message=><article key={message.id} data-from={message.from==='aishi'?'mana':'contact'}><small>{message.from==='aishi'?'Aishi':hangoutName(message.contact)} · {clock.format(new Date(message.at))}</small><p>{message.text}</p>{message.replyTo&&<small className="aishi-phone-reply-context">Replying to: {state.messages.find(known=>known.contact===contact&&known.id===message.replyTo)?.text.slice(0,180)}</small>}{message.from==='contact'&&!message.invitation&&<button type="button" className="aishi-phone-reply" onClick={()=>setReplyTo(message.id)}>Reply to this</button>}{message.invitation&&<><small>{aishiHangoutKinds[message.invitation.kind].label} · {message.id===offerId?'Waiting for your answer':message.invitation.status==='pending'?'Expired':message.invitation.status}</small>{message.id===offerId&&<div className="aishi-hangout-choices"><button type="button" className="btn" onClick={accept}>Accept</button><button type="button" className="btn" onClick={props.onDecline}>Not now</button></div>}</>}</article>)}{!thread.length&&<p>No messages yet.</p>}<div ref={end}/></div><form className="aishi-phone-compose" onSubmit={event=>{event.preventDefault();if(ready&&!busy&&draft.trim()){void props.onSend(contact,draft,replyTo);setDraft('');setReplyTo(undefined);}}}>{replyingTo&&<div className="aishi-phone-reply-context"><small>Replying to {hangoutName(contact)}: {replyingTo.text.slice(0,180)}</small><button type="button" className="btn" aria-label="Cancel selected reply" onClick={()=>setReplyTo(undefined)}>×</button></div>}<label>Message {hangoutName(contact)}<textarea maxLength={1000} value={draft} onChange={event=>setDraft(event.target.value)} disabled={busy}/></label><button type="submit" className="btn primary" disabled={!ready||busy||!draft.trim()}>{busy?'Waiting for reply…':'Send'}</button>{last?.from==='aishi'&&!busy&&<button type="button" className="btn" disabled={!ready} onClick={()=>void props.onSend(contact)}>Retry reply</button>}{status&&<p role="status">{status}</p>}{!ready&&!busy&&<small>Replies are available when the character is awake and the AI is free.</small>}</form></>}
   {screen==='plans'&&<div className="room-phone-list">{props.offer&&<article><strong>Invitation from {hangoutName(props.offer.owner)}</strong><p>{props.offer.text}</p><button type="button" className="btn" onClick={accept}>Accept</button><button type="button" className="btn" onClick={props.onDecline}>Not now</button></article>}{props.hangout&&<article><strong>{aishiHangoutKinds[props.hangout.kind].label} with {hangoutName(props.hangout.owner)}</strong><p>{props.hangout.phase==='sharing'?'Spending time together':'Walking to meet each other'}</p><button type="button" className="btn" onClick={props.onEnd}>End hangout</button></article>}{!props.offer&&!props.hangout&&<p>No active hangout plans. You can invite a nearby friend while exploring.</p>}</div>}
   {screen==='map'&&<ManaverseMap diving area={props.area} characters={props.characters} onChoose={area=>{props.onChooseArea(area);close();}}/>}
   {screen==='calendar'&&<div className="room-phone-list"><TownEventGrid {...props.calendar}/></div>}
   {screen==='weather'&&<div className="room-phone-list"><TownWeatherControls/></div>}
   {screen==='memories'&&<div className="room-phone-list"><p>What they remember about you from phone chats.</p><div className="room-phone-memory-characters" role="group" aria-label="Whose phone memories?">{aishiContacts.map(owner=><button type="button" className="btn" key={owner} onClick={()=>{setContact(owner);setScreen('memory-details');}}><img src={owner==='mana'?'./companion-room/mana_idle_1.webp':townPortraits[owner].path} alt=""/><span>{hangoutName(owner)}</span><small>{factCount(owner)}</small></button>)}</div></div>}
   {screen==='memory-details'&&<div className="room-phone-list aishi-phone-facts"><p>Facts you shared in phone chats, kept in {hangoutName(contact)}’s existing memory.</p>{(props.facts??[]).filter(fact=>fact.contact===contact).map(fact=><article key={fact.sourceId}><p>{fact.fact}</p><details><summary>What you told them</summary><p>{state.messages.find(message=>message.id===fact.sourceId)?.text}</p></details><button type="button" className="btn" onClick={()=>props.onForgetFact?.(fact.sourceId)}>Forget</button></article>)}{!props.facts?.some(fact=>fact.contact===contact)&&<p>No saved phone facts yet. Clear preferences and current projects can be remembered after a reply.</p>}</div>}
   {screen==='moments'&&<div className="room-phone-list">{moments.slice(0,shown).map(memory=><article key={memory.id}><strong>With {hangoutName(memory.owner)}</strong><small>{clock.format(new Date(memory.at))}</small><p>{memory.fact}</p></article>)}{!moments.length&&<p>Completed activities together will appear here.</p>}{moments.length>shown&&<button type="button" className="btn" onClick={()=>setShown(value=>value+40)}>Load older moments</button>}</div>}
   <button type="button" className="room-phone-home" onClick={()=>setScreen('home')} aria-label="Phone home"><span/></button>
  </div></section></div>,room)}
 </>;
}
