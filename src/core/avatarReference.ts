import { buildLayers, EMOTION_MAP } from './avatar';
import type { AvatarAssets, AvatarConfig } from './avatar';
export function referenceLayers(assets:AvatarAssets,cfg:AvatarConfig){const neutral=EMOTION_MAP.neutral;return buildLayers(assets,cfg).filter(layer=>layer.slot==='static'||layer.variant===(layer.slot==='eyes'?neutral.eyes:neutral.mouth));}
export async function prepareAvatarReference(assets:AvatarAssets,cfg:AvatarConfig,signal:AbortSignal,maxEdge=640,clothingEdit=false,garmentPrompt=""):Promise<string>{
 const layers=generationReferenceLayers(assets,cfg,clothingEdit);if(!layers.length)throw Error('Avatar reference is unavailable. Check the avatar folder or disable avatar comparison.');
 const images=await Promise.all(layers.map(layer=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not load avatar reference layer.'));image.src=layer.url;})));
 if(signal.aborted)throw new DOMException('Stopped','AbortError');
 const first=images[0],scale=Math.min(1,Math.min(1024,Math.max(128,maxEdge))/Math.max(first.naturalWidth,first.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(first.naturalWidth*scale));canvas.height=Math.max(1,Math.round(first.naturalHeight*scale));
 const context=canvas.getContext('2d');if(!context)throw Error('Avatar reference preparation is unavailable.');
 context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);for(let i=0;i<images.length;i++){context.drawImage(images[i],0,0,canvas.width,canvas.height);}
 return canvas.toDataURL('image/jpeg',maxEdge>640?0.9:0.85);
}

/** Outfit-bounded edit area, with hair and accessories protected. White = edit. */
export async function prepareAvatarClothingMask(assets:AvatarAssets,cfg:AvatarConfig,signal:AbortSignal):Promise<string>{
 const layers=referenceLayers(assets,cfg);if(!layers.length)throw Error('Avatar layers are unavailable.');
 const loaded=await Promise.all(layers.map(layer=>new Promise<{key:string;image:HTMLImageElement}>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({key:layer.key,image});image.onerror=()=>reject(Error('Could not load clothing reference layers.'));image.src=layer.url;})));
 if(signal.aborted)throw new DOMException('Stopped','AbortError');
 const first=loaded[0].image,scale=Math.min(1,1024/Math.max(first.naturalWidth,first.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.round(first.naturalWidth*scale);canvas.height=Math.round(first.naturalHeight*scale);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Clothing mask preparation is unavailable.');
 const clothes=loaded.filter(layer=>layer.key.toLowerCase().startsWith('outfits/'));if(!clothes.length)throw Error('The avatar has no separate outfit layer to edit.');
 for(const {image} of clothes)ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const bounds=clothingBounds(pixels,canvas.width,canvas.height);if(!bounds)throw Error('The outfit layer is empty.');
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='black';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';ctx.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
 // Composite protection in the same order as the avatar. Outfit/body layers hide
 // back hair: its hidden silhouette must not protect the torso from editing.
 const protection=document.createElement('canvas');protection.width=canvas.width;protection.height=canvas.height;
 const protectedCtx=protection.getContext('2d');if(!protectedCtx)throw Error('Clothing protection preparation is unavailable.');
 for(const {key,image} of loaded){protectedCtx.globalCompositeOperation=protectionOperation(key);protectedCtx.drawImage(image,0,0,canvas.width,canvas.height);}
 // Keep the original neck anatomy, with a soft transition at the shoulders.
 const body=loaded.find(layer=>/^base\//i.test(layer.key));
 if(body){
  const neck=document.createElement('canvas');neck.width=canvas.width;neck.height=canvas.height;
  const nc=neck.getContext('2d');if(!nc)throw Error('Neck reference preparation is unavailable.');
  nc.drawImage(body.image,0,0,canvas.width,canvas.height);
  const end=neckTransitionRow(nc.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  if(end!==null){const data=nc.getImageData(0,0,canvas.width,canvas.height).data,band=neckColumnBounds(data,canvas.width,canvas.height);if(band){nc.clearRect(0,0,band.left,canvas.height);nc.clearRect(band.right,0,canvas.width-band.right,canvas.height);}const fade=Math.max(2,Math.round(canvas.height*.013)),gradient=nc.createLinearGradient(0,end,0,end+fade);gradient.addColorStop(0,'white');gradient.addColorStop(1,'rgba(255,255,255,0)');nc.globalCompositeOperation='destination-in';nc.fillStyle=gradient;nc.fillRect(0,0,canvas.width,canvas.height);protectedCtx.globalCompositeOperation='source-over';protectedCtx.drawImage(neck,0,0);}
 }
 ctx.globalCompositeOperation='destination-out';ctx.drawImage(protection,0,0);
 ctx.globalCompositeOperation='destination-over';ctx.fillStyle='black';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 return canvas.toDataURL('image/jpeg',.95);
}
export function clothingBounds(pixels:Uint8ClampedArray,width:number,height:number):{x:number;y:number;width:number;height:number}|null{
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<0)return null;
 const padding=Math.ceil((right-left+1)*.2),x=Math.max(0,left-padding),end=Math.min(width,right+padding+1);
 return {x,y:top,width:end-x,height:height-top};
}

export function protectionOperation(key:string):GlobalCompositeOperation{return /^(hairstyles|accessories)\//i.test(key)?'source-over':'destination-out';}

export function generationReferenceLayers(assets:AvatarAssets,cfg:AvatarConfig,clothingEdit=false){return referenceLayers(assets,cfg).filter(layer=>!clothingEdit||!/^outfits\//i.test(layer.key));}

/** Find the narrow neck widening into shoulders in a standing body layer. */
export function neckTransitionRow(pixels:Uint8ClampedArray,width:number,height:number):number|null{
 const spans=new Map<number,number>();let narrow=width,at=-1;
 for(let y=Math.floor(height*.25);y<=Math.floor(height*.34);y++){
  let left=width,right=-1;for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
  const span=right<0?0:right-left+1;spans.set(y,span);if(span>=width*.025&&span<narrow){narrow=span;at=y;}
 }
 if(at<0||narrow>width*.2)return null;
 for(let y=at+1;y<=Math.floor(height*.34);y++)if((spans.get(y)??0)>=narrow*3)return y;
 return null;
}

/** Limit neck preservation to its central column; shoulders stay editable. */
export function neckColumnBounds(pixels:Uint8ClampedArray,width:number,height:number):{left:number;right:number}|null{
 let best=width,result:{left:number;right:number}|null=null;
 for(let y=Math.floor(height*.25);y<=Math.floor(height*.32);y++){let left=width,right=-1;for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}const span=right-left+1;if(span>=width*.025&&span<best){best=span;const pad=Math.ceil(span*.15);result={left:Math.max(0,left-pad),right:Math.min(width,right+pad+1)};}}
 return best<=width*.2?result:null;
}

