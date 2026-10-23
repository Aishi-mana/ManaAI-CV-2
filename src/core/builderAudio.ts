import {invoke} from '@tauri-apps/api/core';

// Waveforms and live playback share the same decode; no mix WAV is prepared for Play.
const buffers=new Map<string,Promise<AudioBuffer>>();
export function loadBuilderAudio(path:string):Promise<AudioBuffer>{
 const cached=buffers.get(path);if(cached)return cached;
 const pending=(async()=>{
  const raw=await invoke<ArrayBuffer|number[]>('singing_audio',{path});
  const context=new AudioContext();
  try{return await context.decodeAudioData((raw instanceof ArrayBuffer?raw:new Uint8Array(raw).buffer).slice(0));}
  finally{await context.close();}
 })();
 buffers.set(path,pending);void pending.catch(()=>{if(buffers.get(path)===pending)buffers.delete(path);});return pending;
}
export function retainBuilderAudio(paths:string[]){const keep=new Set(paths);for(const path of buffers.keys())if(!keep.has(path))buffers.delete(path);}
