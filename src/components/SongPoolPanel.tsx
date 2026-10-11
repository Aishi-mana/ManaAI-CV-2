import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {open} from '@tauri-apps/plugin-dialog';
import {validateMusicalState} from '../core/musicalMoments';
import {songName,validateSongs,type PoolSong} from '../core/songPool';
import type {InitiativeState} from '../core/initiative';
import {uid} from '../core/types';
import StudioArtwork from './StudioArtwork';
import StudioIcon from './StudioIcon';

export default function SongPoolPanel({initiative,onInitiative,onBusy,candidate,busy}:{initiative:InitiativeState;onInitiative:(state:InitiativeState)=>void;onBusy:(busy:boolean)=>void;candidate:string;busy:boolean}){
 const state=validateMusicalState(initiative.music);
 const [search,setSearch]=useState('');
 const filtered=state.songs.filter(song=>[song.title,...song.aliases].some(name=>songName(name).includes(songName(search))));
 const [title,setTitle]=useState(''),[aliases,setAliases]=useState(''),[path,setPath]=useState(''),[approved,setApproved]=useState(false),[heard,setHeard]=useState(false),[shortEnough,setShortEnough]=useState(false),[status,setStatus]=useState(''),[url,setUrl]=useState(''),[loading,setLoading]=useState(false);
 const epoch=useRef(0),activeUrl=useRef(''),audio=useRef<HTMLAudioElement|null>(null);
 function clear(){epoch.current++;audio.current?.pause();if(activeUrl.current)URL.revokeObjectURL(activeUrl.current);activeUrl.current='';setUrl('');setHeard(false);setShortEnough(false);setApproved(false);setLoading(false);onBusy(false);}
 useEffect(()=>()=>{epoch.current++;audio.current?.pause();if(activeUrl.current)URL.revokeObjectURL(activeUrl.current);onBusy(false);},[]);
 useEffect(()=>{clear();setPath(candidate);},[candidate]);
 function save(songs:PoolSong[]){onInitiative({...initiative,music:{...state,songs:validateSongs(songs)}});}
 async function preview(selected=path){clear();const token=epoch.current;setLoading(true);onBusy(true);
  try{const raw=await invoke<ArrayBuffer|number[]>('singing_audio',{path:selected});if(token!==epoch.current)return;const bytes=raw instanceof ArrayBuffer?raw:new Uint8Array(raw).buffer;const context=new AudioContext();let decoded:AudioBuffer;try{decoded=await context.decodeAudioData(bytes.slice(0));}finally{await context.close();}
   if(token!==epoch.current)return;
   if(decoded.duration<1)throw Error('This recording is shorter than one second.');
   const eligible=decoded.duration<=30.1;setShortEnough(eligible);
   if(!decoded.getChannelData(0).some(v=>Math.abs(v)>.001))throw Error('This clip is silent.');
   activeUrl.current=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));setUrl(activeUrl.current);setStatus(eligible?'Play the preview before approving this clip.':'Full-cover preview ready. Chat-pool clips must be 1–30 seconds; convert a short excerpt to add this song.');
  }catch(e){if(token===epoch.current)setStatus(String(e));}finally{if(token===epoch.current){setLoading(false);onBusy(false);}}
 }
 function add(){
  const song:PoolSong={id:'song-'+uid(),title:title.trim(),aliases:aliases.split(',').map(a=>a.trim()).filter(Boolean),path,enabled:true};
  const keys=[song.title,...song.aliases].map(songName);
  if(!approved||!heard||!shortEnough||!url||!song.title||state.songs.length>=50){setStatus('Listen, approve, and give the clip a title. The pool holds up to 50 songs.');return;}
  if(state.songs.some(s=>[s.title,...s.aliases].some(n=>keys.includes(songName(n))))){setStatus('That title or alias is already used. Choose unique names.');return;}
  const next=validateSongs([...state.songs,song]);if(next.length!==state.songs.length+1){setStatus('Use a valid title and a prepared WAV under exports/singing.');return;}
  save(next);clear();setTitle('');setAliases('');setStatus('Approved clip added to the song pool.');
 }
 return <section className="song-pool"><div className="studio-section-head"><h3>Short song pool</h3><span>{state.songs.length} songs · {state.songs.filter(s=>s.enabled).length} enabled</span></div><p className="hint-soft">Enabled clips are available for chat requests and occasional singing.</p>
 <input className="pool-search" aria-label="Find a song in the chat pool" placeholder="Find a song or alias…" value={search} onChange={e=>setSearch(e.target.value)}/>
 <ul className="pool-list" aria-label="Chat song pool">{filtered.map(song=>{
 const project=initiative.studio?.projects.find(p=>[p.mix,p.vocal].some(path=>path&&path.replaceAll('\\','/').toLowerCase()===song.path.replaceAll('\\','/').toLowerCase()));
 return <li className={`pool-track${song.enabled?'':' pool-disabled'}`} key={song.id}>
 <StudioArtwork small image={project?.artwork||''} title={song.title}/>
 <div className="pool-track-info"><strong title={song.title}>{song.title}</strong><small>{song.enabled?'Available in chat':'Excluded from chat'}</small>{song.aliases.length>0&&<details><summary>Aliases ({song.aliases.length})</summary><p>{song.aliases.join(', ')}</p></details>}</div>
 <div className="pool-actions"><button className={`btn pool-icon${song.enabled?' selected-mode':''}`} aria-pressed={song.enabled} title={`${song.enabled?'Disable':'Enable'} ${song.title} in chat`} aria-label={`${song.enabled?'Disable':'Enable'} ${song.title} in chat`} disabled={busy||loading} onClick={()=>save(state.songs.map(s=>s.id===song.id?{...s,enabled:!s.enabled}:s))}><StudioIcon name="check"/></button>
 <button className="btn pool-icon" title={`Preview ${song.title}`} aria-label={`Preview ${song.title}`} disabled={busy||loading} onClick={()=>{setPath(song.path);void preview(song.path);}}><StudioIcon name="play"/></button>
 <button className="btn pool-icon" title={`Remove ${song.title} from pool`} aria-label={`Remove ${song.title} from pool`} disabled={busy||loading} onClick={()=>{clear();save(state.songs.filter(s=>s.id!==song.id));setStatus('Removed from pool. Audio files and chat history are kept.');}}><StudioIcon name="trash"/></button></div></li>;
 })}</ul>
 {state.songs.length>0&&!filtered.length&&<p className="hint-soft">No matching songs. Try another title or alias.</p>}
 {!state.songs.length&&<p>No songs yet. Humming is still available.</p>}
 <details><summary>Add an approved short clip</summary><label className="field">Song title<input maxLength={100} value={title} disabled={busy||loading} onChange={e=>setTitle(e.target.value)}/></label><label className="field">Aliases (comma separated)<input value={aliases} disabled={busy||loading} onChange={e=>setAliases(e.target.value)}/></label><label className="field">Prepared WAV<input value={path} disabled={busy||loading} onChange={e=>{clear();setPath(e.target.value);}}/></label><p className="hint-soft">Choose a 1–30 second prepared clip under exports/singing. Convert uploaded audio below first.</p><button className="btn" disabled={busy||loading} onClick={()=>void open({multiple:false,defaultPath:'C:/AI/ManaAI-CV-2/exports/singing',filters:[{name:'Prepared audio',extensions:['wav']}]}).then(value=>{if(typeof value==='string'){clear();setPath(value);}})}>Choose prepared clip</button> <button className="btn" disabled={busy||loading||!path} onClick={()=>void preview()}>Load audition</button><p><label><input type="checkbox" checked={approved} disabled={!heard||!shortEnough||busy||loading} onChange={e=>setApproved(e.target.checked)}/> I have listened and approve this clip for Mana</label></p><button className="btn primary" disabled={!approved||!heard||!shortEnough||busy||loading||!title.trim()} onClick={add}>Add to song pool</button></details>
 {url&&<audio ref={audio} controls src={url} onPlay={()=>{setHeard(true);onBusy(true);}} onPause={()=>onBusy(false)} onEnded={()=>onBusy(false)}/>}<p role="status">{status}</p><p className="hint-soft">Pool titles, aliases and file paths are backed up. Audio files stay in exports/singing and are not included in JSON backups.</p></section>;
}
