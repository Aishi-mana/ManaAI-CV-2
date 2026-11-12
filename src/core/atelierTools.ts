import {readOutfitProject,readAtelierHistory,type AtelierCategory,type AtelierDepth,type OutfitPiece,type OutfitTransform} from './outfitPrototype';
export function nudgeLayer(transform:OutfitTransform,dx:number,dy:number,locked=false):OutfitTransform{return locked?transform:{...transform,x:Math.max(-2048,Math.min(2048,transform.x+dx)),y:Math.max(-2048,Math.min(2048,transform.y+dy))};}
export function editableLayer(pieces:OutfitPiece[],id:string){return !pieces.find(p=>p.id===id)?.locked;}
export function readPortableProject(value:unknown){
 const v=value as {format?:string;version?:number;category?:AtelierCategory;depth?:AtelierDepth;project?:{sourceDataUrl?:string;sourceSize?:{width:number;height:number}}};
 if(v?.format!=='mana-atelier-project'||v.version!==1||!['outfit','hair','accessory'].includes(v.category??''))throw Error('Choose a Mana editable project backup.');
 const p=v.project,w=p?.sourceSize?.width??0,h=p?.sourceSize?.height??0;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>4096||h>4096||!p||typeof p.sourceDataUrl!=='string'||p.sourceDataUrl.length>24_000_000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.sourceDataUrl))throw Error('Project source must be an embedded PNG under 24 MB and 4096 pixels per side.');
 const parsed=readOutfitProject(p,w,h);readAtelierHistory(p,w,h);
 if(v.depth!==undefined&&!['top','behind-front-hair','behind-body','back'].includes(v.depth))throw Error('Invalid accessory depth.');
 return {name:parsed.name,category:v.category!,depth:v.depth,project:p,sourceDataUrl:p.sourceDataUrl,width:w,height:h};
}
