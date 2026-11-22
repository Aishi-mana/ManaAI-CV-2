import {journalClock} from './clock';

export type LibraryStory={stage:'drafted'|'deferred'|'finished';updatedAt:string};

export const libraryDraft='I’ve started writing down how Mana Studio began. It starts with Aishi’s question and the little note on my wall.';
export const libraryStoryText='Aishi asked, “Wanna get crazy?” Lyra wrote back, “Let’s gooo~ 🌸💜” They were excited to build something together, and those two lines became Mana Studio’s founding note.';

export function validateLibraryStory(value:unknown):LibraryStory|undefined{
 if(!value||typeof value!=='object'||!('stage' in value)||!('updatedAt' in value))return;
 const {stage,updatedAt}=value;
 if((stage!=='drafted'&&stage!=='deferred'&&stage!=='finished')||typeof updatedAt!=='string')return;
 const time=new Date(updatedAt);
 if(!Number.isFinite(time.getTime())||time.toISOString()!==updatedAt)return;
 return {stage,updatedAt};
}

export function libraryStoryDue(story:LibraryStory|undefined,now:Date,timeZone:string){
 const {date,time}=journalClock(now,timeZone);
 if(time<'09:00'||time>='20:00'||story?.stage==='finished')return false;
 if(story?.stage==='deferred')return date>journalClock(new Date(story.updatedAt),timeZone).date;
 return !story||now.getTime()-Date.parse(story.updatedAt)>=60_000;
}
