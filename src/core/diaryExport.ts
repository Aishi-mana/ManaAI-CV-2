import type {DiaryEntry} from './diary';

export function diaryText(entries:DiaryEntry[],name:string):string {
 const active=entries.filter(entry=>!entry.deletedAt).slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 return `${name}'s diary\n\n${active.map(entry=>`${entry.journalDate?`Daily journal — ${entry.journalDate}`:'Reflection'}\nWritten: ${entry.createdAt}\nMood: ${entry.mood}\n\n${entry.content}`).join('\n\n---\n\n')}\n`;
}
