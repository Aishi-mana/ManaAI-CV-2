import {journalClock} from './clock';
import {validateSongs,type PoolSong} from './songPool';

export const MUSIC_CLIPS=[
 {id:'soft-hum',title:'Soft little hum',kind:'hum',instrument:'none'},
 {id:'bright-hum',title:'Sunny little hum',kind:'hum',instrument:'none'},
 {id:'little-song',title:'A little wordless song',kind:'song',instrument:'piano'},
 {id:'cover-excerpt',title:'Mana cover excerpt',kind:'song',instrument:'original backing'},
] as const;
export const ACTIVE_MUSIC_CLIPS=MUSIC_CLIPS.filter(clip=>clip.id!=='little-song');
export type MusicId=string;
export function musicalNoteClip(text:string,songs:PoolSong[]=validateSongs(null)):MusicId|null{
 return songs.find(song=>text.startsWith('♪ ')&&text.endsWith(` started singing: ${song.title}.`))?.id??MUSIC_CLIPS.find(clip=>text.startsWith('♪ ')&&text.endsWith(` started ${clip.kind==='hum'?'humming':clip.id==='little-song'?'a wordless song':'singing'}: ${clip.title}.`))?.id??null;
}
export interface MusicalState{enabled:boolean;cooldownMinutes:number;lastPlayedAt:string|null;nextAttemptAt:string|null;lastClip:MusicId|null;songs:PoolSong[]}
export function validateMusicalState(value:unknown):MusicalState{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x))?x:null;
 const songs=validateSongs(v.songs);
 return {enabled:v.enabled===true,cooldownMinutes:typeof v.cooldownMinutes==='number'&&Number.isInteger(v.cooldownMinutes)&&v.cooldownMinutes>=15&&v.cooldownMinutes<=240?v.cooldownMinutes:60,lastPlayedAt:time(v.lastPlayedAt),nextAttemptAt:time(v.nextAttemptAt),lastClip:MUSIC_CLIPS.some(c=>c.id===v.lastClip)||songs.some(c=>c.id===v.lastClip)?v.lastClip as MusicId:null,songs};
}
export interface MusicContext{visible:boolean;idle:boolean;ready:boolean;muted:boolean;energy:number;timeZone:string;openedAt:number;lastActivityAt:number;pausedUntil?:string|null;pendingInitiative:boolean;lastInitiativeAt?:string|null}
export function musicDue(state:MusicalState,now:Date,c:MusicContext):boolean{
 if(!state.enabled||!c.visible||!c.idle||!c.ready||c.muted||c.energy<20||c.pendingInitiative)return false;
 const time=now.getTime();const hour=Number(journalClock(now,c.timeZone).time.slice(0,2));
 if(hour<8||hour>=22||time-c.openedAt<120000||time-c.lastActivityAt<300000)return false;
 if(c.pausedUntil&&time<Date.parse(c.pausedUntil))return false;
 if(c.lastInitiativeAt&&time-Date.parse(c.lastInitiativeAt)<300000)return false;
 return state.nextAttemptAt?time>=Date.parse(state.nextAttemptAt):!state.lastPlayedAt||time-Date.parse(state.lastPlayedAt)>=state.cooldownMinutes*60000;
}
export function planMusicAttempt(state:MusicalState,id:MusicId,now=new Date(),random=Math.random):MusicalState{
 const value=random();const fraction=Number.isFinite(value)?Math.min(1,Math.max(0,value)):.5;
 return {...state,lastPlayedAt:now.toISOString(),lastClip:id,nextAttemptAt:new Date(now.getTime()+state.cooldownMinutes*(1+fraction)*60000).toISOString()};
}
export function chooseMusic(state:MusicalState,mood:string,kind?:'hum'|'song',random=Math.random):MusicId{
 let clips:{id:string;kind:'hum'|'song'}[]=[...ACTIVE_MUSIC_CLIPS.filter(c=>c.kind==='hum'),...state.songs.filter(s=>s.enabled).map(s=>({id:s.id,kind:'song' as const}))].filter(c=>!kind||c.kind===kind);
 if(!clips.length)return '';
 if(kind!=='song'&&['happy','cheerful','excited'].includes(mood))return 'bright-hum';
 if(kind!=='song'&&['sad','worried','gentle','sleepy'].includes(mood))return 'soft-hum';
 const varied=clips.filter(c=>c.id!==state.lastClip);if(varied.length)clips=varied;
 const draw=random();return clips[Math.min(clips.length-1,Math.max(0,Math.floor((Number.isFinite(draw)?draw:.5)*clips.length)))].id;
}
export function requestedMusic(text:string):'hum'|'song'|null{
 const value=text.trim().toLowerCase().replace(/[.!?]+$/,'');
 if(/^(?:please\s+)?(?:hum|hum for me|hum something|hum a little tune|can you hum(?: for me)?)$/.test(value))return 'hum';
 if(/^(?:please\s+)?(?:sing|sing for me|sing something|sing a short song|can you sing(?: for me)?)$/.test(value))return 'song';
 return null;
}
export const musicPath=(id:MusicId,songs:PoolSong[]=validateSongs(null))=>songs.find(s=>s.id===id)?.path??`C:/AI/ManaAI-CV-2/exports/singing/musical-moments/${id}.wav`;
