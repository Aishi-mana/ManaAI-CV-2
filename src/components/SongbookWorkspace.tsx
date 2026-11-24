import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {nextWeeklySong,type SongbookState} from '../core/songbook';
import {durationLabel} from '../core/musicStudio';

interface Props {
 name:string;
 state:SongbookState;
 status:string;
 busy:boolean;
 unavailableReason:string;
 voiceUnavailableReason:string;
 onCompose:()=>void;
 onConvertVoice:(id:string)=>void;
 onStop:()=>void;
 onEnable:(enabled:boolean)=>void;
 onCatchUp:(enabled:boolean)=>void;
 onOpenStudio:()=>void;
 onClose:()=>void;
}
const dateLabel=(date:string)=>new Date(date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

export default function SongbookWorkspace({
 name,state,status,busy,unavailableReason,voiceUnavailableReason,onCompose,onConvertVoice,onStop,onEnable,onCatchUp,onOpenStudio,onClose,
}:Props){
 const [now,setNow]=useState(()=>new Date());
 const [selectedId,setSelectedId]=useState('');
 const [audioUrl,setAudioUrl]=useState('');
 const [audioVersion,setAudioVersion]=useState<'mana'|'guide'|''>('');
 const audioRequest=useRef(0);
 const [audioLoading,setAudioLoading]=useState(false);
 const [audioError,setAudioError]=useState('');
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60_000);
  return()=>window.clearInterval(timer);},[]);
 useEffect(()=>()=>{if(audioUrl)URL.revokeObjectURL(audioUrl);},[audioUrl]);
 const next=nextWeeklySong(state,now);
 const entries=state.entries;
 const selected=entries.find(song=>song.id===selectedId)??entries[0];
 async function loadAudio(path:string,version:'mana'|'guide'){
  const request=++audioRequest.current;
  setAudioLoading(true);setAudioError('');setAudioUrl('');setAudioVersion(version);
  try{
   const raw=await invoke<number[]|ArrayBuffer>('singing_audio',{path});
   if(request!==audioRequest.current)return;
   const bytes=raw instanceof ArrayBuffer?raw:new Uint8Array(raw).buffer;
   const url=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));
   setAudioUrl(url);
  }catch(error){if(request===audioRequest.current)setAudioError('Could not load saved song audio: '+String(error));}
  finally{if(request===audioRequest.current)setAudioLoading(false);}
 }
 return <section className="music-studio image-gallery" role="dialog" aria-label="Mana's Songbook">
  <header className="studio-header">
   <div><small>MANA • SONGBOOK</small><h1>{name}'s Songbook</h1>
    <p>Her own original songs, imagined with local AI and rendered with the installed music generator.</p></div>
   <button className="btn" onClick={onClose}>Back to chat</button>
  </header>
  <div className="gallery-body" style={{flex:1,minHeight:0,overflowY:'auto',padding:'24px 28px'}}>
   <section className="diary-setting-card" aria-label="Original weekly songs">
    <h2>Her weekly songwriting</h2>
    <label className="check"><input type="checkbox" checked={state.settings.enabled} onChange={e=>onEnable(e.target.checked)}/>
     Let {name} compose a song automatically each week</label>
    <p>One original composition each Sunday at noon ({state.settings.timeZone}). Off by default.</p>
    <label className="check"><input type="checkbox" checked={state.settings.catchUp} onChange={e=>onCatchUp(e.target.checked)}/>
     Allow the current week's missed Sunday to catch up when Mana is idle</label>
    <p className="hint-soft">Mana writes original lyrics, then ACE-Step generates a 60–120 second guide recording. Songbook automatically uses her installed trained singing voice to convert that recording. Both WAVs are kept; missing voice tools or conversion failures never delete the original. No web searches or external-song covers.</p>
    <div style={{marginTop:12,padding:'12px 16px',border:'1px solid var(--border, #e2d9ef)',borderRadius:12}}>
     <strong>Next song: {next.date} at {next.time}</strong> ({state.settings.timeZone})
     <p className="hint-soft">{next.note}</p>
     <p className="hint-soft"><strong>Current availability:</strong> {unavailableReason||'Open, local models ready and Mana idle for five minutes.'}</p>
    </div>
    <div style={{marginTop:12,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
     <button className="btn primary" type="button" onClick={onCompose} disabled={!!unavailableReason||busy}>Compose Now · Test</button>
     {busy&&<button className="btn" type="button" onClick={onStop}>Stop song job</button>}
     <small className="hint-soft">{unavailableReason||'One manual test; it does not use the weekly scheduled slot.'}</small>
    </div>
    {status&&<p role="status" className="hint-soft">{status}</p>}
    {state.lastOutcome&&<p role="status" className="hint-soft">Last result: {state.lastOutcome.message} ({dateLabel(state.lastOutcome.at)})</p>}
   </section>
   <section aria-label="Original songs" style={{marginTop:22}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
     <div><h2>Original songs · {entries.length}</h2><p className="hint-soft">The original guide WAV is always retained. Mana's trained-voice WAV is shown only after a successful conversion.</p></div>
     <button className="btn" onClick={onOpenStudio} disabled={busy}>Open Music Studio</button>
    </div>
    {!entries.length&&<p className="hint-soft">No songs yet. Enable weekly songwriting or use Compose Now while Mana's local chat model is ready.</p>}
    <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'12px 0'}}>
     {entries.map(entry=><button className={'btn'+(selected?.id===entry.id?' selected-mode':'')} key={entry.id}
      onClick={()=>{audioRequest.current++;setSelectedId(entry.id);setAudioUrl('');setAudioVersion('');setAudioError('');}}>
      {entry.title} · {entry.voiceMixPath?'Mana voice ready':entry.status==='ready'?'Guide recorded':entry.status==='error'?'Audio unavailable':'Composition draft'}
     </button>)}
    </div>
    {selected&&<section style={{border:'1px solid var(--border, #e2d9ef)',borderRadius:12,padding:16,maxWidth:960}}>
     <h3>{selected.title}</h3>
     <p>{selected.concept}</p>
     {selected.creativeReason&&<p className="hint-soft"><strong>Why Mana chose it:</strong> {selected.creativeReason}</p>}
     <p className="hint-soft">{selected.source==='manual'?'Manual test':'Weekly original'} · {dateLabel(selected.createdAt)} · {selected.brief.style} · Target {durationLabel(selected.brief.duration)}</p>
     <p className="hint-soft">{selected.voiceMixPath?'Mana’s trained voice is ready, with the original guide recording preserved.':selected.status==='ready'?'Original guide WAV recorded; Mana’s trained-voice version is not yet available.':selected.status==='error'?'Composition saved, but audio is unavailable.':'Original composition saved; audio is not yet available.'}</p>
     {selected.status==='ready'&&selected.audioPath&&<>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
       {selected.voiceMixPath&&<button className="btn primary" disabled={audioLoading}
        onClick={()=>void loadAudio(selected.voiceMixPath!,'mana')}>Load Mana’s singing voice</button>}
       <button className="btn" disabled={audioLoading}
        onClick={()=>void loadAudio(selected.audioPath!,'guide')}>Load original guide</button>
       {!selected.voiceMixPath&&<button className="btn" disabled={busy||!!voiceUnavailableReason}
        onClick={()=>onConvertVoice(selected.id)}>{selected.voiceError?'Retry Mana voice conversion':'Convert saved song to Mana’s voice'}</button>}
      </div>
      {audioUrl&&<p className="hint-soft">Playing: {audioVersion==='mana'?'Mana’s trained singing voice':'Original guide singer'}</p>}
      {audioUrl&&<audio controls src={audioUrl} preload="metadata" aria-label={(audioVersion==='mana'?'Mana voice: ':'Original guide: ')+selected.title}/>}
      {selected.seconds&&<p className="hint-soft">Original duration: {durationLabel(selected.seconds)}{selected.voiceSeconds?' · Mana voice duration: '+durationLabel(selected.voiceSeconds):''}</p>}
     </>}
     {audioError&&<p className="msg-error" role="alert">{audioError}</p>}
     {selected.error&&<p className="msg-error" role="status">Audio generation: {selected.error}</p>}
     {selected.voiceError&&<p className="msg-error" role="status">Mana voice conversion: {selected.voiceError}</p>}
     <details><summary>Original lyrics</summary><pre className="studio-log">{selected.generatedLyrics||selected.brief.lyrics}</pre></details>
     <details><summary>Musical direction</summary><p>{selected.brief.prompt}</p><p className="hint-soft">Seed {selected.brief.seed} · Duration requested {selected.brief.duration}s</p></details>
     <p className="hint-soft">Both versions stay local. Successful Mana-voice conversions also appear as separate projects in Music Studio, alongside the original.</p>
    </section>}
   </section>
  </div>
 </section>;
}
