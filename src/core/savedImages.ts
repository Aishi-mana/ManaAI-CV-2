import { readStored, writeStored } from './persistence';
import { isRecord } from './validation';
import { uid } from './types';
import type { ImageAttachment } from './vision';
export interface SavedImage {id:string;filename:string;dataUrl:string;createdAt:string;depictsAvatar?:true;diskId?:string;byteSize?:number;fingerprint?:string}
export const IMAGE_LIMIT=100,IMAGE_DATA_LIMIT=8_000_000;
const KEY='mana.images.v1';
export function validImageData(value:unknown):value is string{return typeof value==='string'&&value.length<=3_000_000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value)&&value.slice('data:image/jpeg;base64,'.length).length%4===0;}
export function validateSavedImages(value:unknown):SavedImage[]{
 if(!Array.isArray(value))return [];
 const ids=new Set<string>();let bytes=0,legacyCount=0;const result:SavedImage[]=[];
 for(const v of value){
  if(!isRecord(v)||typeof v.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(v.id)||ids.has(v.id)||typeof v.filename!=='string'||!v.filename.trim()||v.filename.length>200||!validImageData(v.dataUrl)||typeof v.createdAt!=='string'||!Number.isFinite(Date.parse(v.createdAt)))continue;
  const disk=v.diskId===v.id&&v.dataUrl.length<=150_000&&Number.isInteger(v.byteSize)&&(v.byteSize as number)>0&&(v.byteSize as number)<=2_250_000&&typeof v.fingerprint==='string'&&/^[a-f0-9]{64}$/.test(v.fingerprint);
  if(v.diskId!==undefined&&!disk)continue;
  if(!disk&&(legacyCount>=IMAGE_LIMIT||bytes+v.dataUrl.length>IMAGE_DATA_LIMIT))continue;
  ids.add(v.id);if(!disk){bytes+=v.dataUrl.length;legacyCount++;}result.push({id:v.id,filename:v.filename,dataUrl:v.dataUrl,createdAt:v.createdAt,...(disk?{diskId:v.id,byteSize:v.byteSize as number,fingerprint:v.fingerprint as string}:{}),...(v.depictsAvatar===true?{depictsAvatar:true as const}:{})});
 }
 return result;
}
export function loadSavedImages():SavedImage[]{try{return validateSavedImages(JSON.parse(readStored(KEY)??'[]'));}catch{return [];}}
export function saveSavedImages(images:SavedImage[]){writeStored(KEY,JSON.stringify(validateSavedImages(images)));}
export function retainImage(images:SavedImage[],image:ImageAttachment):{images:SavedImage[];imageId:string}{
 if(!validImageData(image.dataUrl))throw Error('The prepared image cannot be saved. Reattach the PNG/JPEG and try again.');
 const existing=images.find(i=>i.dataUrl===image.dataUrl);if(existing)return {images,imageId:existing.id};
 if(images.length>=IMAGE_LIMIT||images.reduce((sum,i)=>sum+i.dataUrl.length,0)+image.dataUrl.length>IMAGE_DATA_LIMIT)throw Error('Saved image storage is full. Delete an image in More → Saved images, then retry.');
 const next:SavedImage={id:uid(),filename:image.filename.slice(0,200),dataUrl:image.dataUrl,createdAt:new Date().toISOString()};
 return {images:[...images,next],imageId:next.id};
}
