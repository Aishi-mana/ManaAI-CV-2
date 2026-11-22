export const TOWN_DECORATIONS=[{id:'garlands',label:'Garlands'},{id:'lights',label:'Warm lights'},
 {id:'christmas-tree',label:'Christmas tree'},{id:'golden-display',label:'Golden ornaments'},{id:'fireworks',label:'Fireworks'}] as const;
export type TownDecoration=typeof TOWN_DECORATIONS[number]['id'];
export type DecorationObject={id:string;kind:TownDecoration;x:number;y:number;width:number;height:number;
 rotation:number;opacity:number;layer:number;flipped:boolean;locked:boolean;hidden:boolean};
export const TOWN_TREE_POINT={x:32,y:37};
export const MAX_DECORATION_OBJECTS=100;
const bounded=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function decorationObject(kind:TownDecoration,id:string,x=50,y=50):DecorationObject{
 const dimensions={garlands:[22,5],lights:[28,20],'christmas-tree':[11.5,21.35],'golden-display':[4,13],fireworks:[50,35]}[kind];
 return {id,kind,x,y,width:dimensions[0],height:dimensions[1],rotation:0,opacity:1,layer:2,flipped:false,locked:false,hidden:false};
}
export function defaultDecorationLayout(kinds:readonly TownDecoration[]):DecorationObject[]{
 return kinds.flatMap(kind=>{
  if(kind==='garlands')return [[12,20,22],[73,13,22],[91.5,23,15]].map(([x,y,width],index)=>({...decorationObject(kind,`${kind}-${index}`,x,y),width}));
  if(kind==='lights')return [[12,45,18,22],[74,27,26,16],[95,41,16,24]].map(([x,y,width,height],index)=>({...decorationObject(kind,`${kind}-${index}`,x,y),width,height}));
  if(kind==='christmas-tree')return [decorationObject(kind,kind,TOWN_TREE_POINT.x,TOWN_TREE_POINT.y)];
  if(kind==='golden-display')return [decorationObject(kind,kind,93,36)];
  return [{...decorationObject(kind,kind,50,48),width:100,height:48}];
 });
}
export function validateDecorationLayout(value:unknown):DecorationObject[]{
 if(!Array.isArray(value))return [];
 const ids=new Set<string>();
 return value.slice(0,MAX_DECORATION_OBJECTS).flatMap(entry=>{
  if(!entry||typeof entry!=='object'||typeof entry.id!=='string'||!entry.id||entry.id.length>120||ids.has(entry.id)||!TOWN_DECORATIONS.some(option=>option.id===entry.kind))return [];
  ids.add(entry.id);
  const defaults=decorationObject(entry.kind,entry.id);
  return [{...defaults,x:bounded(entry.x,50,0,100),y:bounded(entry.y,50,0,100),width:bounded(entry.width,defaults.width,1,100),
   height:bounded(entry.height,defaults.height,1,100),rotation:bounded(entry.rotation,0,-180,180),opacity:bounded(entry.opacity,1,0,1),
   layer:Math.round(bounded(entry.layer,2,1,100)),flipped:entry.flipped===true,locked:entry.locked===true,hidden:entry.hidden===true}];
 });
}
export function transformDecoration(object:DecorationObject,patch:Partial<DecorationObject>){
 return validateDecorationLayout([{...object,...patch,id:object.id,kind:object.kind}])[0];
}
export function decorationKinds(objects:readonly DecorationObject[]){
 return TOWN_DECORATIONS.filter(option=>objects.some(object=>!object.hidden&&object.opacity>0&&object.kind===option.id)).map(option=>option.id);
}
export function scheduleDecorationObjects(schedule:{decorations:readonly TownDecoration[];objects?:DecorationObject[]}){
 return schedule.objects===undefined?defaultDecorationLayout(schedule.decorations):validateDecorationLayout(schedule.objects);
}

export type DecorationHistory={past:DecorationObject[][];present:DecorationObject[];future:DecorationObject[][]};
export function recordDecorationEdit(history:DecorationHistory,next:readonly DecorationObject[]):DecorationHistory{
 const present=validateDecorationLayout(next);
 if(JSON.stringify(present)===JSON.stringify(history.present))return history;
 return {past:[...history.past,history.present].slice(-50),present,future:[]};
}
export function undoDecorationEdit(history:DecorationHistory):DecorationHistory{
 if(!history.past.length)return history;
 return {past:history.past.slice(0,-1),present:history.past[history.past.length-1],future:[history.present,...history.future]};
}
export function redoDecorationEdit(history:DecorationHistory):DecorationHistory{
 if(!history.future.length)return history;
 return {past:[...history.past,history.present],present:history.future[0],future:history.future.slice(1)};
}

export function pointerDecorationRotation(original:number,start:{x:number;y:number},current:{x:number;y:number},pivot:{x:number;y:number},snap=false){
 const angle=(point:{x:number;y:number})=>Math.atan2(point.y-pivot.y,point.x-pivot.x)*180/Math.PI;
 const rotation=original+angle(current)-angle(start);
 const rounded=snap?Math.round(rotation/15)*15:Math.round(rotation*10)/10;
 return ((rounded+180)%360+360)%360-180;
}
