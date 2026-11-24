import {useState} from 'react';
import type {SketchbookEntry,SketchbookState} from '../core/sketchbook';
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
 onEnable:(enabled:boolean)=>void;
 onCatchUp:(enabled:boolean)=>void;
 onRemove:(id:string)=>void;
 onClose:()=>void;
}

const dateLabel=(date:string)=>new Date(date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

export default function SketchbookWorkspace({
 name,state,images,status,galleryReady,galleryWorking,galleryError,
 onEnable,onCatchUp,onRemove,onClose,
}:Props){
 const [selected,setSelected]=useState<string>();
 const [query,setQuery]=useState('');
 const entries=[...state.entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const imagesById=new Map(images.map(image=>[image.id,image]));
 const matches=entries.filter(entry=>(entry.title+' '+entry.concept).toLowerCase().includes(query.trim().toLowerCase()));
 const active=entries.find(entry=>entry.id===selected);
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
    {!state.settings.enabled&&<p role="status">Automatic drawing is off. Existing drawings remain saved.</p>}
   </section>
   {(status||galleryError||galleryWorking)&&<div className="diary-status" aria-live="polite">
    {status&&<p role="status">{status}</p>}
    {galleryWorking&&<p role="status">Image gallery is saving or loading…</p>}
    {galleryError&&<p role="alert" className="msg-error">{galleryError}</p>}
   </div>}
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
     {imageFor(active)?<DiskGalleryPicture image={imageFor(active)!}/>:<p role="status" className="msg-error">This drawing's gallery image is missing. The Sketchbook record is still here.</p>}
     <p className="hint-soft">Imagined artwork · {dateLabel(active.createdAt)} · Inspired by {active.inspiration}</p>
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
       <small>{new Date(entry.createdAt).toLocaleDateString()} · Imagined</small>
      </button>;
     })}
    </div>
   </section>
  </div>
 </section>;
}
