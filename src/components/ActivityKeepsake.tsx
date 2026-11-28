import ProjectCreationView from './ProjectCreationView';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {activityKeepsakeNames,projectKeepsakeReflection,type ActivityKeepsake as Keepsake} from '../core/activityKeepsakes';
import {useSceneLine} from './SceneVoice';
import {residentProfiles} from '../core/residentProfiles';

export default function ActivityKeepsake({keepsake,timeZone,style,reflect=false}:{keepsake:Keepsake;timeZone:string;style?:CSSProperties;reflect?:boolean}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open)closeButton.current?.focus({preventScroll:true});},[open]);
 const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true});};
 const title=keepsake.birthday?.title??keepsake.project?.title??activityKeepsakeNames[keepsake.kind];
 const thought=useSceneLine(open&&reflect?projectKeepsakeReflection(keepsake):undefined,keepsake.owner);
 const participants=keepsake.participants.filter(person=>!keepsake.birthday||person!==keepsake.owner).map(person=>person==='aishi'?'Aishi':person==='mana'?'Mana':residentProfiles[person].name).join(', ');
 const room=open?trigger.current?.closest('.companion-room'):null;
 return <>
  <button ref={trigger} type="button" className="activity-keepsake" data-kind={keepsake.kind}
   style={style} aria-label={`View ${title.toLowerCase()}`} aria-expanded={open} title={title}
   onClick={event=>{event.stopPropagation();setOpen(value=>!value);}}>
   <span className="activity-keepsake-art" aria-hidden="true"><span/></span>
  </button>
  {room&&createPortal(<div className="activity-keepsake-overlay" data-scene-editor onClick={event=>{event.stopPropagation();if(event.target===event.currentTarget)close();}}>
   <section className="activity-keepsake-details" role="dialog" aria-modal="true" aria-label={title}
   onClick={event=>event.stopPropagation()} onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
     const controls=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
     const first=controls[0],last=controls[controls.length-1];
     if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
     else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    event.stopPropagation();
   }}>
   <header><strong>{title}</strong><button ref={closeButton} type="button" className="btn" onClick={close}>Close</button></header>
   <p>{keepsake.moment}</p>
   {keepsake.project?.creation&&<ProjectCreationView creation={keepsake.project.creation} owner={keepsake.owner}/>}
   {thought&&<p className="activity-keepsake-reflection" role="status">{thought}</p>}
   {keepsake.kind==='trinket'&&<p className="activity-keepsake-location">Displayed on Mana’s bedroom desk.</p>}
   <p>{keepsake.birthday?'Celebrated with':keepsake.project?'By':'With'} {participants}</p>
   {keepsake.project&&<p>Project completed</p>}
   {keepsake.birthday?<time dateTime={keepsake.birthday.date}>{new Intl.DateTimeFormat(undefined,{timeZone:'UTC',dateStyle:'long'}).format(new Date(keepsake.birthday.date+'T12:00:00Z'))}</time>:
    <time dateTime={keepsake.at}>{new Intl.DateTimeFormat(undefined,{timeZone,dateStyle:'medium',timeStyle:'short'}).format(new Date(keepsake.at))}</time>}
  </section></div>,room)}
 </>;
}
