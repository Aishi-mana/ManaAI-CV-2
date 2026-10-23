import fs from 'node:fs';const p='src/components/SingingDrawer.tsx';let s=fs.readFileSync(p,'utf8');s=s.replace('const token=useRef(0),preview=useRef(0),','const autoplayRequested=useRef(true);\n const token=useRef(0),preview=useRef(0),');s=s.replace('function clearPlayer(){preview.current++;','function clearPlayer(){autoplayRequested.current=true;preview.current++;');
s=s.replace("useEffect(()=>{if(url&&audio.current){audio.current.volume=volume;void audio.current.play().catch(error=>setStatus(String(error)));}},[url]);","useEffect(()=>{if(url&&audio.current){audio.current.volume=volume;if(autoplayRequested.current)void audio.current.play().catch(error=>setStatus(String(error)));}},[url]);");
const before=' useEffect(()=>{if(audio.current)audio.current.volume=volume;},[volume]);';
const effect=` useEffect(()=>{
  const path=originalDraft?.project.mix;
  if(!p.active||tab!=='original'||!path)return;
  clearPlayer();autoplayRequested.current=false;
  const epoch=preview.current;let cancelled=false;setLoading(true);
  void invoke<ArrayBuffer|number[]>('singing_audio',{path}).then(raw=>{
   if(cancelled||epoch!==preview.current)return;
   const bytes=raw instanceof ArrayBuffer?raw:new Uint8Array(raw).buffer;
   activeUrl.current=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));loaded.current=path;setUrl(activeUrl.current);
  }).catch(error=>{if(!cancelled&&epoch===preview.current)setStatus('Preview could not load: '+String(error));})
   .finally(()=>{if(!cancelled&&epoch===preview.current)setLoading(false);});
  return()=>{cancelled=true;};
 },[originalDraft?.project.mix,tab,p.active]);
`;
s=s.replace(before,effect+before);
s=s.replace('const playbackAudio=url?<audio','const playbackAudio=(url||(tab===\'original\'&&originalDraft))?<audio');s=s.replace('ref={audio} src={url} onPlay=','ref={audio} src={url||undefined} preload="metadata" onPlay=');
fs.writeFileSync(p,s);
