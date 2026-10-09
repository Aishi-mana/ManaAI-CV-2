import { invoke } from '@tauri-apps/api/core';
import { analyzeImage, checkVision, visionRequest } from './vision';
import type { VisionSettings, ImageAttachment } from './vision';

export async function inspectForChat(config:VisionSettings,exePath:string,chatPort:number,image:ImageAttachment,question:string,signal:AbortSignal,onStatus:(status:string)=>void,reference?:string):Promise<{filename:string;description:string}>{
 if(config.port===chatPort)throw Error('Vision must use a separate port. Configure it in More → Images.');
 visionRequest(question,image.dataUrl,reference);
 if(signal.aborted)throw new DOMException('Stopped','AbortError');
 let owned=false;
 try{
  let ready=false;
  try{await checkVision(config.port,AbortSignal.timeout(2000));ready=true;}catch(e){if(String(e).includes('does not report image support'))throw e;}
  if(signal.aborted)throw new DOMException('Stopped','AbortError');
  if(!ready){
   if(!config.modelPath||!config.projectorPath)throw Error('Choose the vision model and matching projector in More → Images first.');
   onStatus('Loading vision model…');await invoke('vision_start',{exePath,...config});owned=true;
   for(let i=0;i<180;i++){
    if(signal.aborted)throw new DOMException('Stopped','AbortError');
    try{await checkVision(config.port,AbortSignal.timeout(2000));ready=true;break;}catch{}
    if(!await invoke<boolean>('vision_running'))throw Error('Vision server stopped. Check More → Images setup and vision-server.log.');
    await new Promise(resolve=>setTimeout(resolve,1000));
   }
   if(!ready)throw Error('Vision startup timed out. Check More → Images setup.');
  }
  if(signal.aborted)throw new DOMException('Stopped','AbortError');
  onStatus('Inspecting attached image…');
  const description=await analyzeImage(config.port,question,image.dataUrl,signal,reference);
  if(signal.aborted)throw new DOMException('Stopped','AbortError');
  return {filename:image.filename.slice(0,200),description};
 }finally{if(owned)await invoke('vision_stop');}
}
