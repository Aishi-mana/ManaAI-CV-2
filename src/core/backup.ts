import {readStored,flushPersistence,restoreStored} from './persistence';
import {validateSettings,validateChat} from './settings';
import {validateIdentity,validateMemories} from './character';
import {validateStats} from './progress';
import {validateAvatarConfig} from './avatar';
import {validateDiary} from './diary';
import {validateJournalState} from './dailyJournal';
import {validateInitiative} from './initiative';
import {validateInternalState} from './internalState';
import {validateRelationship} from './relationship';
import {validateActivity} from './activity';
import {validateGoals} from './goals';
import {validateInterests} from './interests';
import {validateWork} from './work';
import {validatePlaytests} from './playtests';
import {isRecord,stringList} from './validation';
import {validateFollowups} from './followups';
import {validateSharedActivities} from './sharedActivities';
import {validateChatArchives} from './chatArchives';
import {validatePersonality} from './personality';
import {validateThoughts} from './thoughts';
import {validateEvents} from './events';
import {validateEpisodes} from './episodes';
import {validateNarratives} from './narratives';
import {validatePractice} from './skills';

const validators:Record<string,(value:unknown)=>unknown>={
 'mana.settings.v1':validateSettings,'mana.chat.v1':validateChat,'mana.identity.v1':validateIdentity,
 'mana.memories.v1':validateMemories,'mana.stats.v1':validateStats,'mana.avatar.v1':validateAvatarConfig,
 'mana.diary.v1':validateDiary,'mana.daily_journal.v1':validateJournalState,'mana.initiative.v1':validateInitiative,
 'mana.internal_state.v1':validateInternalState,'mana.relationship.v1':validateRelationship,'mana.activity.v1':validateActivity,
 'mana.goals.v1':validateGoals,'mana.interests.v1':validateInterests,'mana.work.v1':validateWork,
 'mana.playtests.v1':validatePlaytests,'mana.memory_reviews.v1':stringList,
 'mana.followups.v1':validateFollowups,
 'mana.shared_activities.v1':validateSharedActivities,
 'mana.chat_archives.v1':validateChatArchives,
 'mana.personality.v1':validatePersonality,
 'mana.thoughts.v1':validateThoughts,
 'mana.events.v1':validateEvents,
 'mana.episodes.v1':validateEpisodes,
 'mana.narratives.v1':validateNarratives,
 'mana.skills.v1':validatePractice,
};
export interface Backup {format:'mana-backup';version:1;createdAt:string;data:Record<string,unknown>}
const sorted=(v:unknown):unknown=>Array.isArray(v)?v.map(sorted):isRecord(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
export function validateBackup(raw:string):Backup {
 if(raw.length>20_000_000)throw new Error('Backup exceeds 20 MB.');
 const value:unknown=JSON.parse(raw);
 if(!isRecord(value)||value.format!=='mana-backup'||value.version!==1||typeof value.createdAt!=='string'||!Number.isFinite(Date.parse(value.createdAt))||!isRecord(value.data))throw new Error('Unsupported or malformed Mana backup.');
 const data={...value.data};
 // Existing version-1 backups predate follow-ups. They restore an empty follow-up list.
 if(!Object.prototype.hasOwnProperty.call(data,'mana.followups.v1'))data['mana.followups.v1']=validateFollowups(null);
 if(!Object.prototype.hasOwnProperty.call(data,'mana.shared_activities.v1'))data['mana.shared_activities.v1']=validateSharedActivities(null);
 if(!Object.prototype.hasOwnProperty.call(data,'mana.chat_archives.v1'))data['mana.chat_archives.v1']=[];
 if(!Object.prototype.hasOwnProperty.call(data,'mana.personality.v1'))data['mana.personality.v1']=validatePersonality(null);
 if(!Object.prototype.hasOwnProperty.call(data,'mana.thoughts.v1'))data['mana.thoughts.v1']=validateThoughts(null);
 if(!Object.prototype.hasOwnProperty.call(data,'mana.events.v1'))data['mana.events.v1']=[];
 if(!Object.prototype.hasOwnProperty.call(data,'mana.episodes.v1'))data['mana.episodes.v1']=[];
 if(!Object.prototype.hasOwnProperty.call(data,'mana.narratives.v1'))data['mana.narratives.v1']=[];
 if(!Object.prototype.hasOwnProperty.call(data,'mana.skills.v1'))data['mana.skills.v1']=[];
 if(Object.keys(data).length!==Object.keys(validators).length||Object.keys(data).some(k=>!Object.prototype.hasOwnProperty.call(validators,k)))throw new Error('Backup has missing or unknown data sections.');
 for(const [key,validate] of Object.entries(validators)){
   if(JSON.stringify(sorted(data[key]))!==JSON.stringify(sorted(validate(data[key]))))throw new Error(`Invalid data in ${key}. Restore cancelled rather than silently repairing records.`);
 }
 return {...value,data} as unknown as Backup;
}
export function snapshotBackup():Backup{
 const data:Record<string,unknown>={};
 for(const [key,validate] of Object.entries(validators)){const raw=readStored(key);data[key]=validate(raw===null?null:JSON.parse(raw));}
 return {format:'mana-backup',version:1,createdAt:new Date().toISOString(),data};
}
export async function createBackup():Promise<Backup>{
 await flushPersistence();
 const backup=snapshotBackup();
 // Every exported file must itself pass the same restore validation.
 validateBackup(JSON.stringify(backup));
 return backup;
}
export function backupCounts(backup:Backup):string {
 const count=(key:string)=>Array.isArray(backup.data[key])?(backup.data[key] as unknown[]).length:0;
 return `${count('mana.chat.v1')} chat messages · ${count('mana.memories.v1')} memories · ${count('mana.diary.v1')} diary entries (including deleted) · ${count('mana.goals.v1')} goals · ${count('mana.work.v1')} artifacts · ${count('mana.playtests.v1')} playtests`;
}
export async function restoreBackup(backup:Backup){
 const valid=validateBackup(JSON.stringify(backup));
 const safety=await createBackup();
 await restoreStored(Object.fromEntries(Object.entries(valid.data).map(([k,v])=>[k,JSON.stringify(v)])),JSON.stringify(safety,null,2));
}
