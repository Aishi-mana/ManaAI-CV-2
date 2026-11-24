import {useEffect,useState} from 'react';
import {sketchbookScheduleSummary,sketchbookCreativePatterns,type SketchbookEntry,type SketchbookState} from '../core/sketchbook';
import type {SavedImage} from '../core/savedImages';
import DiskGalleryPicture from './DiskGalleryPicture';
import {imageOriginLabel} from '../core/imageOrigin';

interface Props {
 name:string;
 state:SketchbookState;
 images:readonly SavedImage[];
 status:string;
 galleryReady:boolean;
 galleryWorking:boolean;
 galleryError:string;
 drawNowReason:string;
 waitingReason:string;
 reviewBusyId:string|null;
 reviewUnavailableReason:string;
 onReview:(id:string)=>void;
 onDrawNow:()=>void;
 onEnable:(enabled:boolean)=>void;
 onCatchUp:(enabled:boolean)=>void;
 onRemove:(id:string)=>void;
 onClose:()=>void;
}

const dateLabel=(date:string)=>new Date(date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

export default function SketchbookWorkspace({
 name,state,images,status,galleryReady,galleryWorking,galleryError,drawNowReason,waitingReason,onDrawNow,
 reviewBusyId,reviewUnavailableReason,onReview,
 onEnable,onCatchUp,onRemove,onClose,
}:Props){
 const [selected,setSelected]=useState<string>();
 const [query,setQuery]=useState('');
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60_000);return()=>window.clearInterval(timer);},[]);
 const nextDrawing=sketchbookScheduleSummary(state,now);
 const entries=[...state.entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const patterns=sketchbookCreativePatterns(entries);
 const imagesById=new Map(images.map(image=>[image.id,image]));
 const matches=entries.filter(entry=>(entry.title+' '+entry.concept).toLowerCase().includes(query.trim().toLowerCase()));
 const active=entries.find(entry=>entry.id===selected);
 const revisited=active?.revisitedDrawingId?entries.find(entry=>entry.id===active.revisitedDrawingId):undefined;
 const imageFor=(entry:SketchbookEntry)=>imagesById.get(entry.imageId);
 const disabledReason=!galleryReady
  ?'Waiting for the image gallery to finish loading; scheduled drawings will not begin until it is ready.'
  :'Mana will wait until the app is open, her local models are available, and your other work is idle.';

 return <section className="music-studio image-gallery" role="dialog" aria-label="Mana's Sketchbook">
  <header className="studio-header">
   <div><small>MANA • SKETCHBOOK</small><h1>{name}'s Sketchbook</h1><p>Little things she imagines and draws with her local image generator.</p></div>
   <button className="btn" onClick={onClose}>Back to chat</button>
  </header>
  <div className="gallery-body" style={{flex:1,minHeight:0,overflowY:'auto',padding:'24px 28px'}}>
   <section className="diary-setting-card" aria-label="Sketchbook schedule">
    <h2>Her drawing rhythm</h2>
    <label className="check"><input type="checkbox" checked={state.settings.enabled} onChange={e=>onEnable(e.target.checked)}/>Let {name} draw automatically</label>
    <p>Three drawings per week · Tuesday, Thursday and Saturday at 12:00 noon ({state.settings.timeZone}).</p>
    <label className="check"><input type="checkbox" checked={state.settings.catchUp} onChange={e=>onCatchUp(e.target.checked)}/>Allow one missed drawing to catch up while Mana is open</label>
    <p className="hint-soft">Off by default. Ideas come from {name}'s existing local chat model; pictures use her existing installed image generator. No web downloads. Busy jobs, user activity and offline time are skipped. A missed slot never causes a backlog of pictures.</p>
    <p className="hint-soft">{disabledReason}</p>
    <div style={{marginTop:14,padding:'12px 16px',border:'1px solid var(--border, #e2d9ef)',borderRadius:12}}>
     <h3 style={{margin:'0 0 6px'}}>Next scheduled drawing</h3>
     <p style={{margin:0}}><strong>{nextDrawing.date} at {nextDrawing.time}</strong> ({state.settings.timeZone})</p>
     <p className="hint-soft" style={{margin:'5px 0 0'}}>{nextDrawing.note}</p>
     <p className="hint-soft" style={{margin:'5px 0 0'}}><strong>Current availability:</strong> {waitingReason}</p>
     {nextDrawing.status==='due'&&<p className="hint-soft">Return to chat to let the automatic schedule run. Mana must be idle.</p>}
    </div>
    <div style={{marginTop:14,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
     <button className="btn primary" type="button" disabled={!!drawNowReason} onClick={onDrawNow}>Draw Now · Test</button>
     <small className="hint-soft">{drawNowReason||'Makes one manual test drawing now. It will be saved here without using a scheduled slot.'}</small>
    </div>
    {!state.settings.enabled&&<p role="status">Automatic drawing is off. Manual test drawings remain available when local models are ready.</p>}
   </section>
   {(status||state.lastOutcome||galleryError||galleryWorking)&&<div className="diary-status" aria-live="polite">
    {status&&<p role="status">{status}</p>}
    {state.lastOutcome&&<p role={state.lastOutcome.kind==='failed'||state.lastOutcome.kind==='postponed'?'alert':'status'}>
      <strong>Last drawing {state.lastOutcome.kind}:</strong> {state.lastOutcome.message} <small>({dateLabel(state.lastOutcome.at)})</small>
    </p>}
    {galleryWorking&&<p role="status">Image gallery is saving or loading…</p>}
    {galleryError&&<p role="alert" className="msg-error">{galleryError}</p>}
   </div>}
   <section aria-label="Recurring creative themes" style={{marginBottom:22}}>
    <h2>Creative patterns</h2>
    {patterns.length?
     <><p className="hint-soft">Themes that appear in at least two of Mana's saved drawing ideas. These describe her art, not real-world memories or permanent personality traits.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
       {patterns.map(pattern=><span key={pattern.motif} className="badge" style={{border:'1px solid currentColor',borderRadius:99,padding:'4px 10px'}}>
        {pattern.motif} · {pattern.count} drawings
       </span>)}
      </div></>:
     <p className="hint-soft">As Mana saves more drawings, recurring visual themes can appear here. Older drawings stay unchanged.</p>}
   </section>
   <section aria-label="Imagined drawings">
    <div style={{display:'flex',alignItems:'end',gap:16,flexWrap:'wrap'}}>
     <div style={{flex:1}}><h2>Drawings · {entries.length}</h2><p className="hint-soft">Imagined artwork, never a diary record or evidence of a real event.</p></div>
     <label className="field" style={{minWidth:210}}>Find a drawing<input type="search" value={query} placeholder="Search titles or ideas…" onChange={e=>setQuery(e.target.value)}/></label>
    </div>
    {!entries.length&&<div className="diary-empty"><span aria-hidden="true">✧</span><h3>Her first blank page</h3><p>When automatic drawing is enabled, {name} can start creating her own little doodles on scheduled days.</p></div>}
    {entries.length>0&&!matches.length&&<p>No drawings match that search.</p>}
    {active&&<article className="memory-card" style={{margin:'16px 0 22px'}}>
     <button className="btn" onClick={()=>setSelected(undefined)}>Back to drawings</button>
     <h2 style={{overflowWrap:'anywhere'}}>{active.title}</h2>
     <p>{active.concept}</p>
     {active.creativeReason&&<blockquote style={{margin:'10px 0',padding:'10px 14px',borderLeft:'3px solid currentColor'}}>
      <strong>Why Mana chose this idea</strong><p style={{margin:'5px 0 0'}}>{active.creativeReason}</p>
      <small className="hint-soft">A note from her local creative model, not a diary event</small>
     </blockquote>}
     {!!active.motifs?.length&&<p className="hint-soft"><strong>Visual themes:</strong> {active.motifs.join(' · ')}</p>}
     {active.revisitedDrawingId&&<p className="hint-soft">
      <strong>Inspired by earlier artwork: </strong>
      {revisited?<button type="button" className="btn" onClick={()=>setSelected(revisited.id)}>{revisited.title}</button>:
       'An older drawing that is no longer in Sketchbook'}
     </p>}
     {imageFor(active)?<DiskGalleryPicture image={imageFor(active)!}/>:<p role="status" className="msg-error">This drawing's gallery image is missing. The Sketchbook record is still here.</p>}
     <section aria-label="Mana's creative self-review" style={{marginTop:14,marginBottom:14,padding:'12px 16px',border:'1px solid var(--border, #e2d9ef)',borderRadius:12}}>
      <h3 style={{margin:'0 0 6px'}}>Her creative self-review</h3>
      <p className="hint-soft" style={{margin:'4px 0 10px'}}>Based on the saved drawing's concept and generation prompt, not a visual inspection of the final image. No extra images are generated.</p>
      {active.reflection?
       <>
        <p><strong>What I enjoyed:</strong> {active.reflection.enjoyed}</p>
        <p><strong>Next time I'd try:</strong> {active.reflection.nextTime}</p>
        <small className="hint-soft">Written {dateLabel(active.reflection.at)} using Mana's local chat model</small>
       </>:
       <>
        <button className="btn" type="button"
         disabled={!!reviewUnavailableReason||!!reviewBusyId||!imageFor(active)}
         onClick={()=>onReview(active.id)}>
         {reviewBusyId===active.id?'Mana is reflecting…':'Reflect on this idea'}
        </button>
        {(reviewUnavailableReason||reviewBusyId||!imageFor(active))&&
         <p className="hint-soft" role="status">
          {!imageFor(active)?'The saved image is missing from Gallery.':reviewBusyId?'A reflection is already in progress.':reviewUnavailableReason}
         </p>}
       </>}
     </section>
     <p className="hint-soft">{active.sourceType==='manual-drawing'?'Manual test drawing':'Scheduled imagined artwork'} · {dateLabel(active.createdAt)} · Inspired by {active.inspiration}</p>
     {active.model&&<p className="hint-soft">Local model: {active.model}{active.seed!==undefined?' · Seed: '+active.seed:''}</p>}
     {imageFor(active)?.origin&&<p className="hint-soft">{imageOriginLabel(imageFor(active)!.origin!)}</p>}
     <details><summary>Image prompt</summary><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{active.prompt}</p></details>
     <p className="hint-soft">Removing a drawing from Sketchbook leaves its picture safely in Image Gallery. You may delete the gallery copy separately afterward.</p>
     <button className="btn" onClick={()=>{
      if(window.confirm('Remove this drawing from Sketchbook? Its picture will remain in Image Gallery.')){
       onRemove(active.id);setSelected(undefined);
      }
     }}>Remove from Sketchbook</button>
    </article>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:16}}>
     {matches.map(entry=>{
      const image=imageFor(entry);
      return <button type="button" key={entry.id} className="memory-card"
       aria-label={'View imagined drawing '+entry.title} aria-pressed={active?.id===entry.id}
       onClick={()=>setSelected(entry.id)} style={{padding:10,textAlign:'left',cursor:'pointer'}}>
       {image?<img loading="lazy" src={image.dataUrl} alt="" style={{display:'block',width:'100%',height:170,objectFit:'cover',borderRadius:12}}/>:
        <div style={{height:170,display:'grid',placeItems:'center',border:'1px dashed currentColor',borderRadius:12}}>Gallery picture missing</div>}
       <p style={{overflowWrap:'anywhere',marginBottom:4}}><strong>{entry.title}</strong></p>
       <small>{new Date(entry.createdAt).toLocaleDateString()} · {entry.sourceType==='manual-drawing'?'Manual test':'Scheduled'}</small>
      </button>;
     })}
    </div>
   </section>
  </div>
 </section>;
}
