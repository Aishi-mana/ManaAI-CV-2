import type {GameAsset} from './gameProject';
/** Fixed host-side media player. Only validated project data reaches this adapter. */
export function createGameMedia(assets:GameAsset[]){
 const images=new Map<string,HTMLImageElement>(),sounds=new Map<string,string>(),playing=new Set<HTMLAudioElement>(),last=new Map<string,number>();let closed=false;
 for(const asset of assets){if(asset.data.startsWith('data:image/')){const image=new Image();image.src=asset.data;images.set(asset.name,image);}else sounds.set(asset.name,asset.data);}
 return {
 draw(ctx:CanvasRenderingContext2D,type:string,args:(number|string)[]){
  const name=String(args[0]);if(type==='image'||type==='sprite'){const image=images.get(name);if(!image)throw Error('Missing image: '+name);if(image.complete){if(!image.naturalWidth||image.naturalWidth>2048||image.naturalHeight>2048)throw Error('Use valid images up to 2048 pixels per side.');if(type==='sprite'){const [sx,sy,sw,sh,x,y,w,h]=args.slice(1).map(Number);if(sx+sw>image.naturalWidth||sy+sh>image.naturalHeight)throw Error('Sprite frame exceeds image dimensions: '+name);const smooth=ctx.imageSmoothingEnabled;try{ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);}finally{ctx.imageSmoothingEnabled=smooth;}}else ctx.drawImage(image,Number(args[1]),Number(args[2]),Number(args[3]),Number(args[4]));}}
  else {const data=sounds.get(name);if(!data)throw Error('Missing sound: '+name);const now=performance.now();if(closed||playing.size>=4||now-(last.get(name)??-Infinity)<250)return;last.set(name,now);const audio=new Audio(data);audio.volume=Number(args[1]);playing.add(audio);const release=()=>{audio.pause();audio.removeAttribute('src');playing.delete(audio);};audio.onended=release;audio.onerror=release;audio.onloadedmetadata=()=>{if(!Number.isFinite(audio.duration)||audio.duration>10)release();};void audio.play().catch(release);}
 },
 stop(){closed=true;for(const audio of playing){audio.pause();audio.removeAttribute('src');}playing.clear();images.clear();}
 };
}
/** Decode imported media before storing, without playing it. */
export async function inspectGameAsset(data:string):Promise<void>{
 await new Promise<void>((resolve,reject)=>{
  const image=data.startsWith('data:image/')?new Image():undefined,audio=image?undefined:new Audio();
  const cleanup=()=>{clearTimeout(timer);if(audio){audio.onloadedmetadata=null;audio.onerror=null;audio.removeAttribute('src');}if(image){image.onload=null;image.onerror=null;}};
  const finish=(error?:string)=>{cleanup();error?reject(Error(error)):resolve();};
  const timer=setTimeout(()=>finish('Could not decode this asset.'),5000);
  if(image){image.onload=()=>finish(image.naturalWidth>2048||image.naturalHeight>2048||!image.naturalWidth?'Use images up to 2048 pixels per side.':undefined);image.onerror=()=>finish('Could not decode image.');image.src=data;}
  if(audio){audio.preload='metadata';audio.onloadedmetadata=()=>finish(!Number.isFinite(audio.duration)||audio.duration<=0||audio.duration>10?'Use sound effects up to 10 seconds.':undefined);audio.onerror=()=>finish('Could not decode sound.');audio.src=data;}
 });
}
