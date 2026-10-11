import {invoke} from '@tauri-apps/api/core';
import {loadCustomVoice} from './customVoice';

let starting:Promise<void>|null=null;
/** Share startup between the automatic loader and setup's manual button. */
export function ensureCustomVoice():Promise<void>{
 if(starting)return starting;
 starting=(async()=>{
  const config=loadCustomVoice();
  try{await invoke('custom_voice_check',{port:config.port});return;}catch{/* Start a local service if needed. */}
  try{await invoke('custom_voice_server_start',{pythonPath:config.pythonPath,repoPath:config.repoPath,port:config.port,gptPath:config.gptPath,sovitsPath:config.sovitsPath});}
  catch(error){if(!String(error).includes('Managed voice service is already running'))throw error;}
  const deadline=Date.now()+180000;
  while(Date.now()<deadline){
   try{await invoke('custom_voice_check',{port:config.port});return;}catch{await new Promise(resolve=>setTimeout(resolve,2000));}
  }
  throw Error('Custom voice startup timed out. Check custom-voice.log in Mana app data.');
 })().finally(()=>{starting=null;});
 return starting;
}
