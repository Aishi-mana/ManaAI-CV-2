import {loadBuilderAudio,retainBuilderAudio} from '../core/builderAudio';
import {uid} from '../core/types';
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from 'react';
import type {BuilderDraft,BuilderTrack} from '../core/coverBuilder';
import {moveClip,trackClips,setClipFade,patchClip,splitTrackClip,duplicateTrackClip,MAX_CLIPS,trackTrim,trimClip,waveformPeaks} from '../core/builderTimeline';
import {formatMusicTime} from '../core/musicTime';
import MusicTimeInput from './MusicTimeInput';
import './BuilderTimeline.css';

interface Props {
 projectToolbar:ReactNode;transportExtra:ReactNode;feedback:ReactNode;
 draft:BuilderDraft;blocked:boolean;seekBlocked:boolean;selected:string;onSelect:(id:string)=>void;clipId:string;onClipSelect:(trackId:string,clipId:string)=>void;
 renderTrackQuick:(track:BuilderTrack)=>ReactNode;renderTrackTools:(track:BuilderTrack)=>ReactNode;
 onChange:(draft:BuilderDraft)=>void;cursor:number;onSeek:(seconds:number)=>void;
 onStop:()=>void;previewDisabled:boolean;onPlay:()=>void;onPause:()=>void;mixPlaying:boolean;loading:boolean;levelsBlocked:boolean;playDisabled:boolean;readPosition:()=>number;
}
type Gesture={track:BuilderTrack;clipId:string;edge:'move'|'start'|'end';x:number;patch:Partial<BuilderTrack>};
const colors=['#edbf64','#85c78c','#63bfae','#67bbd3','#94aaf2','#c6a0e4'];
export default function BuilderTimeline(p:Props){
 const [clipError,setClipError]=useState(''),[toolsTrack,setToolsTrack]=useState('');
 const [zoom,setZoom]=useState(1),[snap,setSnap]=useState(true),[width,setWidth]=useState(900);
 const [peaks,setPeaks]=useState<Record<string,number[]>>({}),[errors,setErrors]=useState<Record<string,string>>({});
 const [ghost,setGhost]=useState<{id:string;patch:Partial<BuilderTrack>}>();
 const host=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null);
 const scrubbing=useRef(false),clock=useRef<HTMLSpanElement>(null);
 const peakCache=useRef(new Map<string,number[]>()),failed=useRef(new Set<string>());
 const paths=JSON.stringify([...new Set(p.draft.tracks.map(t=>t.path))]);
 useEffect(()=>{const element=host.current;if(!element)return;const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));observer.observe(element);return()=>observer.disconnect();},[]);
 useEffect(()=>{
  let cancelled=false;
  retainBuilderAudio(JSON.parse(paths));
  void (async()=>{
   for(const path of JSON.parse(paths) as string[]){
    if(cancelled)break;
    if(peakCache.current.has(path)||failed.current.has(path))continue;
    try{
     const audio=await loadBuilderAudio(path);
     if(cancelled)break;
     peakCache.current.set(path,waveformPeaks(audio));setPeaks(Object.fromEntries(peakCache.current));
    }catch{if(!cancelled){failed.current.add(path);setErrors(e=>({...e,[path]:'Waveform unavailable. Track controls still work.'}));}}
   }
  })();
  return()=>{cancelled=true;};
 },[paths]);
 useEffect(()=>{const cancel=(e:KeyboardEvent)=>{if(e.key==='Escape'){gesture.current=null;setGhost(undefined);}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 const tracks=p.draft.tracks.map(t=>ghost?.id===t.id?{...t,...ghost.patch}:t);
 const duration=Math.min(3600,Math.max(10,...p.draft.tracks.flatMap(t=>trackClips(t).map(c=>c.end+c.offset+t.offset)))+1);
 const HEADER=width<900?280:320;
 const available=Math.max(1,width-HEADER-18);
 const pps=Math.max(.001,available/duration)*zoom,canvasWidth=Math.max(available,duration*pps);
 useEffect(()=>{
  if(!p.mixPlaying)return;
  let frame=0;
  const heads=host.current?.querySelectorAll<HTMLElement>('.editor-playhead,.editor-cursor-head');
  const scroll=host.current?.querySelector<HTMLElement>('.editor-scroll');
  const tick=()=>{const time=p.readPosition(),x=time*pps;heads?.forEach(head=>{head.style.left=x+'px';});if(clock.current)clock.current.textContent=formatMusicTime(time);if(scroll&&!scrubbing.current){const visible=scroll.clientWidth-HEADER;if(x>scroll.scrollLeft+visible-24||x<scroll.scrollLeft)scroll.scrollLeft=Math.max(0,x-visible*.25);}frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[p.mixPlaying,p.readPosition,pps,HEADER]);
 function seekPointer(e:ReactPointerEvent){const ruler=host.current?.querySelector('.editor-ruler');if(ruler)p.onSeek(Math.min(duration,Math.max(0,(e.clientX-ruler.getBoundingClientRect().left)/pps)));}
 function beginCursor(e:ReactPointerEvent){if(p.seekBlocked||e.button!==0)return;e.preventDefault();e.stopPropagation();scrubbing.current=true;e.currentTarget.setPointerCapture(e.pointerId);seekPointer(e);}
 function moveCursor(e:ReactPointerEvent){if(scrubbing.current)seekPointer(e);}
 function endCursor(e:ReactPointerEvent){if(!scrubbing.current)return;seekPointer(e);scrubbing.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 const tick=[.5,1,2,5,10,15,30,60,120,300,600].find(n=>n*pps>=65)??600;
 const selected=p.draft.tracks.find(t=>t.id===p.selected);
 const selectedClip=selected?trackClips(selected).find(c=>c.id===p.clipId):undefined;
 function clipAction(action:'split'|'duplicate'|'delete'){if(!selected||!selectedClip||p.blocked)return;try{setClipError('');const id='clip-'+uid();const patch=action==='split'?splitTrackClip(selected,selectedClip.id,p.cursor,id):action==='duplicate'?duplicateTrackClip(selected,selectedClip.id,id):{clips:trackClips(selected).filter(c=>c.id!==selectedClip.id),trim:undefined};change(selected.id,patch);if(action==='duplicate')p.onClipSelect(selected.id,id);}catch(e){setClipError(String(e));}}
 function change(id:string,patch:Partial<BuilderTrack>){p.onChange({...p.draft,tracks:p.draft.tracks.map(t=>t.id===id?{...t,...patch}:t)});}
 function begin(e:ReactPointerEvent,track:BuilderTrack,clipId:string,edge:Gesture['edge']){
  if(p.blocked||e.button!==0)return;e.stopPropagation();p.onClipSelect(track.id,clipId);
  gesture.current={track,clipId,edge,x:e.clientX,patch:{}};e.currentTarget.setPointerCapture(e.pointerId);
 }
 function move(e:ReactPointerEvent){const g=gesture.current;if(!g)return;const delta=(e.clientX-g.x)/pps,step=snap?.1:.001;g.patch=g.edge==='move'?moveClip(g.track,delta,step,g.clipId):trimClip(g.track,g.edge,delta,step,g.clipId);setGhost({id:g.track.id,patch:g.patch});}
 function finish(e:ReactPointerEvent){const g=gesture.current;if(!g)return;gesture.current=null;setGhost(undefined);if(Object.keys(g.patch).length)change(g.track.id,g.patch);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 function reorder(id:string,delta:number){const list=[...p.draft.tracks],from=list.findIndex(t=>t.id===id),to=from+delta;if(to<0||to>=list.length)return;[list[from],list[to]]=[list[to],list[from]];p.onChange({...p.draft,tracks:list});}
 return <section className="builder-editor" aria-label="Track timeline" ref={host}>
  {p.projectToolbar}
  <div className="editor-toolbar">
   <span className="editor-group-label">Playback</span>
   <button className="btn" disabled={p.playDisabled||(!p.mixPlaying&&p.previewDisabled)} onClick={p.mixPlaying?p.onPause:p.onPlay}>{p.loading?'Loading tracks…':p.mixPlaying?'Pause':'Play'}</button>
   <button className="btn" disabled={p.levelsBlocked&&!p.loading} onClick={p.onStop}>Stop</button>
   <span className="editor-transport-label">{p.previewDisabled?'All tracks silent':p.draft.tracks.some(t=>t.solo)?'Solo: only S tracks':'All unmuted tracks'}</span>
   <output aria-label="Song cursor" className="editor-clock"><span ref={clock}>{formatMusicTime(p.cursor)||'0'}</span><small> song time</small></output>
   <label className="editor-snap"><input type="checkbox" checked={snap} disabled={p.blocked} onChange={e=>setSnap(e.target.checked)}/> Snap · 0.1s</label>
   <label className="editor-zoom">Zoom <input aria-label="Timeline zoom" type="range" min={1} max={8} step={.5} value={zoom} disabled={p.blocked} onChange={e=>setZoom(Number(e.target.value))}/></label>
   {p.transportExtra}
  </div>
  <div className="editor-clip-actions"><button className="btn" disabled={p.blocked||!selectedClip||!!selected&&trackClips(selected).length>=MAX_CLIPS||!!selectedClip&&!!selected&&(p.cursor-selected.offset-selectedClip.offset-selectedClip.start<.05||selectedClip.end-(p.cursor-selected.offset-selectedClip.offset)<.05)} title="Place the cursor inside the selected clip" onClick={()=>clipAction('split')}>Split at cursor</button><button className="btn" disabled={p.blocked||!selectedClip||!!selected&&trackClips(selected).length>=MAX_CLIPS} title="Copy after the last clip on this track" onClick={()=>clipAction('duplicate')}>Duplicate clip</button><button className="btn" disabled={p.blocked||!selectedClip} onClick={()=>clipAction('delete')}>Delete clip</button><span>{selected?`${trackClips(selected).length} ${trackClips(selected).length===1?'clip':'clips'} · selected track`:"Select a clip"}</span>{clipError&&<span role="status">{clipError}</span>}</div>
  <details className="editor-help-panel"><summary>Editor help · moving, trimming and solo</summary><p className="editor-help">Drag a clip to move it. Drag its edges to trim. Choose an instrument and Convert on the left. Track tools opens trimming and extra controls. Drag the ruler or cursor to choose a song position. Play starts at the cursor. M mutes a track; S plays only the selected solo tracks.</p></details>
  {p.feedback}
  <div className="editor-scroll">
   {!tracks.length&&<div className="editor-empty"><h3>Start your arrangement</h3><p>Add a vocal, instrument or backing voice using the buttons above.</p></div>}
   <div className="editor-grid" style={{width:canvasWidth+HEADER,gridTemplateColumns:`${HEADER}px 1fr`}}>
    <div className="editor-ruler-label">TRACKS <span>{tracks.length} / 16</span></div>
    <div className="editor-ruler" role="slider" tabIndex={p.seekBlocked?-1:0} aria-label="Song position" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={Math.min(duration,p.cursor)}
     onPointerDown={beginCursor} onPointerMove={moveCursor} onPointerUp={endCursor} onPointerCancel={()=>{scrubbing.current=false;}} onLostPointerCapture={()=>{scrubbing.current=false;}}
     onKeyDown={e=>{if(!p.seekBlocked&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();p.onSeek(Math.max(0,Math.min(duration,p.cursor+(e.key==='ArrowLeft'?-1:1))));}}}>
     {Array.from({length:Math.floor(duration/tick)+1},(_,i)=><span key={i} style={{left:i*tick*pps}}>{formatMusicTime(i*tick)}</span>)}
     <div className="editor-cursor-head" title="Drag song cursor" style={{left:p.cursor*pps}}/>
    </div>
    {tracks.map((t,index)=>{
     const trim=trackTrim(t),visibleStart=Math.max(trim.start,-t.offset),clipWidth=Math.max(0,(trim.end-visibleStart)*pps),isSelected=t.id===p.selected;
     const selectedSections=t.sections?.map(s=>({start:Math.max(s.start,visibleStart),end:Math.min(s.end,trim.end)})).filter(s=>s.end>s.start);
     return <div className={`editor-row ${isSelected?'is-selected':''} ${t.muted?'is-muted':''}`} key={t.id} style={{'--clip-color':colors[index%colors.length]} as React.CSSProperties}>
      <div className="editor-track-header">
       <button className="editor-track-name" aria-pressed={isSelected} onClick={()=>p.onSelect(t.id)}>{String(index+1).padStart(2,'0')} <strong>{t.name}</strong></button>
       <div className="editor-track-buttons"><button disabled={p.levelsBlocked} aria-pressed={t.muted} title="Mute: silence this track" onClick={()=>change(t.id,{muted:!t.muted})}>M</button><button disabled={p.levelsBlocked} aria-pressed={t.solo??false} title="Solo: hear only tracks with S enabled; mute still silences them" onClick={()=>change(t.id,{solo:!t.solo})}>S</button><input aria-label={`${t.name} volume`} type="range" min={0} max={1} step={.05} value={t.gain} disabled={p.levelsBlocked} onChange={e=>change(t.id,{gain:Number(e.target.value)})}/></div>
       <div className="editor-track-meta"><span>{t.replacement??t.role} · {Math.round(t.gain*100)}%</span><button disabled={p.blocked||index===0} aria-label={`Move ${t.name} up`} onClick={()=>reorder(t.id,-1)}>↑</button><button disabled={p.blocked||index===tracks.length-1} aria-label={`Move ${t.name} down`} onClick={()=>reorder(t.id,1)}>↓</button></div>
       {p.renderTrackQuick(t)}
       <button className="editor-tools-toggle" aria-expanded={toolsTrack===t.id&&p.selected===t.id} onClick={()=>{p.onSelect(t.id);setToolsTrack(toolsTrack===t.id?'':t.id);}}>Track tools · trim, source & more</button>
      </div>
      <div className="editor-lane" style={{backgroundSize:`${tick*pps}px 100%`}}>
       {trackClips(t).map((trim,clipIndex)=>{const offset=t.offset+trim.offset,visibleStart=Math.max(trim.start,-offset),clipWidth=Math.max(0,(trim.end-visibleStart)*pps);const selectedSections=t.sections?.map(s=>({start:Math.max(s.start,visibleStart),end:Math.min(s.end,trim.end)})).filter(s=>s.end>s.start);return clipWidth>0&&<div key={trim.id} className={`editor-clip ${isSelected&&trim.id===p.clipId?'is-selected':''}`} role="button" tabIndex={p.blocked?-1:0} aria-label={`${t.name} clip ${clipIndex+1}. Arrow keys move; Enter selects.`} style={{left:Math.max(0,offset+trim.start)*pps,width:clipWidth}}
        onPointerDown={e=>begin(e,p.draft.tracks[index],trim.id,'move')} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{gesture.current=null;setGhost(undefined);}} onLostPointerCapture={()=>{gesture.current=null;setGhost(undefined);}}
        onKeyDown={e=>{if(p.blocked)return;if(e.key==='Enter')p.onClipSelect(t.id,trim.id);if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();p.onClipSelect(t.id,trim.id);change(t.id,moveClip(t,(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?1:.1),.1,trim.id));}}}>
        {(trim.fadeIn??0)>0&&<span className="editor-fade-shade fade-in" style={{width:Math.min(trim.fadeIn??0,(trim.end-trim.start)/2)*pps}}/>}{(trim.fadeOut??0)>0&&<span className="editor-fade-shade fade-out" style={{width:Math.min(trim.fadeOut??0,(trim.end-trim.start)/2)*pps}}/>}<div className="editor-clip-title">{t.name} · {clipIndex+1}</div>
        {peaks[t.path]?<svg className="editor-waveform" width={t.seconds*pps} height="60" viewBox="0 0 1000 60" preserveAspectRatio="none" style={{left:-visibleStart*pps}} aria-hidden="true"><path d={peaks[t.path].map((v,i)=>`M${i} ${30-v*28}V${30+v*28}`).join('')}/></svg>:<span className="editor-wave-status">{errors[t.path]??'Loading waveform…'}</span>}
        {t.sections!==undefined&&<div className="editor-section-mask">{selectedSections?.map((s,i)=><span key={i} style={{left:(s.start-visibleStart)*pps,width:(s.end-s.start)*pps}}/>)}</div>}
        <button className="editor-trim-handle start" disabled={p.blocked} aria-label={`Trim start of ${t.name} clip ${clipIndex+1}`} title="Drag to trim start; use trim fields for exact positions" onPointerDown={e=>begin(e,p.draft.tracks[index],trim.id,'start')} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{gesture.current=null;setGhost(undefined);}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.stopPropagation();e.preventDefault();change(t.id,trimClip(t,'start',e.key==='ArrowLeft'?-.1:.1,.1,trim.id));}}}/>
        <button className="editor-trim-handle end" disabled={p.blocked} aria-label={`Trim end of ${t.name} clip ${clipIndex+1}`} title="Drag to trim end; use trim fields for exact positions" onPointerDown={e=>begin(e,p.draft.tracks[index],trim.id,'end')} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{gesture.current=null;setGhost(undefined);}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.stopPropagation();e.preventDefault();change(t.id,trimClip(t,'end',e.key==='ArrowLeft'?-.1:.1,.1,trim.id));}}}/>
       </div>;})}
       <div className="editor-playhead" aria-hidden="true" style={{left:p.cursor*pps}} onPointerDown={beginCursor} onPointerMove={moveCursor} onPointerUp={endCursor} onPointerCancel={()=>{scrubbing.current=false;}} onLostPointerCapture={()=>{scrubbing.current=false;}}/>
      </div>

     </div>;
    })}
   </div>
  </div>

  {selected&&toolsTrack===selected.id&&<aside className="editor-tools-dock" aria-label="Selected track tools"><div className="editor-tools-dock-heading"><strong>Track tools <span>· {selected.name}</span></strong><button className="btn" onClick={()=>setToolsTrack('')}>Close tools</button></div><div className="editor-tools-dock-content">{p.renderTrackTools(selected)}</div></aside>}
 </section>;
}

export function BuilderTrimControls(p:{track:BuilderTrack;clipId:string;blocked:boolean;onChange:(patch:Partial<BuilderTrack>)=>void}){
 const selected=p.track,clip=trackClips(selected).find(c=>c.id===p.clipId);
 if(!clip)return <div className="editor-selection"><span>No clips on this track.</span><button className="btn" disabled={p.blocked} onClick={()=>p.onChange({clips:undefined,trim:undefined})}>Restore full track</button></div>;
 return <div className="editor-selection" key={selected.id+clip.id}>
  <strong>{selected.name} · clip {trackClips(selected).findIndex(c=>c.id===clip.id)+1}</strong>
  <label className="field">Trim start · source<MusicTimeInput value={clip.start} min={0} max={clip.end-.001} disabled={p.blocked} onChange={value=>{if(Number.isFinite(value)&&value>=0&&value<clip.end)p.onChange(patchClip(selected,clip.id,{start:value}));}}/></label>
  <label className="field">Trim end · source<MusicTimeInput value={clip.end} min={clip.start+.001} max={selected.seconds} disabled={p.blocked} onChange={value=>{if(Number.isFinite(value)&&value>clip.start&&value<=selected.seconds)p.onChange(patchClip(selected,clip.id,{end:value}));}}/></label>
  <div className="editor-fade-fields">{(['fadeIn','fadeOut'] as const).map(edge=><label className="field" key={edge}>{edge==='fadeIn'?'Fade in':'Fade out'} (s)<input aria-label={edge==='fadeIn'?'Clip fade in':'Clip fade out'} type="number" min={0} max={(clip.end-clip.start)/2} step={.05} value={Math.min(clip[edge]??0,(clip.end-clip.start)/2)} disabled={p.blocked} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value)&&value>=0)p.onChange(setClipFade(selected,clip.id,edge,value));}}/></label>)}</div>
  <span>Song position: {formatMusicTime(Math.max(0,selected.offset+clip.offset+clip.start))}–{formatMusicTime(Math.max(0,selected.offset+clip.offset+clip.end))}</span>
  <button className="btn" disabled={p.blocked||(clip.start===0&&clip.end===selected.seconds)} onClick={()=>p.onChange(patchClip(selected,clip.id,{start:0,end:selected.seconds}))}>Reset clip trim</button>
 </div>;
}
