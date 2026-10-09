import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { analyzeImage, checkVision, loadVisionSettings, prepareImage, saveVisionSettings, visionDiscussion } from '../core/vision';
export default function VisionDrawer({exePath,chatPort,canDiscuss,onDiscuss,onClose,onBusy}:{exePath:string;chatPort:number;canDiscuss:boolean;onDiscuss:(text:string)=>void;onClose:()=>void;onBusy:(busy:boolean)=>void}){
 const [config,setConfig]=useState(loadVisionSettings),[image,setImage]=useState(''),[filename,setFilename]=useState(''),[question,setQuestion]=useState('Describe this image.'),[report,setReport]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('Not connected'),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false);
 const ctrl=useRef<AbortController|null>(null),owned=useRef(false),alive=useRef(true),selection=useRef(0);
 const reportedQuestion=useRef('');
 function work(value:boolean){setBusy(value);onBusy(value);}
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;selection.current++;ctrl.current?.abort();if(owned.current)void invoke('vision_stop').catch(()=>{});onBusy(false);};},[]);
 useEffect(()=>{let active=true;void invoke<{modelPath:string;projectorPath:string}|null>('vision_detect_model').then(pair=>{if(active&&pair)setConfig(previous=>{if(previous.modelPath||previous.projectorPath)return previous;const next={...previous,...pair};saveVisionSettings(next);return next;});}).catch(()=>{});return()=>{active=false;};},[]);
 function save(next:typeof config){setConfig(next);saveVisionSettings(next);setConnected(false);}
 async function browse(key:'modelPath'|'projectorPath'){try{const path=await open({multiple:false,filters:[{name:'GGUF',extensions:['gguf']}]});if(typeof path==='string')save({...config,[key]:path});}catch(e){setError(String(e));}}
 async function start(){
  if(busy)return;if(config.port===chatPort){setError('Use a different port from the chat model.');return;}
  work(true);setError('');const controller=new AbortController();ctrl.current=controller;
  try{
   try{await checkVision(config.port,AbortSignal.timeout(2000));setConnected(true);setStatus('Connected to existing local vision server');return;}catch(e){if(String(e).includes('does not report image support'))throw e;}
   if(controller.signal.aborted)return;
   await invoke('vision_start',{exePath,...config});owned.current=true;
   if(controller.signal.aborted){await invoke('vision_stop');owned.current=false;return;}
   setStatus('Loading vision model…');
   for(let i=0;i<180;i++){
    if(controller.signal.aborted)return;
    try{await checkVision(config.port,AbortSignal.timeout(2000));if(!controller.signal.aborted){setConnected(true);setStatus('Vision ready');}return;}catch{}
    if(!controller.signal.aborted&&!await invoke<boolean>('vision_running'))throw Error('Vision server stopped during startup. Check matching model/projector files and vision-server.log in Mana’s app-data folder.');
    await new Promise(resolve=>setTimeout(resolve,1000));
   }
   throw Error('Vision startup timed out. Check the matching projector and vision-server.log in Mana’s app-data folder.');
  }catch(e){if(alive.current&&!controller.signal.aborted){setError(String(e));setConnected(false);setStatus('Not connected');}}
  finally{ctrl.current=null;if(alive.current)work(false);}
 }
 async function stop(){ctrl.current?.abort();setConnected(false);setStatus('Not connected');if(owned.current){try{await invoke('vision_stop');owned.current=false;}catch(e){setError(String(e));}}}
 async function choose(file:File){const token=++selection.current;setError('');setImage('');setReport('');setFilename('');try{const data=await prepareImage(file);if(alive.current&&selection.current===token){setImage(data);setFilename(file.name);}}catch(e){if(alive.current&&selection.current===token)setError(String(e));}}
 async function analyze(){if(busy||!image||!connected)return;work(true);setError('');setReport('');const controller=new AbortController();ctrl.current=controller;reportedQuestion.current=question;
  const timeout=setTimeout(()=>controller.abort(),180000);
  try{const result=await analyzeImage(config.port,question,image,controller.signal);if(alive.current&&!controller.signal.aborted)setReport(result);}catch(e){if(alive.current)setError(controller.signal.aborted?'Image request stopped or timed out.':String(e));}
  finally{clearTimeout(timeout);ctrl.current=null;if(alive.current)work(false);}
 }
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Image understanding"><header className="drawer-head"><h2>Image understanding</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <p>Choose an image for a separate local vision model to inspect. Review its description before discussing it with Mana. Image files stay out of chat history and backups.</p>
 <details open={!connected}><summary>Vision model setup</summary>
 <p className="hint-soft">Uses your llama-server file from Settings. CPU mode (0 GPU layers) leaves the chat model’s GPU space available. Choose matching model/projector GGUF files.</p>
 <fieldset disabled={busy||owned.current}>
 <label className="field">Vision model file<div className="pathrow"><input value={config.modelPath} onChange={e=>save({...config,modelPath:e.target.value})}/><button className="btn" onClick={()=>void browse('modelPath')}>Browse</button></div></label>
 <label className="field">Matching projector file<div className="pathrow"><input value={config.projectorPath} onChange={e=>save({...config,projectorPath:e.target.value})}/><button className="btn" onClick={()=>void browse('projectorPath')}>Browse</button></div></label>
 <div className="grid2"><label className="field">Vision port<input type="number" min={1024} max={65535} value={config.port} onChange={e=>save({...config,port:Number(e.target.value)})}/></label><label className="field">GPU layers<input type="number" min={0} max={999} value={config.gpuLayers} onChange={e=>save({...config,gpuLayers:Number(e.target.value)})}/></label></div>
 </fieldset></details>
 <p role="status">{status}</p><button className="btn" disabled={busy||connected} onClick={()=>void start()}>Start / connect vision</button><button className="btn" onClick={()=>void stop()} disabled={!busy&&!connected&&!owned.current}>Stop vision</button>
 <label className="field">Attach image (PNG/JPEG, up to 10 MB)<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void choose(file);}}/></label>
 {image&&<><img className="vision-preview" src={image} alt={`Selected image: ${filename}`}/><p>{filename}</p><button className="btn" disabled={busy} onClick={()=>{selection.current++;setImage('');setFilename('');setReport('');}}>Remove image</button></>}
 <label className="field">Ask about the image<textarea value={question} maxLength={1000} disabled={busy} onChange={e=>setQuestion(e.target.value)}/></label>
 <button className="btn primary" disabled={busy||!image||!connected} onClick={()=>void analyze()}>Inspect image</button>
 {error&&<p className="msg-error" role="alert">{error}</p>}
 {report&&<><h3>Vision model description</h3><p className="memory-content">{report}</p><p className="hint-soft">May contain mistakes. Discuss sends this description and your question into chat; Mana’s chat model receives text, not image pixels. No automatic memory or self-recognition.</p><button className="btn" disabled={busy||!canDiscuss} onClick={()=>onDiscuss(visionDiscussion(filename,reportedQuestion.current,report))}>Discuss with Mana</button></>}
 </div></section></>;
}
