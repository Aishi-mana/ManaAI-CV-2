import {useState} from 'react';
import {albumKeepsakeTitle,type KeepsakeAlbumEntry} from '../core/keepsakeAlbum';
import {residentIds,residentProfiles} from '../core/residentProfiles';
import type {TownCharacter} from '../core/residentRelationships';

const name=(owner:TownCharacter)=>owner==='mana'?'Mana':residentProfiles[owner].name;
export default function KeepsakeAlbum({entries,owner,timeZone,onOpenOwner}:{entries:KeepsakeAlbumEntry[];owner?:TownCharacter;timeZone:string;onOpenOwner:(owner:TownCharacter)=>void}){
 const [filter,setFilter]=useState<'all'|KeepsakeAlbumEntry['category']>('all');
 const owners:TownCharacter[]=['mana',...residentIds];
 if(!owner)return <div className="room-phone-list"><p>Birthday cards, finished projects, and activity mementos from saved moments.</p><div className="town-project-grid">
  {owners.map(person=><button type="button" className="town-project-person" key={person} onClick={()=>onOpenOwner(person)}>
   <img src={person==='mana'?'./companion-room/mana_idle_1.webp':residentProfiles[person].avatar} alt=""/><strong>{name(person)}</strong><span>{entries.filter(entry=>entry.owner===person).length} keepsakes</span>
  </button>)}
 </div><p className="hint-soft">Only retained records appear here. The home display keeps its newest memento.</p></div>;
 const selected=entries.filter(entry=>entry.owner===owner&&(filter==='all'||entry.category===filter));
 return <div className="room-phone-list keepsake-album">
  <label>Show <select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">All keepsakes</option><option value="birthday">Birthday cards</option><option value="project">Completed projects</option><option value="activity">Activity mementos</option></select></label>
  {selected.length===0?<p>{filter==='all'?`No saved keepsakes for ${name(owner)} yet.`:`No ${filter==='birthday'?'birthday cards':filter==='project'?'completed projects':'activity mementos'} saved for ${name(owner)} yet. Try All keepsakes.`}</p>:selected.map(entry=><details key={`${entry.category}:${entry.id}`} className="keepsake-album-entry">
   <summary><span className="activity-keepsake keepsake-album-art" data-kind={entry.kind} aria-hidden="true"><span className="activity-keepsake-art"><span/></span></span><span><strong>{albumKeepsakeTitle(entry)}</strong><time dateTime={entry.birthday?.date??entry.at}>{entry.birthday?new Intl.DateTimeFormat(undefined,{timeZone:'UTC',dateStyle:'medium'}).format(new Date(entry.birthday.date+'T12:00:00Z')):new Intl.DateTimeFormat(undefined,{timeZone,dateStyle:'medium'}).format(new Date(entry.at))}</time></span></summary>
   <p>{entry.moment}</p>
   <p>{entry.birthday?'Celebrated with':entry.project?'By':'With'} {entry.participants.filter(person=>!entry.birthday||person!==entry.owner).map(person=>person==='aishi'?'Aishi':name(person)).join(', ')}</p>
   {entry.project&&<p>{entry.project.sessions} planned work sessions completed.</p>}
  </details>)}
 </div>;
}
