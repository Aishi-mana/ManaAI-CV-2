import type {Backup} from './backup';
import {isRecord} from './validation';

export interface DataCount {label:string;count:number}
export interface DataHealth {counts:DataCount[];notes:string[];bytes:number}
const rows=(backup:Backup,key:string)=>Array.isArray(backup.data[key])?(backup.data[key] as unknown[]).filter(isRecord):[];
export function dataHealth(backup:Backup):DataHealth {
 const goals=rows(backup,'mana.goals.v1'),work=rows(backup,'mana.work.v1'),reports=rows(backup,'mana.playtests.v1'),diary=rows(backup,'mana.diary.v1');
 const goalIds=new Set(goals.map(g=>g.id)),artifacts=new Map(work.map(a=>[a.id,a]));
 const notes:string[]=[];
 const note=(count:number,text:string)=>{if(count)notes.push(`${count} ${text}`);};
 note(work.filter(a=>!goalIds.has(a.goalId)).length,'artifacts have a deleted goal. Their content remains available, but new work requires an active goal.');
 note(work.filter(a=>a.parentId&&!artifacts.has(a.parentId)).length,'revisions have a deleted parent. Their content remains available; the parent comparison cannot be shown.');
 note(reports.filter(r=>!artifacts.has(r.artifactId)).length,'playtests refer to missing artifacts. These reports remain in the backup.');
 note(reports.filter(r=>artifacts.has(r.artifactId)&&artifacts.get(r.artifactId)?.version!==r.version).length,'playtests have a version that differs from their linked artifact. Treat them as historical evidence, not current measurements.');
 const dates=new Set<string>();let duplicateDates=0;
 for(const entry of diary.filter(e=>!e.deletedAt&&typeof e.journalDate==='string')){if(dates.has(String(entry.journalDate)))duplicateDates++;dates.add(String(entry.journalDate));}
 note(duplicateDates,'active daily entries share a journal date. Review the entries before deciding which to keep.');
 const journal=backup.data['mana.daily_journal.v1'];
 if(isRecord(journal)&&Array.isArray(journal.completedDates))note(journal.completedDates.filter(d=>!dates.has(String(d))).length,'journaled dates have no active entry. Use Recently deleted to restore one, or Rewrite today for the current date.');
 const followups=backup.data['mana.followups.v1'];
 const followupNotes=isRecord(followups)&&Array.isArray(followups.notes)?followups.notes.filter(isRecord):[];
 const shared=backup.data['mana.shared_activities.v1'];
 const sessions=isRecord(shared)&&Array.isArray(shared.sessions)?shared.sessions.filter(isRecord):[];
 const avatar=backup.data['mana.avatar.v1'];
 const looks=isRecord(avatar)&&Array.isArray(avatar.looks)?avatar.looks.filter(isRecord):[];
 const archives=rows(backup,'mana.chat_archives.v1');
 const thoughtState=backup.data['mana.thoughts.v1'];
 const thoughts=isRecord(thoughtState)&&Array.isArray(thoughtState.entries)?thoughtState.entries:[];
 return {counts:[{label:'Chat messages',count:rows(backup,'mana.chat.v1').length},{label:'Memories',count:rows(backup,'mana.memories.v1').length},{label:'Diary entries',count:diary.filter(e=>!e.deletedAt).length},{label:'Recently deleted',count:diary.filter(e=>!!e.deletedAt).length},{label:'Active goals',count:goals.filter(g=>g.status==='active').length},{label:'All goals',count:goals.length},{label:'Work artifacts',count:work.length},{label:'Playtest reports',count:reports.length},{label:'Pending follow-ups',count:followupNotes.filter(n=>n.status==='pending').length},{label:'All follow-ups',count:followupNotes.length},{label:'Activity sessions',count:sessions.length},{label:'Paused activities',count:sessions.filter(s=>s.status==='paused').length},{label:'Saved wardrobe looks',count:looks.length},{label:'Chat archives',count:archives.length},{label:'Saved thoughts',count:thoughts.length},{label:'Recorded events',count:rows(backup,'mana.events.v1').length},{label:'Episodic memories',count:rows(backup,'mana.episodes.v1').length},{label:'Interpretation versions',count:rows(backup,'mana.narratives.v1').length},{label:'Confirmed practice records',count:rows(backup,'mana.skills.v1').length}],notes,bytes:new TextEncoder().encode(JSON.stringify(backup)).length};
}
export function compareBackups(current:Backup,incoming:Backup):{label:string;current:number;incoming:number}[]{
 const currentCounts=dataHealth(current).counts,incomingCounts=dataHealth(incoming).counts;
 return currentCounts.map((row,i)=>({label:row.label,current:row.count,incoming:incomingCounts[i].count}));
}
