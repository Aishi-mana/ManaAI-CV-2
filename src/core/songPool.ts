export interface PoolSong{id:string;title:string;aliases:string[];path:string;enabled:boolean}
export const DEFAULT_SONGS:PoolSong[]=[{id:'cover-excerpt',title:'Reach Out to the Truth',aliases:['Mana cover excerpt','Reach Out To The Truth'],path:'C:/AI/ManaAI-CV-2/exports/singing/musical-moments/cover-excerpt.wav',enabled:true}];
export const songName=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/[“”"‘’]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function validateSongs(value:unknown):PoolSong[]{
 if(!Array.isArray(value))return DEFAULT_SONGS.map(song=>({...song,aliases:[...song.aliases]}));
 const songs:PoolSong[]=[];
 for(const raw of value.slice(0,50)){
  if(!raw||typeof raw!=='object')continue;
  const s=raw as Record<string,unknown>;
  if(typeof s.id!=='string'||!(/^(?:cover-excerpt|song-[a-z0-9-]{1,60})$/).test(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>100||typeof s.path!=='string')continue;
  const path=s.path.replace(/\\/g,'/');
  if(!path.toLowerCase().startsWith('c:/ai/manaai-cv-2/exports/singing/')||!path.endsWith('.wav')||path.split('/').some(p=>p==='.'||p==='..'))continue;
  const aliases=Array.isArray(s.aliases)?s.aliases.filter((a):a is string=>typeof a==='string'&&a.trim().length>0&&a.length<=100).slice(0,10):[];
  const names=[s.title,...aliases].map(songName);
  if(names.some(n=>!n)||songs.some(song=>song.id===s.id||[song.title,...song.aliases].some(name=>names.includes(songName(name)))))continue;
  songs.push({id:s.id,title:s.title.trim(),aliases,path,enabled:s.enabled!==false});
 }
 return songs;
}
export function findSong(songs:PoolSong[],title:string){const key=songName(title);return songs.find(s=>s.enabled&&[s.title,...s.aliases].some(name=>songName(name)===key));}
export function requestedSongTitle(text:string):string|null{
 const match=text.trim().replace(/[.!?]+$/,'').match(/^(?:please\s+)?(?:can you\s+)?sing\s+(.+?)(?:\s+for me)?$/i);
 return match?match[1].replace(/^["“]|["”]$/g,'').trim():null;
}

/** Strip an explicit character address and command punctuation, without guessing titles. */
export function musicCommandText(text:string,name:string):string{
 let command=text.trim();
 if(name&&command.slice(0,name.length).toLowerCase()===name.toLowerCase()&&/^[\s,:]/.test(command.slice(name.length)))command=command.slice(name.length).replace(/^[\s,:]+/,'');
 return command.replace(/^(sing|hum)\s*,\s*/i,'$1 ');
}
