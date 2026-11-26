import {validateTownWeather,type TownWeatherSettings} from './townWeather';
import {validateActivityPreferences,activityPreferenceWeight,type ActivityPreferences} from './activityPreferences';
import {validateEveningWindDown,type EveningWindDownDates} from './eveningWindDown';
import {validatePhoneReadState,type PhoneReadState} from './phoneReadState';
import {validateTownDecorations,type TownDecorationSettings} from './townFestivities';
import {validateTownPersonalGoals,type TownPersonalGoal} from './townPersonalGoals';
import {validatePetBotFriends,type PetBotFriends} from './petBot';
import {validateActivityKeepsakes,type ActivityKeepsake} from './activityKeepsakes';
import {validateSharedMemories,type SharedMemory} from './residentRelationships';
import {residentIds,residentProfiles,type ResidentId} from './residentProfiles';
import {validateTownGuestbook,type TownGuestbookVisit} from './townGuestbook';
import {validateTownEvents,type CustomTownEvent} from './townEvents';
import {validateOfficeLayout,type OfficeLayout} from './manaverseStreet';
import {validateManaKeepsake,type ManaKeepsake} from './manaKeepsake';
import {validateLibraryStory,type LibraryStory} from './libraryStory';
import {validatePondSketch,type PondSketchGoal} from './pondSketch';
import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';
import {journalClock} from './clock';
import {validatePhone,type PhoneMessage} from './roomPhone';
import {ROOM_BACKGROUND_LIMIT,shopPieceActivity,validRoomBackground,validateRoomShop,type RoomShop} from './roomShop';
import {validateCoreMemories} from './sceneMemory';

export const ROOM_KEY='mana.companion_room.v1';
export const ROOM_ART='./companion-room/cartoon/';
export interface RoomPosition {u:number;v:number}
export type LunaVisitMemory='beanbag-chat'|'while-mana-slept'|'quiet-company';
export const LUNA_VISIT_MEMORY_LIMIT=8;
const ROOM_ACTIVITIES=['water','read','play','sleep','bed','think','window','remember'] as const;
export type RoomActivity=typeof ROOM_ACTIVITIES[number];
export type RoomPlacements=Record<string,{dx:number;dy:number;mirrored?:true}>;
export const ROOM_WALL_FINISHES=['Original','Warm cream','Cool blue','Lavender'] as const;
export const ROOM_FLOOR_FINISHES=['Original','Honey oak','Dark walnut','Ash gray'] as const;
export interface RoomFinishes {wall:typeof ROOM_WALL_FINISHES[number];floor:typeof ROOM_FLOOR_FINISHES[number]}
export const DEFAULT_ROOM_FINISHES:RoomFinishes={wall:'Original',floor:'Original'};
export const ROOM_PIECE_COLORS=['Original','Rose','Lavender','Sky blue','Sage','Warm cream','Slate'] as const;
export type RoomPieceColors=Partial<Record<string,Exclude<typeof ROOM_PIECE_COLORS[number],'Original'>>>;
type ResidentMemoryProfile=(typeof residentProfiles)[ResidentId]['memory'];
type ResidentMemoryFields=Partial<Record<ResidentMemoryProfile['coreKey'],string[]>>
 & Partial<Record<ResidentMemoryProfile['visitKey'],LunaVisitMemory[]>>;
export interface RoomState extends ResidentMemoryFields {layout:2;eveningWindDownDates?:EveningWindDownDates;activityPreferences?:ActivityPreferences;weather?:TownWeatherSettings;phoneReadMessages?:PhoneReadState;townDecorations?:TownDecorationSettings;personalGoals?:TownPersonalGoal[];petBotFriends?:PetBotFriends;activityKeepsakes?:ActivityKeepsake[];sharedMemories?:SharedMemory[];petBotMemory?:string[];officeLayout?:OfficeLayout;townEvents?:CustomTownEvent[];townGuestbook?:TownGuestbookVisit[];position:RoomPosition;wateredAt?:string;lastActivity?:RoomActivity;idleActivities?:boolean;activityCooldownUntil?:string;placements?:RoomPlacements;finishes?:RoomFinishes;pieceColors?:RoomPieceColors;energy?:number;sleep?:{night:string;startedAt:string};skipSleepNight?:string;furnitureUses?:Partial<Record<RoomActivity,number>>;shop?:RoomShop;background?:string;backgrounds?:string[];effectStats?:RoomEffectStats;livingPosition?:RoomPosition;phoneMessages?:PhoneMessage[];aiPhone?:true;pondSketch?:PondSketchGoal;libraryStory?:LibraryStory;manaKeepsake?:ManaKeepsake;sharedKeepsake?:ManaKeepsake}
export const ROOM_TIMING={walk:20_000,idle:15_000,activity:120_000,cooldown:300_000,homePause:30_000,activityChance:.25} as const;
export const ROOM_ACTIVITY_FURNITURE:Record<RoomActivity,string>={
 water:'Plant',read:'Bookshelf',play:'Game table',sleep:'Beanbag',bed:'Bed',think:'Desk',window:'Window',remember:'Photo board',
};
const ROOM_EFFECT_DEFAULTS={focus:50,happiness:60,knowledge:0,gaming:0};
export type RoomEffectStats=typeof ROOM_EFFECT_DEFAULTS;
const roomEffects:Record<RoomActivity,Partial<RoomEffectStats>>={
 water:{happiness:10,focus:-4},read:{focus:12,knowledge:1},play:{happiness:10,focus:-4,gaming:1},
 sleep:{focus:5},bed:{focus:8},think:{focus:12,knowledge:1},
 window:{happiness:8,focus:-4},remember:{happiness:8},
};
export function roomEffectStats(state:RoomState):RoomEffectStats{
 return state.effectStats??ROOM_EFFECT_DEFAULTS;
}
export function roomMood(energy:number,{focus,happiness}:RoomEffectStats){
 if(energy<20)return {label:'Tired',face:'😔'};
 if(focus<20)return {label:'Unfocused',face:'😑'};
 if(happiness<20)return {label:'Sad',face:'😟'};
 if(energy>80)return {label:'Excited',face:'🤩'};
 if(happiness>80)return {label:'Happy',face:'😆'};
 if(focus>80)return {label:'Motivated',face:'😎'};
 return {label:'Neutral',face:'😐'};
}
export function completeRoomActivity(state:RoomState,activity:RoomActivity){
 const previous=roomEffectStats(state);
 const effect=roomEffects[activity];
 const stats={...previous};
 const energy=roomEnergyAfterActivity(state.energy??100,activity);
 const changes:string[]=[];
 const describe=(name:string,delta:number)=>{if(delta)changes.push(`${name} ${delta>0?'+':''}${delta}`);};
 describe('Energy',energy-(state.energy??100));
 for(const key of Object.keys(previous) as (keyof RoomEffectStats)[]){
  const max=key==='focus'||key==='happiness'?100:9999;
  stats[key]=Math.min(max,Math.max(0,previous[key]+(effect[key]??0)));
  describe(key[0].toUpperCase()+key.slice(1),stats[key]-previous[key]);
 }
 return {energy,stats,changes};
}
export function favoriteRoomActivity(state:RoomState){
 const ranked=ROOM_ACTIVITIES.map(id=>({id,count:state.furnitureUses?.[id]??0})).sort((a,b)=>b.count-a.count);
 return ranked[0].count>=2&&ranked[0].count>ranked[1].count?ranked[0].id:undefined;
}
export function roomEnergyState(energy:number,recovering=false){
 if(recovering)return 'Recovering';
 if(energy>=70)return 'Rested';
 if(energy<=35)return 'Low energy';
 return 'Getting tired';
}
export function chooseRoomActivity(state:RoomState,now:Date,timeZone:string,roll=Math.random(),memories:readonly string[]=[],available:readonly RoomActivity[]=ROOM_ACTIVITIES):RoomActivity{
 const {time}=journalClock(now,timeZone);
 const morning=time>='06:00'&&time<'12:00';
 const afternoon=time>='12:00'&&time<'18:00';
 const energyState=roomEnergyState(state.energy??100);
 const tired=energyState==='Low energy';
 const rested=energyState==='Rested';
 const favorite=favoriteRoomActivity(state);
 const weights:Record<RoomActivity,number>={
  water:morning?4:2,
  read:tired||(!morning&&!afternoon)?5:2,
  play:tired?1:afternoon&&rested?6:2,
  sleep:tired?8:rested?1:3,
  bed:tired?5:1,
  think:tired?1:(morning||afternoon)&&rested?6:2,
  window:morning?4:2,
  remember:morning||afternoon?2:4,
 };
 if(favorite)weights[favorite]+=1;
 const stats=roomEffectStats(state);
 if(stats.focus<=30){weights.read++;weights.think++;}
 if(stats.happiness<=35){weights.window++;weights.play++;}
 for(const activity of ROOM_ACTIVITIES)weights[activity]*=activityPreferenceWeight('mana',activity,state.activityPreferences??{},memories)*(state.lastActivity===activity? .6:1);
 const choices=ROOM_ACTIVITIES.filter(activity=>available.includes(activity));
 let remaining=roll*choices.reduce((total,activity)=>total+weights[activity],0);
 for(const activity of choices){
  remaining-=weights[activity];
  if(remaining<0)return activity;
 }
 return choices[choices.length-1]??'remember';
}
export function recordFurnitureUse(state:RoomState,activity:RoomActivity):RoomState{
 const count=state.furnitureUses?.[activity]??0;
 return {...state,furnitureUses:{...state.furnitureUses,[activity]:Math.min(10_000,count+1)}};
}
export function roomLighting(now:Date,timeZone:string):'daylight'|'sunset'|'night' {
 const {time}=journalClock(now,timeZone);
 if(time>='06:00'&&time<'18:00')return 'daylight';
 if(time>='18:00'&&time<'19:30')return 'sunset';
 return 'night';
}
const roomThoughts:Partial<Record<RoomActivity,readonly [string,string]>>={
 water:['A little water for you.','I like having something green in here.'],
 read:['Time to get lost in a book.','I think I’ll stay with this page a little longer.'],
 play:['A little playtime sounds good.','I wonder what I should play next.'],
 sleep:['A little nap sounds just right.','I’ll close my eyes for a bit.'],
 think:['Let me give that idea a little more thought.','A quiet moment at my desk might help.'],
 remember:['I feel like looking back for a moment.','I’m glad I can come back to these memories.'],
};
export function roomActivityThought(activity:RoomActivity,now:Date,timeZone:string,hasMemories:boolean,previous?:string){
 if(activity==='window'){
  const lighting=roomLighting(now,timeZone);
  return {daylight:'It’s nice to watch the daylight for a while.',sunset:'I like how the light changes at sunset.',night:'The window feels so quiet at night.'}[lighting];
 }
 if(activity==='remember'&&!hasMemories)return 'Maybe I’ll have something to put here someday.';
 const lines=roomThoughts[activity];
 return lines?.[lines[0]===previous?1:0];
}
export function roomSleepNight(now:Date,timeZone:string){
 const {date,time}=journalClock(now,timeZone);
 if(time>='22:00')return date;
 if(time>='06:00')return undefined;
 const previous=new Date(date+'T12:00:00Z');
 previous.setUTCDate(previous.getUTCDate()-1);
 return previous.toISOString().slice(0,10);
}
const roomEnergyChange:Record<RoomActivity,number>={
 water:-10,read:-5,play:-15,sleep:15,bed:35,think:-15,window:-5,remember:-5,
};
export function roomEnergyAfterActivity(energy:number,activity:RoomActivity){
 return Math.max(0,Math.min(100,energy+roomEnergyChange[activity]));
}
const clamp=(value:number)=>Math.min(1,Math.max(0,value));

interface Footprint {left:number;right:number;top:number;bottom:number}
export interface RoomObject {id:string;image:string;x:number;y:number;width:number;footprint?:Footprint;mirrored?:true;activity?:'water'|'read'|'sleep'}
export type RoomCatalogPiece=RoomObject&{name:string;footprint:Footprint};
// The artwork is laid out in the same 799 × 698 coordinates as walking.
export const ROOM_OBJECTS:readonly RoomObject[]=[
 {id:'rug',image:'rug.png',x:307,y:384,width:307},
 {id:'window',image:'window.png',x:159,y:75,width:153},
 {id:'sign',image:'mana_sign.png',x:326,y:54,width:68},
 {id:'top-shelf',image:'top_shelf.png',x:406,y:55,width:113},
 {id:'photo-board',image:'photo_frame.png',x:539,y:137,width:63},
 {id:'desk',image:'desk.png',x:334,y:151,width:189,footprint:{left:347,right:523,top:270,bottom:319}},
 {id:'table',image:'coffee_table.png',x:403,y:415,width:124,footprint:{left:391,right:533,top:439,bottom:525}},
 {id:'chair',image:'beanie_bag.png',x:576,y:295,width:113,footprint:{left:568,right:695,top:356,bottom:412}},
 {id:'plant',image:'plant.png',x:428,y:565,width:65,footprint:{left:438,right:481,top:607,bottom:637}},
 {id:'bed',image:'bed.png',x:18,y:310,width:244,footprint:{left:22,right:257,top:394,bottom:502}},
 {id:'bookshelf',image:'bookshelf.png',x:690,y:207,width:100,footprint:{left:695,right:783,top:416,bottom:448}},
];
export const ROOM_CATALOG=[
 {id:'reading-seat',name:'Rose beanbag',image:'beanie_bag.png',x:590,y:365,width:113,footprint:{left:582,right:709,top:426,bottom:482}},
 {id:'side-table',name:'Side table',image:'coffee_table.png',x:259,y:375,width:124,footprint:{left:247,right:389,top:399,bottom:485}},
 {id:'small-plant',name:'Small potted plant',image:'plant.png',x:171,y:414,width:42,footprint:{left:175,right:210,top:440,bottom:462}},
] as const satisfies readonly RoomCatalogPiece[];
export function roomCatalog(shop?:RoomShop):RoomCatalogPiece[]{
 const generated=(shop?.pieces??[]).filter(piece=>piece.owned).map(piece=>{
  const plant=/\b(planter|fern|plant)\b/i.test(piece.name);
  const width=Math.min(plant?65:102,(plant?71:130)/piece.aspect),height=width*piece.aspect;
  const x=321-width/2,y=465-height;
  const footprintWidth=plant?width*.66:width+4;
  return {id:piece.id,name:piece.name,image:piece.image,x,y,width,activity:shopPieceActivity(piece.name),
   footprint:{left:321-footprintWidth/2,right:321+footprintWidth/2,top:465-Math.min(40,height*.4),bottom:468}};
 });
 return [...ROOM_CATALOG,...generated];
}
// Bounds of the visible artwork in wall coordinates. Removing the wall's
// slope lets us check the artwork against the edges and nearby decorations.
const wallMounts:Record<string,{side:'left'|'right';left:number;right:number;top:number;bottom:number}>={
 window:{side:'left',left:159,right:312,top:23,bottom:190},
 sign:{side:'left',left:329,right:391,top:30,bottom:144},
 'top-shelf':{side:'right',left:406,right:518,top:24,bottom:132},
 'photo-board':{side:'right',left:539,right:600,top:59,bottom:169},
};
export const movableRoomObject=(object:RoomObject)=>!!object.footprint||object.id==='rug'||(object.id!=='window'&&!!wallMounts[object.id]);
function wallBounds(object:RoomObject,mount:typeof wallMounts[string]){
 const original=ROOM_OBJECTS.find(item=>item.id===object.id)!;
 const dx=object.x-original.x;
 const heightOffset=object.y-original.y-(mount.side==='left'?-.5:.5)*dx;
 return {left:mount.left+dx,right:mount.right+dx,top:mount.top+heightOffset,bottom:mount.bottom+heightOffset};
}
const footprints=(objects:readonly RoomObject[])=>objects.flatMap(object=>object.footprint?[object.footprint]:[]);
export function arrangedRoom(placements:RoomPlacements={},shop?:RoomShop):RoomObject[]{
 const objects=[...ROOM_OBJECTS,...roomCatalog(shop).filter(piece=>placements[piece.id])];
 return objects.map(object=>{
  const offset=placements[object.id];
  if(!offset)return object;
  const {dx,dy,mirrored}=offset,box=object.footprint;
  const axis=2*object.x+object.width;
  return {...object,x:object.x+dx,y:object.y+dy,mirrored,footprint:box&&{
   left:(mirrored?axis-box.right:box.left)+dx,right:(mirrored?axis-box.left:box.right)+dx,
   top:box.top+dy,bottom:box.bottom+dy,
  }};
 });
}
export const livingFurnishings=arrangedRoom({
 chair:{dx:-95,dy:-12},table:{dx:8,dy:-15},rug:{dx:8,dy:-15},
 bookshelf:{dx:-28,dy:-25},plant:{dx:-215,dy:-135},
}).filter(piece=>['sign','top-shelf','photo-board','chair','table','rug','bookshelf','plant'].includes(piece.id));
interface Point {x:number;y:number}
export function sharedRoomFurnitureDepth(object:RoomObject){
 const footprint=object.footprint;
 return footprint?Math.round((footprint.top+footprint.bottom)/2)*2+1:1;
}
export function sharedRoomActorDepth(feet:Point){
 return Math.round(feet.y)*2;
}
export function roomPoint({u,v}:RoomPosition){
 return {x:400+360*(u-v),y:239+207*(u+v)};
}
export function roomCatalogOffsets(piece:RoomCatalogPiece,near={dx:0,dy:0}){
 const x=(piece.footprint.left+piece.footprint.right)/2;
 const y=(piece.footprint.top+piece.footprint.bottom)/2;
 const grid=[.12,.27,.42,.57,.72,.87];
 return grid.flatMap(u=>grid.map(v=>roomPoint({u,v})))
  .map(point=>({dx:Math.round(point.x-x),dy:Math.round(point.y-y)}))
  .sort((a,b)=>Math.hypot(a.dx-near.dx,a.dy-near.dy)-Math.hypot(b.dx-near.dx,b.dy-near.dy));
}
function floorPosition(x:number,y:number):RoomPosition {
 const dx=(x-400)/360,dy=(y-239)/207;
 return {u:clamp((dy+dx)/2),v:clamp((dy-dx)/2)};
}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const contains=(box:Footprint,p:Point)=>p.x>box.left&&p.x<box.right&&p.y>box.top&&p.y<box.bottom;
export function roomDropPosition(point:{x:number;y:number},objects:readonly RoomObject[]){
 const x=point.x*799/100,y=point.y*698/100;
 const position=roomPosition(x,y,objects);
 return distance({x,y},roomPoint(position))<=2?position:undefined;
}

export function roomPosition(x:number,y:number,objects:readonly RoomObject[]=ROOM_OBJECTS):RoomPosition {
 const furniture=footprints(objects);
 const position=floorPosition(x,y),point=roomPoint(position);
 const box=furniture.find(item=>contains(item,point));
 if(!box)return position;
 const options=[{x:box.left-1,y:point.y},{x:box.right+1,y:point.y},{x:point.x,y:box.top-1},{x:point.x,y:box.bottom+1}]
  .map(option=>floorPosition(option.x,option.y)).filter(option=>!furniture.some(item=>contains(item,roomPoint(option))));
 if(!options.length){
  for(const u of [.15,.4,.65,.9]){
   for(const v of [.15,.4,.65,.9]){
    if(!furniture.some(item=>contains(item,roomPoint({u,v}))))options.push({u,v});
   }
  }
 }
 return options.sort((a,b)=>distance(point,roomPoint(a))-distance(point,roomPoint(b)))[0]??PLANT_POSITION;
}
export const PLANT_POSITION=floorPosition(410,605);

function clearSegment(a:Point,b:Point,furniture:Footprint[]){
 return furniture.every(box=>{
  let start=0,end=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,box.left,box.right],[a.y,b.y-a.y,box.top,box.bottom]]){
   if(delta===0){if(origin<=min||origin>=max)return true;continue;}
   const first=(min-origin)/delta,second=(max-origin)/delta;
   start=Math.max(start,Math.min(first,second));
   end=Math.min(end,Math.max(first,second));
  }
  return start>=end;
 });
}

export function roomRoute(origin:RoomPosition,target:RoomPosition,objects:readonly RoomObject[]=ROOM_OBJECTS):RoomPosition[]{
 const furniture=footprints(objects);
 const nodes=[roomPoint(origin),roomPoint(target)];
 for(const box of furniture){
  for(const x of [box.left-1,box.right+1]){
   for(const y of [box.top-1,box.bottom+1]){
    if(distance({x,y},roomPoint(floorPosition(x,y)))<.01)nodes.push({x,y});
   }
  }
 }
 const costs=nodes.map((_,i)=>i===0?0:Infinity),previous=nodes.map(()=>-1);
 const pending=new Set(nodes.map((_,i)=>i));
 while(pending.size){
  const next=[...pending].reduce((a,b)=>costs[a]<=costs[b]?a:b);
  if(!Number.isFinite(costs[next])||next===1)break;
  pending.delete(next);
  for(const candidate of pending){
   const cost=costs[next]+distance(nodes[next],nodes[candidate]);
   if(cost<costs[candidate]&&clearSegment(nodes[next],nodes[candidate],furniture)){
    costs[candidate]=cost;
    previous[candidate]=next;
   }
  }
 }
 if(previous[1]<0)return [];
 const route=[target];
 for(let index=previous[1];index>0;index=previous[index]){
  const {x,y}=nodes[index];
  route.unshift(floorPosition(x,y));
 }
 return route;
}

export function roomPlacementProblem(id:string,objects:readonly RoomObject[]){
 const object=objects.find(item=>item.id===id);
 if(!object||!movableRoomObject(object))return 'This piece is fixed to the room.';
 const mount=wallMounts[id];
 if(mount){
  const bounds=wallBounds(object,mount);
  const [left,right]=mount.side==='left'?[18,398]:[402,782];
  if(bounds.left<left||bounds.right>right||bounds.top<22||bounds.bottom>205)return 'Keep the decoration on its wall.';
  if(objects.some(other=>{
   const otherMount=wallMounts[other.id];
   if(other.id===id||otherMount?.side!==mount.side)return false;
   const nearby=wallBounds(other,otherMount);
   return bounds.left<nearby.right&&bounds.right>nearby.left&&bounds.top<nearby.bottom&&bounds.bottom>nearby.top;
  }))return 'Leave space between wall decorations.';
  return;
 }
 // Ground-contact points follow the isometric artwork. The padded walking
 // footprint can extend past these points, especially beside the walls.
 const box=object.footprint;
 const ground=box?[{x:(box.left+box.right)/2,y:box.bottom-6},
  {x:box.left+12,y:(box.top+box.bottom)/2},{x:box.right-12,y:(box.top+box.bottom)/2}]
  :[{x:object.x+12,y:object.y+105},{x:object.x+object.width-12,y:object.y+85},
    {x:object.x+object.width/2,y:object.y+176},{x:object.x+object.width/2,y:object.y+15}];
 const original=ROOM_OBJECTS.find(item=>item.id===id);
 if((!original||object.x!==original.x||object.y!==original.y||object.mirrored)&&
   ground.some(point=>distance(point,roomPoint(floorPosition(point.x,point.y)))>2))return 'Keep the piece on the floor.';
 if(box&&objects.some(other=>other.id!==id&&other.footprint&&
   box.left<other.footprint.right+4&&box.right>other.footprint.left-4&&
   box.top<other.footprint.bottom+4&&box.bottom>other.footprint.top-4))return 'Leave space between furniture.';
 const center=roomPosition(400,445,objects);
 const waypoints=[roomPoint({u:.3,v:.3}),roomPoint({u:.3,v:.8}),roomPoint({u:.8,v:.3}),roomPoint({u:.8,v:.8})];
 if(waypoints.some(point=>!roomRoute(center,roomPosition(point.x,point.y,objects),objects).length))return 'Leave Mana a route around the room.';
}

export function validateRoom(value:unknown):RoomState {
 const point=isRecord(value)&&isRecord(value.position)?value.position:{};
 const coordinate=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?clamp(value):fallback;
 const u=coordinate(point.u,.42),v=coordinate(point.v,.65);
 const position=isRecord(value)&&value.layout===2?{u,v}:roomPosition(80+318*u+95*v,426-174*u+62*v);
 const wateredAt=isRecord(value)&&typeof value.wateredAt==='string'&&Number.isFinite(Date.parse(value.wateredAt))?value.wateredAt:undefined;
 const activity=isRecord(value)?value.lastActivity:undefined;
 const lastActivity=ROOM_ACTIVITIES.find(id=>id===activity);
 const idleActivities=isRecord(value)?value.idleActivities:undefined;
 const cooldown=isRecord(value)?value.activityCooldownUntil:undefined;
 const activityCooldownUntil=typeof cooldown==='string'&&Number.isFinite(Date.parse(cooldown))?cooldown:undefined;
 const day=(day:unknown):day is string=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day));
 const energy=isRecord(value)?value.energy:undefined;
 const rawSleep=isRecord(value)?value.sleep:undefined;
 const sleep=isRecord(rawSleep)&&day(rawSleep.night)&&typeof rawSleep.startedAt==='string'&&Number.isFinite(Date.parse(rawSleep.startedAt))
  ?{night:rawSleep.night,startedAt:rawSleep.startedAt}:undefined;
 const skipSleepNight=isRecord(value)&&day(value.skipSleepNight)?value.skipSleepNight:undefined;
 const rawPlacements=isRecord(value)&&isRecord(value.placements)?value.placements:{};
 const shop=validateRoomShop(isRecord(value)?value.shop:undefined);
 const catalog=roomCatalog(shop);
 const catalogIds=new Set(catalog.map(piece=>piece.id));
 const rawFinishes=isRecord(value)&&isRecord(value.finishes)?value.finishes:{};
 const rawColors=isRecord(value)&&isRecord(value.pieceColors)?value.pieceColors:{};
 const pieceColors:RoomPieceColors={};
 const wall=ROOM_WALL_FINISHES.find(finish=>finish===rawFinishes.wall)??DEFAULT_ROOM_FINISHES.wall;
 const floor=ROOM_FLOOR_FINISHES.find(finish=>finish===rawFinishes.floor)??DEFAULT_ROOM_FINISHES.floor;
 const placements:RoomPlacements={};
 const rawUses=isRecord(value)&&isRecord(value.furnitureUses)?value.furnitureUses:{};
 const furnitureUses:NonNullable<RoomState['furnitureUses']>={};
 for(const id of ROOM_ACTIVITIES){
  const count=rawUses[id];
  if(typeof count==='number'&&Number.isInteger(count)&&count>0&&count<=10_000)furnitureUses[id]=count;
 }
 for(const object of [...ROOM_OBJECTS.filter(movableRoomObject),...catalog]){
  const color=ROOM_PIECE_COLORS.find(color=>color===rawColors[object.id]);
  if(color&&color!=='Original')pieceColors[object.id]=color;
  const offset=rawPlacements[object.id];
  if(isRecord(offset)&&typeof offset.dx==='number'&&typeof offset.dy==='number'&&
    Number.isInteger(offset.dx)&&Number.isInteger(offset.dy)&&Math.abs(offset.dx)<=799&&Math.abs(offset.dy)<=698&&
    (offset.dx||offset.dy||catalogIds.has(object.id)||(offset.mirrored===true&&object.footprint))){
   placements[object.id]={dx:offset.dx,dy:offset.dy,...(offset.mirrored===true&&object.footprint?{mirrored:true as const}:{})};
  }
 }
 const backgrounds=isRecord(value)&&Array.isArray(value.backgrounds)
  ?[...new Set(value.backgrounds.slice(0,ROOM_BACKGROUND_LIMIT).filter(validRoomBackground))]:[];
 const residentMemories:ResidentMemoryFields={};
 const rawRoom=isRecord(value)?value:{};
 for(const resident of residentIds){
  const {coreKey,visitKey,limit}=residentProfiles[resident].memory;
  const core=validateCoreMemories(rawRoom[coreKey],limit);
  if(core.length)residentMemories[coreKey]=core;
  const storedVisits=rawRoom[visitKey];
  const visits=Array.isArray(storedVisits)
   ?storedVisits.slice(0,LUNA_VISIT_MEMORY_LIMIT).filter((memory):memory is LunaVisitMemory=>memory==='beanbag-chat'||memory==='while-mana-slept'||memory==='quiet-company')
   :[];
  if(visits.length)residentMemories[visitKey]=visits;
 }
 const manaKeepsake=validateManaKeepsake(isRecord(value)?value.manaKeepsake:undefined);
 const sharedKeepsake=validateManaKeepsake(isRecord(value)?value.sharedKeepsake:undefined);
 const libraryStory=validateLibraryStory(isRecord(value)?value.libraryStory:undefined);
 const pondSketch=validatePondSketch(isRecord(value)?value.pondSketch:undefined);
 const phoneMessages=validatePhone(isRecord(value)?value.phoneMessages:undefined);
 const living=isRecord(value)&&isRecord(value.livingPosition)?value.livingPosition:undefined;
 const livingPosition=living?{u:coordinate(living.u,.75),v:coordinate(living.v,.75)}:undefined;
 const rawEffects=isRecord(value)&&isRecord(value.effectStats)?value.effectStats:undefined;
 const effectStats={...ROOM_EFFECT_DEFAULTS};
 if(rawEffects){
  for(const key of Object.keys(effectStats) as (keyof RoomEffectStats)[]){
   const number=rawEffects[key];
   const max=key==='focus'||key==='happiness'?100:9999;
   if(typeof number==='number'&&Number.isInteger(number)&&number>=0&&number<=max)effectStats[key]=number;
  }
 }
 const weather=isRecord(value)&&value.weather!==undefined?validateTownWeather(value.weather):undefined;
 const phoneReadMessages=validatePhoneReadState(isRecord(value)?value.phoneReadMessages:undefined);
 const townGuestbook=validateTownGuestbook(isRecord(value)?value.townGuestbook:undefined);
 const townDecorations=isRecord(value)&&value.townDecorations!==undefined?validateTownDecorations(value.townDecorations):undefined;
 const townEvents=validateTownEvents(isRecord(value)?value.townEvents:undefined);
 const officeLayout=validateOfficeLayout(isRecord(value)?value.officeLayout:undefined);
 const personalGoals=validateTownPersonalGoals(isRecord(value)?value.personalGoals:undefined);
 const activityPreferences=validateActivityPreferences(isRecord(value)?value.activityPreferences:undefined);
 const eveningWindDownDates=validateEveningWindDown(isRecord(value)?value.eveningWindDownDates:undefined);
 const petBotFriends=validatePetBotFriends(isRecord(value)?value.petBotFriends:undefined);
 const activityKeepsakes=validateActivityKeepsakes(isRecord(value)?value.activityKeepsakes:undefined);
 const sharedMemories=validateSharedMemories(isRecord(value)?value.sharedMemories:undefined);
 const petBotMemory=validateCoreMemories(isRecord(value)?value.petBotMemory:undefined);
 return {layout:2,position,...(Object.keys(eveningWindDownDates).length?{eveningWindDownDates}:{}),...(Object.keys(activityPreferences).length?{activityPreferences}:{}),...(weather?{weather}:{}),...(Object.keys(phoneReadMessages).length?{phoneReadMessages}:{}),...(townDecorations?{townDecorations}:{}),...(personalGoals.length?{personalGoals}:{}),...(Object.keys(petBotFriends).length?{petBotFriends}:{}),...(activityKeepsakes.length?{activityKeepsakes}:{}),...(sharedMemories.length?{sharedMemories}:{}),...(townGuestbook.length?{townGuestbook}:{}),...(townEvents.length?{townEvents}:{}),...(officeLayout?{officeLayout}:{}),...(wateredAt?{wateredAt}:{}),...(lastActivity?{lastActivity}:{}),
  ...(typeof idleActivities==='boolean'?{idleActivities}:{}),...(activityCooldownUntil?{activityCooldownUntil}:{}),
  ...(Object.keys(placements).length?{placements}:{}),
  ...(wall!=='Original'||floor!=='Original'?{finishes:{wall,floor}}:{}),
  ...(Object.keys(pieceColors).length?{pieceColors}:{}),
  ...(shop?{shop}:{}),
  ...(isRecord(value)&&validRoomBackground(value.background)?{background:value.background}:{}),
  ...(backgrounds.length?{backgrounds}:{}),
  ...(livingPosition?{livingPosition}:{}),
  ...residentMemories,
  ...(manaKeepsake?{manaKeepsake}:{}),
  ...(sharedKeepsake?.shared?{sharedKeepsake}:{}),
  ...(libraryStory?{libraryStory}:{}),
  ...(pondSketch?{pondSketch}:{}),
  ...(phoneMessages.length?{phoneMessages}:{}),
  ...(isRecord(value)&&value.aiPhone===true?{aiPhone:true as const}:{}),
  ...(petBotMemory.length?{petBotMemory}:{}),
  ...(rawEffects?{effectStats}:{}),
  ...(typeof energy==='number'&&Number.isInteger(energy)&&energy>=0&&energy<=100?{energy}:{}),
  ...(sleep?{sleep}:{}),...(skipSleepNight?{skipSleepNight}:{}),
  ...(Object.keys(furnitureUses).length?{furnitureUses}:{})};
}
export function loadRoom():RoomState {
 try{
  const room=validateRoom(JSON.parse(readStored(ROOM_KEY)??'null'));
  if(room.placements){
   const placements=room.placements;
   const placed=roomCatalog(room.shop).filter(piece=>placements[piece.id]);
   const previous={...placements};
   for(const piece of placed)delete placements[piece.id];
   for(const piece of placed){
    const offset=previous[piece.id];
    for(const candidate of [offset,...roomCatalogOffsets(piece,offset)]){
     placements[piece.id]={...candidate,...(offset.mirrored?{mirrored:true as const}:{})};
     if(!roomPlacementProblem(piece.id,arrangedRoom(placements,room.shop)))break;
     delete placements[piece.id];
    }
   }
  }
  const location=roomPoint(room.position);
  // Furniture can move between layouts without invalidating an older backup.
  room.position=roomPosition(location.x,location.y,arrangedRoom(room.placements,room.shop));
  return room;
 }
 catch{return validateRoom(null);}
}
export function saveRoom(state:RoomState){
 const next=validateRoom(state);
 // Speech may finish while a scene still holds an earlier snapshot. Retain only
 // recall timing for memories that snapshot still contains; never restore deleted memories.
 try{
  const previous=validateSharedMemories(JSON.parse(readStored(ROOM_KEY)??'null')?.sharedMemories);
  next.sharedMemories=next.sharedMemories?.map(memory=>{
   const stamp=previous.find(old=>old.id===memory.id)?.lastRecallOfferedAt;
   return stamp&&Date.parse(stamp)>Date.parse(memory.lastRecallOfferedAt??'1970-01-01')?{...memory,lastRecallOfferedAt:stamp}:memory;
  });
 }catch{/* A damaged earlier save must not prevent saving current state. */}
 writeStored(ROOM_KEY,JSON.stringify(next));
}




