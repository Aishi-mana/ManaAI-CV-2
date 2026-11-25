import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {nextWeeklySong,type SongbookEntry,type SongbookState} from '../core/songbook';
import {durationLabel} from '../core/musicStudio';
import type {CoverRightsBasis} from '../core/coverHandoff';
import {nextCoverDay,type WeeklyCoverKind,type CoverMusicPreference} from '../core/weeklyCovers';

interface Props {
 name:string;
 state:SongbookState;
 status:string;
 busy:boolean;
 unavailableReason:string;
 voiceUnavailableReason:string;
 onCompose:()=>void;
 onComposeAnime:()=>void;
 onDiscoverCover:(theme:string)=>void;
 onRemoveCoverIdea:(id:string)=>void;
 onPrepareCover:(id:string,rightsBasis:CoverRightsBasis,acknowledged:boolean)=>void;
 onQueueWebAudio:(id:string,rightsBasis:CoverRightsBasis,acknowledged:boolean)=>void;
 onSelectLocalCoverFolder:()=>void;
 onApproveLocalCoverFolder:(approved:boolean)=>void;
 onSetWeeklyCoverEnabled:(kind:WeeklyCoverKind,enabled:boolean)=>void;
 onSetCoverMusicPreference:(preference:CoverMusicPreference)=>void;
 onConvertVoice:(id:string)=>void;
 onStop:()=>void;
 onEnable:(enabled:boolean)=>void;
 onCatchUp:(enabled:boolean)=>void;
 onOpenStudio:()=>void;
 onClose:()=>void;
}

type AudioVersion='mana'|'guide';
const dateLabel=(date:string)=>new Date(date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const scheduleDateLabel=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{
 weekday:'long',month:'short',day:'numeric',timeZone:'UTC',
});
const voiceStatus=(entry:SongbookEntry)=>entry.voiceMixPath?'Mana voice ready':
 entry.status==='ready'?(entry.voiceError?'Voice needs retry':'Guide recorded'):
 entry.status==='error'?'Audio unavailable':'Writing saved';
const defaultVersion=(entry:SongbookEntry):AudioVersion=>entry.voiceMixPath?'mana':'guide';

export default function SongbookWorkspace({
 name,state,status,busy,unavailableReason,voiceUnavailableReason,onCompose,onComposeAnime,onDiscoverCover,onRemoveCoverIdea,onPrepareCover,onQueueWebAudio,onSelectLocalCoverFolder,onApproveLocalCoverFolder,onSetWeeklyCoverEnabled,onSetCoverMusicPreference,onConvertVoice,onStop,onEnable,onCatchUp,onOpenStudio,onClose,
}:Props){
 const [now,setNow]=useState(()=>new Date());
 const [selectedId,setSelectedId]=useState('');
 const [search,setSearch]=useState('');
 const [coverTheme,setCoverTheme]=useState('');
 const [coverSourceError,setCoverSourceError]=useState('');
 const [coverRights,setCoverRights]=useState<Record<string,CoverRightsBasis|''>>({});
 const [coverAcknowledged,setCoverAcknowledged]=useState<Record<string,boolean>>({});
 const [versionSelection,setVersionSelection]=useState<{id:string;version:AudioVersion}|null>(null);
 const [audioUrl,setAudioUrl]=useState('');
 const [loadedAudio,setLoadedAudio]=useState<{id:string;version:AudioVersion}|null>(null);
 const [audioLoading,setAudioLoading]=useState(false);
 const [audioError,setAudioError]=useState('');
 const audioRequest=useRef(0);

 useEffect(()=>{
  const timer=window.setInterval(()=>setNow(new Date()),60_000);
  return()=>window.clearInterval(timer);
 },[]);
 useEffect(()=>()=>{if(audioUrl)URL.revokeObjectURL(audioUrl);},[audioUrl]);

 const next=nextWeeklySong(state,now);
 const entries=state.entries;
 const sungCount=entries.filter(song=>!!song.voiceMixPath).length;
 const recordedCount=entries.filter(song=>song.status==='ready').length;
 const filtered=entries.filter(song=>
  (song.title+' '+song.concept+' '+song.brief.style).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 const selected=filtered.find(song=>song.id===selectedId)??filtered[0];
 const activeVersion=selected&&versionSelection?.id===selected.id?versionSelection.version:
  selected?defaultVersion(selected):'guide';
 const audioIsCurrent=!!selected&&loadedAudio?.id===selected.id&&loadedAudio.version===activeVersion;
 const playingPath=selected?(activeVersion==='mana'?selected.voiceMixPath:selected.audioPath):undefined;

 function resetAudio(){
  audioRequest.current++;
  setAudioLoading(false);setAudioUrl('');setAudioError('');setLoadedAudio(null);
 }
 function selectSong(song:SongbookEntry){
  resetAudio();
  setSelectedId(song.id);
  setVersionSelection({id:song.id,version:defaultVersion(song)});
 }
 async function loadAudio(song:SongbookEntry,version:AudioVersion){
  const path=version==='mana'?song.voiceMixPath:song.audioPath;
  if(!path)return;
  const request=++audioRequest.current;
  setVersionSelection({id:song.id,version});
  setAudioLoading(true);setAudioError('');setAudioUrl('');setLoadedAudio(null);
  try{
   const raw=await invoke<number[]|ArrayBuffer>('singing_audio',{path});
   if(request!==audioRequest.current)return;
   const bytes=raw instanceof ArrayBuffer?raw:new Uint8Array(raw).buffer;
   const url=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));
   setLoadedAudio({id:song.id,version});setAudioUrl(url);
  }catch(error){
   if(request===audioRequest.current)setAudioError('Could not load the saved recording: '+String(error));
  }finally{
   if(request===audioRequest.current)setAudioLoading(false);
  }
 }

 return <section className="music-studio songbook-screen" role="dialog" aria-label={name+"'s Songbook"}>
  <header className="studio-header songbook-header">
   <div>
    <small>MANA • SONGBOOK</small>
    <h1>{name}'s Songbook</h1>
    <p>Original music, written by Mana and sung in her own voice.</p>
   </div>
   <div className="songbook-header-actions">
    <button className="btn" type="button" onClick={onOpenStudio} disabled={busy}>Music Studio</button>
    <button className="btn" type="button" onClick={onClose}>Back to chat</button>
   </div>
  </header>

  <div className="songbook-scroll">
   <section className="songbook-dashboard" aria-label="Songwriting controls">
    <div className="songbook-feature">
     <div className="songbook-feature-copy">
      <span className="songbook-eyebrow">HER LITTLE MUSIC CORNER</span>
      <h2>Another song, another little world.</h2>
      <p>Mana writes the lyrics, makes an original recording, then brings it to life with her trained singing voice.</p>
      <div className="songbook-steps" aria-label="Song creation stages">
       <span>01 · Write</span><span>02 · Compose</span><span>03 · Sing</span>
      </div>
     </div>
     <div className="songbook-feature-bottom">
      <div className="songbook-main-actions">
       <button className="btn primary songbook-compose" type="button" onClick={onCompose}
        disabled={busy||!!unavailableReason}>♫ &nbsp; Compose now</button>
       {state.weeklyCovers.musicPreference==='english-anime'&&<button className="btn" type="button"
        onClick={onComposeAnime} disabled={busy||!!unavailableReason}>
        Write original anime-style opening
       </button>}
       {busy&&<button className="btn" type="button" onClick={onStop}>Stop current activity</button>}
      </div>
      <p className="songbook-muted">{unavailableReason||'A manual composition. Your weekly song slot stays free.'}</p>
     </div>
    </div>

    <aside className="songbook-schedule" aria-label="Weekly song schedule">
     <div className="songbook-schedule-top">
      <span className="songbook-eyebrow">WEEKLY SONG</span>
      <span className={'songbook-small-status'+(state.settings.enabled?' is-on':'')}>
       {state.settings.enabled?'On':'Off'}
      </span>
     </div>
     <h3>{scheduleDateLabel(next.date)}</h3>
     <p className="songbook-muted">12:00 noon · {state.settings.timeZone}</p>
     <label className="songbook-toggle">
      <span>Make a new song every Sunday</span>
      <input type="checkbox" checked={state.settings.enabled} onChange={e=>onEnable(e.target.checked)}/>
     </label>
     <details className="songbook-schedule-details">
      <summary>Schedule preferences</summary>
      <label className="songbook-check">
       <input type="checkbox" checked={state.settings.catchUp} onChange={e=>onCatchUp(e.target.checked)}/>
       Catch up this week's song if Mana was offline
      </label>
      <p className="songbook-muted">{next.note}</p>
      <p className="songbook-muted">Automatic songs run only when Mana is open and idle. No missed-week backlog.</p>
     </details>
    </aside>
   </section>

   {(busy||status||state.lastOutcome)&&<div className={'songbook-activity'+(busy?' is-busy':'')} role="status" aria-live="polite">
    <span className="songbook-activity-icon" aria-hidden="true">♪</span>
    <div>
     <strong>{busy?'Mana is making music':status?'Songbook update':'Last songbook result'}</strong>
     <p>{status||state.lastOutcome?.message}</p>
     {!status&&state.lastOutcome&&<small>{dateLabel(state.lastOutcome.at)}</small>}
    </div>
   </div>}



   <section className="songbook-weekly-covers" aria-label="Two weekly cover routines">
    <div className="songbook-cover-heading">
     <div>
      <span className="songbook-eyebrow">MANA'S WEEKLY COVERS</span>
      <h2>Two little stages each week</h2>
      <p className="songbook-muted">One local song on Tuesday, one web-discovered song on Friday. Both are optional, at noon in {state.weeklyCovers.timeZone}; Mana works only while open and idle.</p>
     </div>
     <span className="songbook-small-status">Off by default</span>
    </div>
    <div className="songbook-cover-preference">
     <label htmlFor="songbook-music-preference">Her cover-song preference</label>
     <select id="songbook-music-preference" value={state.weeklyCovers.musicPreference}
      disabled={busy}
      onChange={event=>onSetCoverMusicPreference(event.target.value as CoverMusicPreference)}>
      <option value="any">Any music she likes</option>
      <option value="english-anime">English anime-opening covers</option>
     </select>
     {state.weeklyCovers.musicPreference==='english-anime'?
      <p className="songbook-muted">Mana favors titles that suggest English anime openings or English vocal covers. She does not translate Japanese lyrics yet, verify the language from audio, or download recordings. Existing songs still require your permissions.</p>:
      <p className="songbook-muted">Mana can choose among approved songs without a special genre preference.</p>}
    </div>
    <div className="songbook-weekly-grid">
     <article className="songbook-weekly-card">
      <span className="songbook-eyebrow">TUESDAY · LOCAL</span>
      <h3>From her music folder</h3>
      <p className="songbook-muted">Mana looks only at filenames in the folder you choose and selects one to sing. No recursive browsing.{state.weeklyCovers.musicPreference==='english-anime'?' She favors anime-opening and English-version titles when available.':''}</p>
      <button className="btn" type="button" disabled={busy} onClick={onSelectLocalCoverFolder}>
       {state.weeklyCovers.local.folder?'Change music folder':'Choose music folder'}
      </button>
      {state.weeklyCovers.local.folder&&<>
       <p className="songbook-muted songbook-folder-path" title={state.weeklyCovers.local.folder}>
        Selected: {state.weeklyCovers.local.folder}
       </p>
       <label className="songbook-cover-ack">
        <input type="checkbox" checked={state.weeklyCovers.local.rightsApproved} disabled={busy}
         onChange={event=>onApproveLocalCoverFolder(event.target.checked)}/>
        I have rights or permission to use both the compositions and recordings in this folder for covers.
       </label>
      </>}
      <label className="songbook-toggle">
       <span>Weekly local cover</span>
       <input type="checkbox" checked={state.weeklyCovers.local.enabled}
        disabled={busy||!state.weeklyCovers.local.rightsApproved} onChange={event=>onSetWeeklyCoverEnabled('local',event.target.checked)}/>
      </label>
      <p className="songbook-muted">Next Tuesday: {scheduleDateLabel(nextCoverDay(state.weeklyCovers,'local',now))} · 12:00</p>
     </article>
     <article className="songbook-weekly-card">
      <span className="songbook-eyebrow">FRIDAY · WEB</span>
      <h3>From her discoveries</h3>
      <p className="songbook-muted">Mana chooses from cleared web discoveries with owner-supplied audio. If none are ready, Friday saves a new idea for review, not a recording.{state.weeklyCovers.musicPreference==='english-anime'?' Anime-opening and English-vocal-cover sources receive priority.':''}</p>
      <span className="songbook-tag is-sung">{
       state.coverIdeas.filter(idea=>!!idea.approvedAudio&&!state.weeklyCovers.records.some(record=>record.sourceUrl===idea.url)).length
      } approved songs ready</span>
      <label className="songbook-toggle">
       <span>Weekly web cover or new suggestion</span>
       <input type="checkbox" checked={state.weeklyCovers.web.enabled} disabled={busy}
        onChange={event=>onSetWeeklyCoverEnabled('web',event.target.checked)}/>
      </label>
      <p className="songbook-muted">Next Friday: {scheduleDateLabel(nextCoverDay(state.weeklyCovers,'web',now))} · 12:00</p>
     </article>
    </div>
    {state.weeklyCovers.lastOutcome&&<p className="songbook-muted" role="status">Latest cover activity: {state.weeklyCovers.lastOutcome.message}</p>}
    {state.weeklyCovers.records.length>0&&<details className="songbook-cover-history">
     <summary>Mana's finished weekly covers ({state.weeklyCovers.records.length})</summary>
     <div className="songbook-cover-history-list">{state.weeklyCovers.records.map(record=>
      <div key={record.id} className="songbook-cover-history-entry">
       <div><strong>{record.title}</strong>
        <p className="songbook-muted">{record.kind==='local'?'Local':'Web-discovered'} · {dateLabel(record.at)} · {record.sourceLabel}</p>
       </div>
       <button className="btn" type="button" disabled={busy} onClick={onOpenStudio}>Listen in Music Studio</button>
      </div>)}</div>
    </details>}
   </section>

   <section className="songbook-cover-discovery" aria-label="Cover inspirations">
    <div className="songbook-cover-heading">
     <div>
      <span className="songbook-eyebrow">COVER INSPIRATIONS</span>
      <h2>Let Mana find something to sing</h2>
      <p className="songbook-muted">She can research public music pages and save a possible cover idea. You review the source and supply permitted local audio in Music Studio before making a cover.</p>
     </div>
     <span className="songbook-small-status">Ideas · {state.coverIdeas.length}</span>
    </div>
    <form className="songbook-cover-form" onSubmit={event=>{event.preventDefault();setCoverSourceError('');onDiscoverCover(coverTheme);}}>
     <label htmlFor="songbook-cover-theme">Music or mood to explore</label>
     <div className="songbook-cover-input-row">
      <input id="songbook-cover-theme" value={coverTheme} maxLength={120}
       onChange={event=>setCoverTheme(event.target.value)} placeholder={state.weeklyCovers.musicPreference==='english-anime'?'Anime openings, English covers, uplifting rock…':'Dreamy old songs, piano ballads, jazz…'}/>
      <button className="btn primary" type="submit" disabled={busy||!!voiceUnavailableReason}>Find a cover idea</button>
     </div>
     <small className="songbook-muted">Search uses Mana's installed SearXNG. A search result isn't proof that a song or recording is free to use.</small>
    </form>
    {state.coverIdeas.length>0&&<div className="songbook-cover-shelf" aria-label="Saved cover ideas">
     {state.coverIdeas.map(idea=><article key={idea.id} className="songbook-cover-idea">
      <span className={"songbook-tag"+(idea.approvedAudio?" is-sung":"")}>{idea.approvedAudio?"Approved recording queued":"Source to review"}</span>
      <h3>{idea.title}</h3>
      <p className="songbook-cover-reason"><strong>Mana's thought:</strong> {idea.reason}</p>
      {idea.excerpt&&<p className="songbook-cover-excerpt">{idea.excerpt}</p>}
      <div className="songbook-cover-review">
       <label className="songbook-cover-rights">
        Rights to the composition and recording
        <select value={coverRights[idea.id]??''} disabled={busy}
         onChange={event=>{
          setCoverRights(prev=>({...prev,[idea.id]:event.target.value as CoverRightsBasis|''}));
          setCoverAcknowledged(prev=>({...prev,[idea.id]:false}));
         }}>
         <option value="">Choose your basis for use…</option>
         <option value="owned">I own/control the needed rights</option>
         <option value="licensed">I have permission or a suitable license</option>
         <option value="public-domain">Both composition and recording are verified public domain</option>
        </select>
       </label>
       <label className="songbook-cover-ack">
        <input type="checkbox" checked={!!coverAcknowledged[idea.id]} disabled={busy}
         onChange={event=>setCoverAcknowledged(prev=>({...prev,[idea.id]:event.target.checked}))}/>
        I have reviewed this source and can use the composition and my selected local recording for this cover.
       </label>
       <div className="songbook-cover-review-actions">
        <button className="btn primary" type="button"
         disabled={busy||!!voiceUnavailableReason||!coverRights[idea.id]||!coverAcknowledged[idea.id]}
         onClick={()=>{const rights=coverRights[idea.id];if(rights&&coverAcknowledged[idea.id])
          onPrepareCover(idea.id,rights,true);}}>
         Make cover now
        </button>
        <button className="btn" type="button"
         disabled={busy||!!voiceUnavailableReason||!coverRights[idea.id]||!coverAcknowledged[idea.id]}
         onClick={()=>{const rights=coverRights[idea.id];if(rights&&coverAcknowledged[idea.id])
          onQueueWebAudio(idea.id,rights,true);}}>
         Queue audio for Friday
        </button>
       </div>
       <p className="songbook-muted">You choose the file; Mana doesn't download or use audio from this page. Use Make cover now to preview in Studio, or queue the approved local recording for an automatic Friday cover.</p>
      </div>
      <div className="songbook-cover-actions">
       <button className="btn" type="button" onClick={()=>{setCoverSourceError('');void invoke('open_web_source',{url:idea.url}).catch(error=>setCoverSourceError('Could not open the source: '+String(error)));}}>Review source</button>
       <button className="btn" type="button" onClick={onOpenStudio} disabled={busy}>Music Studio</button>
       <button className="btn" type="button" onClick={()=>onRemoveCoverIdea(idea.id)} disabled={busy}>Remove idea</button>
      </div>
      <small className="songbook-muted">Saved {dateLabel(idea.createdAt)} · Source only; no audio imported</small>
     </article>)}
    </div>}
    {coverSourceError&&<p className="msg-error" role="alert">{coverSourceError}</p>}
   </section>

   <section className="songbook-collection" aria-label="Original songs">
    <div className="songbook-collection-head">
     <div>
      <span className="songbook-eyebrow">SAVED ORIGINALS</span>
      <h2>Her song collection <span>{entries.length}</span></h2>
      <p className="songbook-muted">{recordedCount} recorded · {sungCount} in Mana's voice · All recordings stay on this computer</p>
     </div>
     <label className="songbook-search">
      <span>Find a song</span>
      <input type="search" value={search} onChange={e=>{resetAudio();setSearch(e.target.value);}}
       placeholder="Search titles, ideas, styles…" aria-label="Search Songbook"/>
     </label>
    </div>

    <div className="songbook-library-layout">
     <aside className="songbook-song-list" aria-label="Saved song list">
      {filtered.map(entry=><button className={'songbook-song-card'+(selected?.id===entry.id?' is-selected':'')}
       type="button" key={entry.id} aria-pressed={selected?.id===entry.id} onClick={()=>selectSong(entry)}>
       <span className="songbook-song-icon" aria-hidden="true">♫</span>
       <span className="songbook-song-text">
        <strong>{entry.title}</strong>
        <span>{dateLabel(entry.createdAt)} · {entry.brief.style.replaceAll('-',' ')}</span>
        <small className={'songbook-tag'+(entry.voiceMixPath?' is-sung':entry.status==='error'||entry.voiceError?' is-warning':'')}>{voiceStatus(entry)}</small>
       </span>
      </button>)}
      {!filtered.length&&<div className="songbook-list-empty">
       <span aria-hidden="true">♪</span>
       <p>{entries.length?'No songs match that search.':'Mana hasn’t saved a song yet.'}</p>
       {search&&<button type="button" className="btn" onClick={()=>setSearch('')}>Clear search</button>}
      </div>}
     </aside>

     <div className="songbook-song-detail">
      {selected?<article key={selected.id}>
       <div className="songbook-detail-head">
        <div className="songbook-record-cover" aria-hidden="true">
         <span className="songbook-record-ring"><span>♪</span></span>
         <small>MANA ORIGINAL</small>
        </div>
        <div className="songbook-detail-title">
         <span className={'songbook-tag'+(selected.voiceMixPath?' is-sung':selected.status==='error'||selected.voiceError?' is-warning':'')}>{voiceStatus(selected)}</span>
         <h2>{selected.title}</h2>
         <p>{selected.concept}</p>
         <div className="songbook-meta">
          <span>{selected.source==='manual'?'Made on request':'Weekly original'}</span>
          <span>{dateLabel(selected.createdAt)}</span>
          <span>{selected.brief.style.replaceAll('-',' ')}</span>
          <span>{durationLabel(selected.voiceSeconds||selected.seconds||selected.brief.duration)}{selected.seconds?' recorded':' target'}</span>
         </div>
        </div>
       </div>

       <section className="songbook-listening" aria-label="Song playback">
        <div className="songbook-section-line">
         <div>
          <span className="songbook-eyebrow">LISTEN</span>
          <h3>{selected.voiceMixPath?'Her voice, her song':selected.status==='ready'?'The original recording':'Recording not available yet'}</h3>
         </div>
         {selected.voiceMixPath&&<span className="songbook-version-note">Two versions saved</span>}
        </div>
        {selected.status==='ready'&&selected.audioPath?<>
         <div className="songbook-version-picker" role="group" aria-label="Choose recording version">
          {selected.voiceMixPath&&<button className={'btn'+(activeVersion==='mana'?' is-active':'')}
           aria-pressed={activeVersion==='mana'} type="button" disabled={audioLoading}
           onClick={()=>void loadAudio(selected,'mana')}>♫ Mana's singing voice</button>}
          <button className={'btn'+(activeVersion==='guide'?' is-active':'')}
           aria-pressed={activeVersion==='guide'} type="button" disabled={audioLoading}
           onClick={()=>void loadAudio(selected,'guide')}>Original guide singer</button>
         </div>
         {audioLoading?<p className="songbook-muted" role="status">Loading the saved recording…</p>:
          audioIsCurrent&&audioUrl?<audio key={audioUrl} className="songbook-audio" controls src={audioUrl}
           preload="metadata" aria-label={(activeVersion==='mana'?"Mana's voice: ":'Guide recording: ')+selected.title}/>:
          <p className="songbook-player-prompt">Choose {activeVersion==='mana'?"Mana's singing voice":'the original guide'} above to load the recording.</p>}
         <div className="songbook-listening-foot">
          {selected.voiceMixPath?<span>Mana's trained voice and the ACE-Step guide are saved separately.</span>:
           <span>The original guide WAV is safely recorded.</span>}
          {selected.seconds&&<span>Guide {durationLabel(selected.seconds)}{selected.voiceSeconds?' · Mana '+durationLabel(selected.voiceSeconds):''}</span>}
         </div>
         {!selected.voiceMixPath&&<div className="songbook-convert">
          <div><strong>Give this original Mana's voice</strong>
           <p>Convert the saved guide recording without composing the song again.</p></div>
          <button className="btn primary" type="button" disabled={busy||!!voiceUnavailableReason}
           title={voiceUnavailableReason||undefined}
           onClick={()=>onConvertVoice(selected.id)}>{selected.voiceError?'Retry conversion':'Convert to Mana voice'}</button>
         </div>}
        </>:<p className="songbook-player-prompt">The lyrics and musical idea are saved. Audio will appear here once rendering succeeds.</p>}
        {audioError&&<p className="msg-error" role="alert">{audioError}</p>}
        {selected.error&&<p className="msg-error" role="status">Original recording: {selected.error}</p>}
        {selected.voiceError&&<p className="msg-error" role="status">Mana voice conversion: {selected.voiceError}</p>}
        {!selected.voiceMixPath&&selected.status==='ready'&&voiceUnavailableReason&&<p className="songbook-muted">{voiceUnavailableReason}</p>}
       </section>

       {selected.creativeReason&&<div className="songbook-thought">
        <span aria-hidden="true">✦</span>
        <p><strong>Why she chose it</strong> {selected.creativeReason}</p>
       </div>}
       <div className="songbook-notes">
        <details>
         <summary>Original lyrics <span>Read her words</span></summary>
         <pre>{selected.generatedLyrics||selected.brief.lyrics}</pre>
        </details>
        <details>
         <summary>Musical direction <span>Style &amp; generation details</span></summary>
         <p>{selected.brief.prompt}</p>
         <p className="songbook-muted">Seed {selected.brief.seed} · Requested duration {durationLabel(selected.brief.duration)}</p>
        </details>
       </div>
      </article>:<div className="songbook-detail-empty">
       <span aria-hidden="true">♫</span>
       <h3>No song selected</h3>
       <p>{entries.length?'Choose a different search to find a song.':'When Mana creates her first song, you’ll find its recording and lyrics here.'}</p>
      </div>}
     </div>
    </div>
   </section>
  </div>
 </section>;
}
