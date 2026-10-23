/** Owns one native job and one GPU lease, including cancellation during startup. */
export function imageSession(start:()=>Promise<string>,stop:(id:string)=>Promise<unknown>,acquire:()=>Promise<()=>Promise<void>>){
 let id:string|undefined,cancelled=false,begin:Promise<string|undefined>|undefined,ending:Promise<void>|undefined;
 let release:(()=>Promise<void>)|undefined,released:Promise<void>|undefined;
 const free=()=>released??(released=release?release():Promise.resolve());
 return {
  start(){return begin??(begin=(async()=>{release=await acquire();if(cancelled)return;id=await start();return cancelled?undefined:id;})());},
  stop(){cancelled=true;return ending??(ending=(async()=>{try{await begin;}catch{/* Failed startup still releases its lease. */}try{if(id)await stop(id);}finally{await free();}})());},
  complete:free,
 };
}
