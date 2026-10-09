import { buildLayers, EMOTION_MAP } from './avatar';
import type { AvatarAssets, AvatarConfig } from './avatar';
export function referenceLayers(assets:AvatarAssets,cfg:AvatarConfig){const neutral=EMOTION_MAP.neutral;return buildLayers(assets,cfg).filter(layer=>layer.slot==='static'||layer.variant===(layer.slot==='eyes'?neutral.eyes:neutral.mouth));}
export async function prepareAvatarReference(assets:AvatarAssets,cfg:AvatarConfig,signal:AbortSignal):Promise<string>{
 const layers=referenceLayers(assets,cfg);if(!layers.length)throw Error('Avatar reference is unavailable. Check the avatar folder or disable avatar comparison.');
 const images=await Promise.all(layers.map(layer=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not load avatar reference layer.'));image.src=layer.url;})));
 if(signal.aborted)throw new DOMException('Stopped','AbortError');
 const first=images[0],scale=Math.min(1,640/Math.max(first.naturalWidth,first.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(first.naturalWidth*scale));canvas.height=Math.max(1,Math.round(first.naturalHeight*scale));
 const context=canvas.getContext('2d');if(!context)throw Error('Avatar reference preparation is unavailable.');
 context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);for(const image of images)context.drawImage(image,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/jpeg',0.85);
}
