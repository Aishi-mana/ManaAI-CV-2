import {invoke} from '@tauri-apps/api/core';
import {uid} from './types';
import {validImageData,type SavedImage} from './savedImages';
import type {ImageAttachment} from './vision';

function jpegBytes(dataUrl:string):Uint8Array{
 if(!validImageData(dataUrl))throw Error('Use a prepared JPEG picture.');
 return Uint8Array.from(atob(dataUrl.split(',')[1]),c=>c.charCodeAt(0));
}
export async function imageFingerprint(dataUrl:string):Promise<string>{
 const hash=await crypto.subtle.digest('SHA-256',jpegBytes(dataUrl) as Uint8Array<ArrayBuffer>);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function thumbnail(bytes:Uint8Array):Promise<string>{
 const bitmap=await createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>],{type:'image/jpeg'}));
 try{const scale=Math.min(1,280/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Could not prepare gallery thumbnail.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.72);if(!validImageData(data)||data.length>150_000)throw Error('Gallery thumbnail is too large.');return data;}finally{bitmap.close();}
}
async function diskRecord(image:ImageAttachment,prior?:SavedImage):Promise<SavedImage>{
 const bytes=jpegBytes(image.dataUrl),fingerprint=await imageFingerprint(image.dataUrl),preview=await thumbnail(bytes),id=prior?.id??uid();
 await invoke('gallery_write',{id,bytes:Array.from(bytes)});
 // The native write is immutable and verifies the completed file before returning.
 return {id,filename:image.filename.slice(0,200),createdAt:prior?.createdAt??new Date().toISOString(),dataUrl:preview,diskId:id,byteSize:bytes.length,fingerprint,...(prior?.depictsAvatar?{depictsAvatar:true as const}:{})};
}
export async function migrateGallery(images:SavedImage[]):Promise<SavedImage[]>{
 const legacy=images.filter(image=>!image.diskId);if(!legacy.length)return images;
 await invoke('gallery_preserve_legacy',{content:JSON.stringify(legacy)});
 const next:SavedImage[]=[];
 for(const image of images)next.push(image.diskId?image:await diskRecord(image,image));
 return next; // Caller commits metadata only after every legacy file is verified.
}
export async function addDiskImage(images:SavedImage[],image:ImageAttachment):Promise<{images:SavedImage[];imageId:string}>{
 const fingerprint=await imageFingerprint(image.dataUrl),existing=images.find(i=>i.fingerprint===fingerprint||(!i.diskId&&i.dataUrl===image.dataUrl));
 if(existing)return {images,imageId:existing.id};
 const saved=await diskRecord(image);return {images:[...images,saved],imageId:saved.id};
}
export async function fullGalleryImage(image:SavedImage):Promise<SavedImage>{
 if(!image.diskId)return image;
 const raw=await invoke<ArrayBuffer|number[]>('gallery_read',{id:image.diskId}),bytes=new Uint8Array(raw);let encoded='';
 for(let i=0;i<bytes.length;i+=16384)encoded+=String.fromCharCode(...bytes.subarray(i,i+16384));
 const dataUrl='data:image/jpeg;base64,'+btoa(encoded);if(!validImageData(dataUrl))throw Error('The gallery file is not a supported JPEG.');return {...image,dataUrl};
}
export async function removeDiskImage(image:SavedImage):Promise<void>{if(image.diskId)await invoke('gallery_remove',{id:image.diskId});}
export const galleryFolder=()=>invoke<string>('gallery_folder');
