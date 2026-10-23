export interface Point{x:number;y:number}
export interface CutRegion{points:Point[];erase:boolean;kind?:'polygon'|'brush'|'background'|'clip';brushSize?:number;tolerance?:number;group?:number}
export interface OutfitTransform{scale:number;x:number;y:number;frame:number}
export interface Box{x:number;y:number;width:number;height:number}
export const MIN_OUTFIT_SCALE=.02,MAX_OUTFIT_SCALE=4;
export function fitOutfit(sourceWidth:number,sourceHeight:number,width:number,height:number,t:OutfitTransform){
 if(![sourceWidth,sourceHeight,width,height].every(n=>Number.isFinite(n)&&n>0&&n<=4096)||!Number.isFinite(t.scale)||t.scale<MIN_OUTFIT_SCALE||t.scale>MAX_OUTFIT_SCALE||!Number.isFinite(t.frame)||t.frame<.5||t.frame>1||![t.x,t.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=2048))throw Error('Choose valid outfit alignment.');
 const s=Math.max(width/(sourceWidth*t.frame),height/(sourceHeight*t.frame))*t.scale;
 return {x:(width-sourceWidth*s)/2+t.x,y:(height-sourceHeight*s)/2+t.y,width:sourceWidth*s,height:sourceHeight*s};
}
export function polygonArea(points:Point[]){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2);}
export function validRegion(points:Point[],width:number,height:number){return points.length>=3&&points.length<=200&&points.every(p=>validPoint(p,width,height))&&polygonArea(points)>=4;}
function validPoint(p:Point,width:number,height:number){return p&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=width&&p.y<=height;}
export function validCut(r:CutRegion,width:number,height:number){
 if(!r||typeof r.erase!=='boolean'||!Array.isArray(r.points)||(r.group!==undefined&&(!Number.isSafeInteger(r.group)||r.group<0)))return false;
 if(r.kind==='brush')return r.points.length>0&&r.points.length<=2048&&r.points.every(p=>validPoint(p,width,height))&&Number.isFinite(r.brushSize)&&r.brushSize!>=1&&r.brushSize!<=500;
 if(r.kind==='background')return r.erase&&r.points.length===1&&validPoint(r.points[0],width-1,height-1)&&Number.isFinite(r.tolerance)&&r.tolerance!>=0&&r.tolerance!<=120;
 return (!r.kind||r.kind==='polygon'||r.kind==='clip')&&validRegion(r.points,width,height);
}
/** Flood only pixels connected to the clicked background; enclosed light fabric is not selected globally. */
export function backgroundPixels(data:Uint8ClampedArray,width:number,height:number,seed:Point,tolerance:number){
 if(data.length!==width*height*4||!validPoint(seed,width-1,height-1)||!Number.isFinite(tolerance)||tolerance<0||tolerance>120)throw Error('Choose a background pixel and tolerance between 0 and 120.');
 const count=width*height,seen=new Uint8Array(count),queue=new Int32Array(count),selected=new Uint8Array(count),first=Math.floor(seed.y)*width+Math.floor(seed.x),offset=first*4;
 let read=0,write=1;queue[0]=first;seen[first]=1;
 const matches=(i:number)=>{const p=i*4;return Math.max(Math.abs(data[p]-data[offset]),Math.abs(data[p+1]-data[offset+1]),Math.abs(data[p+2]-data[offset+2]),Math.abs(data[p+3]-data[offset+3]))<=tolerance;};
 while(read<write){const i=queue[read++];if(!matches(i))continue;selected[i]=255;const x=i%width;for(const n of [x>0?i-1:-1,x<width-1?i+1:-1,i>=width?i-width:-1,i+width<count?i+width:-1])if(n>=0&&!seen[n]){seen[n]=1;queue[write++]=n;}}
 return selected;
}
export function loadOutfitImage(url:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Could not load this picture.'));im.src=url;});}
export function cutOutfit(source:HTMLImageElement,regions:CutRegion[]){
 const mask=document.createElement('canvas');mask.width=source.naturalWidth;mask.height=source.naturalHeight;const m=mask.getContext('2d');if(!m)throw Error('Image editing is unavailable.');
 const original=document.createElement('canvas');original.width=mask.width;original.height=mask.height;const raw=original.getContext('2d')!;raw.drawImage(source,0,0);let pixels:Uint8ClampedArray|undefined;
 for(const region of regions){
  if(!validCut(region,mask.width,mask.height))throw Error('Invalid clothing outline or brush stroke.');m.globalCompositeOperation=region.erase?'destination-out':'source-over';m.fillStyle='white';
  if(region.kind==='background'){
   pixels??=raw.getImageData(0,0,mask.width,mask.height).data;const selected=backgroundPixels(pixels,mask.width,mask.height,region.points[0],region.tolerance!);const c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;const ctx=c.getContext('2d')!,im=ctx.createImageData(mask.width,mask.height);for(let i=0;i<selected.length;i++)im.data[i*4+3]=selected[i];ctx.putImageData(im,0,0);m.drawImage(c,0,0);
  }else if(region.kind==='brush'){
   m.strokeStyle='white';m.lineWidth=region.brushSize!;m.lineCap='round';m.lineJoin='round';m.beginPath();region.points.forEach((p,i)=>i?m.lineTo(p.x,p.y):m.moveTo(p.x,p.y));m.stroke();for(const p of [region.points[0],region.points[region.points.length-1]]){m.beginPath();m.arc(p.x,p.y,region.brushSize!/2,0,Math.PI*2);m.fill();}
  }else if(region.kind==='clip'){const c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;const ctx=c.getContext('2d')!;ctx.fillStyle='white';ctx.beginPath();region.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();m.globalCompositeOperation='destination-in';m.drawImage(c,0,0);
  }else{m.beginPath();region.points.forEach((p,i)=>i?m.lineTo(p.x,p.y):m.moveTo(p.x,p.y));m.closePath();m.fill();}
 }
 raw.globalCompositeOperation='destination-in';raw.drawImage(mask,0,0);return original;
}
export function placeOutfit(cut:HTMLCanvasElement,width:number,height:number,t:OutfitTransform){const out=document.createElement('canvas');out.width=width;out.height=height;const fit=fitOutfit(cut.width,cut.height,width,height,t);out.getContext('2d')!.drawImage(cut,fit.x,fit.y,fit.width,fit.height);return out;}
export function renderOutfit(source:HTMLImageElement,regions:CutRegion[],width:number,height:number,t:OutfitTransform){return placeOutfit(cutOutfit(source,regions),width,height,t);}
export function alphaBounds(data:Uint8ClampedArray,width:number,height:number):Box|null{let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return right<0?null:{x:left,y:top,width:right-left+1,height:bottom-top+1};}
export function transformedBounds(bounds:Box,fit:Box,source:{width:number;height:number}):Box{return {x:fit.x+bounds.x*fit.width/source.width,y:fit.y+bounds.y*fit.height/source.height,width:bounds.width*fit.width/source.width,height:bounds.height*fit.height/source.height};}
export function readOutfitSelection(value:unknown,width:number,height:number):{name:string;regions:CutRegion[];transform:OutfitTransform}{
 const v=value as {name?:unknown;regions?:unknown;transform?:unknown;sourceSize?:{width:number;height:number}};
 if(!v||typeof v!=='object'||typeof v.name!=='string'||v.name.length>80||!Array.isArray(v.regions)||v.regions.length>250||!v.sourceSize||v.sourceSize.width!==width||v.sourceSize.height!==height)throw Error('Load the matching source picture before its selection.');
 const regions=v.regions.map((item:unknown)=>{const r=item as CutRegion;if(!validCut(r,width,height))throw Error('Invalid clothing edit.');return {...r,points:r.points.map(p=>({x:p.x,y:p.y}))};});
 const t=v.transform as OutfitTransform;if(!t)throw Error('Outfit alignment is missing.');fitOutfit(width,height,843,1264,t);return {name:v.name,regions,transform:{x:t.x,y:t.y,scale:t.scale,frame:t.frame}};
}
export function dragOutfit(start:Point,delta:Point,display:{width:number;height:number},body:{width:number;height:number}){
 if(![start.x,start.y,delta.x,delta.y,display.width,display.height,body.width,body.height].every(Number.isFinite)||display.width<=0||display.height<=0||body.width<=0||body.height<=0)throw Error('Preview size is unavailable.');
 const clamp=(n:number)=>Math.max(-2048,Math.min(2048,n));return {x:clamp(Math.round(start.x+delta.x*body.width/display.width)),y:clamp(Math.round(start.y+delta.y*body.height/display.height))};
}
/** Uniform corner resize keeps the opposite corner anchored in body coordinates. */
export function resizeOutfit(start:OutfitTransform,box:Box,corner:number,pointer:Point,body:{width:number;height:number}):OutfitTransform{
 const corners=[{x:box.x,y:box.y},{x:box.x+box.width,y:box.y},{x:box.x+box.width,y:box.y+box.height},{x:box.x,y:box.y+box.height}],anchor=corners[(corner+2)%4],handle=corners[corner];if(!anchor||!handle)throw Error('Invalid resize handle.');
 const vx=handle.x-anchor.x,vy=handle.y-anchor.y,den=vx*vx+vy*vy;if(den===0)return start;const ratio=((pointer.x-anchor.x)*vx+(pointer.y-anchor.y)*vy)/den,scale=Math.max(MIN_OUTFIT_SCALE,Math.min(MAX_OUTFIT_SCALE,start.scale*ratio)),r=scale/start.scale;
 return {...start,scale,x:Math.max(-2048,Math.min(2048,anchor.x+(body.width/2+start.x-anchor.x)*r-body.width/2)),y:Math.max(-2048,Math.min(2048,anchor.y+(body.height/2+start.y-anchor.y)*r-body.height/2))};
}

export function undoOutfitEdit(regions:CutRegion[]){if(!regions.length||regions[regions.length-1].kind==='clip')return regions;const group=regions[regions.length-1].group;if(group===undefined)return regions.slice(0,-1);let end=regions.length-1;while(end>0&&regions[end-1].group===group)end--;return regions.slice(0,end);}
export interface OutfitPiece{id:string;name:string;regions:CutRegion[];transform:OutfitTransform;hidden?:boolean}
export function snapshotOutfitPieces(pieces:OutfitPiece[],activeId:string,regions:CutRegion[],transform:OutfitTransform){return pieces.map(p=>p.id===activeId?{...p,regions,transform:{...transform}}:p);}
export function readOutfitProject(value:unknown,width:number,height:number):{name:string;pieces:OutfitPiece[];activeId:string}{
 const v=value as {name?:unknown;parts?:unknown;activePartId?:unknown;sourceSize?:unknown};
 if(!v||typeof v!=='object')throw Error('Invalid outfit project.');
 if(v.parts===undefined){const old=readOutfitSelection(value,width,height);return {name:old.name,pieces:[{id:'piece-1',name:'Outfit',regions:old.regions,transform:old.transform}],activeId:'piece-1'};}
 if(typeof v.name!=='string'||v.name.length>80||!Array.isArray(v.parts)||v.parts.length<1||v.parts.length>12)throw Error('Outfit projects need 1–12 pieces.');
 const ids=new Set<string>();const pieces=v.parts.map((item:unknown)=>{const p=item as OutfitPiece;if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40)throw Error('Invalid or duplicate outfit piece.');ids.add(p.id);const checked=readOutfitSelection({name:p.name,regions:p.regions,transform:p.transform,sourceSize:v.sourceSize},width,height);if(p.hidden!==undefined&&typeof p.hidden!=='boolean')throw Error('Invalid layer visibility.');return {id:p.id,name:checked.name,regions:checked.regions,transform:checked.transform,...(p.hidden?{hidden:true}:{})};});
 return {name:v.name,pieces,activeId:typeof v.activePartId==='string'&&ids.has(v.activePartId)?v.activePartId:pieces[0].id};
}

/** Split existing cleaned pixels without reintroducing their removed background. */
export function splitOutfitPiece(pieces:OutfitPiece[],activeId:string,points:Point[],id:string,name:string,width:number,height:number){
 if(pieces.length>=12||pieces.some(p=>p.id===id)||!validRegion(points,width,height))throw Error('Choose an outline and leave room for another piece.');const selected=pieces.find(p=>p.id===activeId);if(!selected)throw Error('Select a piece first.');
 const cut=selected.regions.some(r=>!r.erase)?[...selected.regions,{kind:'clip' as const,points,erase:false}]:[{points,erase:false}];
 return [...pieces.map(p=>p.id===activeId?{...p,regions:[...p.regions,{points,erase:true}]}:p),{id,name,regions:cut,transform:{...selected.transform}}];
}

export const MAX_OUTFIT_PROJECT_BYTES=16_000_000;
/** Save final pixels even when the optional editable history exceeds its bounded file size. */
export function outfitSaveMetadata(name:string,width:number,height:number,parts:OutfitPiece[],activePartId:string,sourceSize:{width:number;height:number}){
 const full=JSON.stringify({name,width,height,parts,activePartId,prototype:true,sourceSize});
 if(new TextEncoder().encode(full).length<=MAX_OUTFIT_PROJECT_BYTES)return {metadata:full,flattened:false};
 const metadata=JSON.stringify({name,width,height,prototype:true,flattened:true,sourceSize:{width,height},regions:[{points:[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}],erase:false}],transform:{x:0,y:0,scale:1,frame:1}});
 return {metadata,flattened:true};
}
