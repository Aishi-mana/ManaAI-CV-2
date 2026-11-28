import AishiHangoutPanel from './AishiHangoutPanel';
import AishiPhone from './AishiPhone';
import {useAishiPhone} from './useAishiPhone';
import {aishiOfferId,type AishiPhoneMessage} from '../core/aishiPhone';
import {useAishiHangouts} from './useAishiHangouts';
import {aishiHangoutKinds,completedAishiHangout,hangoutName,type AishiHangout,type AishiHangoutKind} from '../core/aishiHangouts';
import {DEFAULT_TOWN_DECORATIONS,type TownDecorationSettings} from '../core/townFestivities';
import {useTownSocialState,useSocialActivities,useSocialMeetups} from './useSocialActivities';
import {useManaTravel} from './useManaTravel';
import {TownWeatherProvider} from './TownWeather';
import WeatherReactions from './WeatherReactions';
import {DEFAULT_TOWN_WEATHER,townWeather,townWeatherContext,weatherNeedsShelter,townWeatherLabel,weatherShelterDestination,isOutdoorMap,type TownWeatherSettings} from '../core/townWeather';
import type {PhoneReadState} from '../core/phoneReadState';
import {useWorkshopActivity,WORKSHOP_WORK_POINT} from './useWorkshopActivity';
import {useTownPersonalGoals} from './useTownPersonalGoals';
import {useCharacterHangoutInvitations} from './useCharacterHangoutInvitations';
import type {CharacterHangoutOffer} from '../core/aishiHangouts';
import {PROJECT_NEWS_EVENT} from '../core/projectFollowups';
import {useActivityPreferences} from './useActivityPreferences';
import {useSmallFavors} from './useSmallFavors';
import SmallFavorPanel from './SmallFavorPanel';
import {manaPreferenceMemories,type ActivityPreference} from '../core/activityPreferences';
import {chooseFriendshipPair} from '../core/friendshipHabits';
import {eveningWindDown,eveningGoodnightPrompt,EVENING_TIDY_MS} from '../core/eveningWindDown';
import {townProjectCompletionPrompt,type TownPersonalGoal} from '../core/townPersonalGoals';
import {officeWorkApproach} from '../core/officeWalk';
import {meetPetBotFriend,petBotFriendContext} from '../core/petBot';
import ActivityKeepsake from './ActivityKeepsake';
import {recordActivityKeepsake,homeDisplayKeepsakes} from '../core/activityKeepsakes';
import {type MemoryInvitation} from '../core/memoryInvitations';
import {journalClock} from '../core/clock';
import {rememberSharedActivity,type SharedMemory} from '../core/residentRelationships';
import {residentIds,residentProfiles} from '../core/residentProfiles';
import {aishiActivities,type AishiActivity} from '../core/aishiActivities';
import {createPortal} from 'react-dom';
import {useSceneLine} from './SceneVoice';
import {useOutdoorPetWalk,type OutdoorArea} from './useOutdoorPetWalk';
import {useManaversePlayer} from './useManaversePlayer';
import CharacterGesture,{CharacterNightLighting} from './CharacterGesture';
import ManaSprite from './ManaSprite';
import {manaversePassage} from '../core/manaversePassage';
import {walkTravelMs} from '../core/manaverseMovement';
import {parkActivities,useParkChat,type ParkChat} from './useParkChat';
import {pondSketchDue,type PondSketchGoal} from '../core/pondSketch';
import {libraryStoryDue,libraryStoryText,type LibraryStory} from '../core/libraryStory';
import {chooseManaKeepsake,sharedKeepsakeExchange,type ManaKeepsake} from '../core/manaKeepsake';
import {parkBenches,parkRoamStops} from '../core/manaversePark';
import LivingSpace,{livingSpaceEntry,livingStreetEntry} from './LivingSpace';
import {livingFurnishings} from '../core/companionRoom';
import ManaversePark from './ManaversePark';
import {manaversePlaces,type ManaverseArea,type MapCharacters} from './ManaverseMap';
import DistrictInterior from './DistrictInterior';
import {useParkWalk} from './useParkWalk';
import {useParkResident} from './useParkResident';
import ManaverseStreet from './ManaverseStreet';
import {STREET_ENCOUNTER_MS,officeRooms,homeThresholds,isStreetFloor,isSquareFloor,isDistrictFloor,type OfficeLayout,townBuildings,townBuildingStreet,isOfficeRoom,isTownBuilding,squareDistrictExit,squareSpots,streetDoors,streetEncounterPairs,streetPositionAt,type TownInterior,type StreetCharacter,type StreetPoint,type StreetTrip,type StreetWalker} from '../core/manaverseStreet';

import {useResidentOuting} from './useResidentOuting';
import ResidentRoom from './ResidentRoom';
import MapTransferArrow from './MapTransferArrow';
import SceneViewport,{ScenePanContext,SceneZoomControls} from './SceneViewport';
import {manaRoutine,manaRoutineDestination,nextManaStop,nextResidentStop,homeActivityCycleKey} from '../core/manaverseRoutine';
import {recordTownAttendance,townGuestbookEntries,type TownGuest} from '../core/townGuestbook';
import {townEventCalendar,validTownEvent,birthdayTitle,birthdayOwner,updateTownEvent,deleteTownEvent,type TownEventDraft} from '../core/townEvents';
import BirthdayCelebration from './BirthdayCelebration';
import {recordBirthdayWish,birthdayGuest} from '../core/townBirthdays';
import RoomPhone from './RoomPhone';
import {ROOM_CONTACTS,pendingHostVisit,latestVisitRequest,pendingVisitRequest,phoneMessage,validatePhone,visitIsDue,phoneCanSend,type PhoneMessage,type RoomContact} from '../core/roomPhone';
import {useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {arrangedRoom,chooseRoomActivity,favoriteRoomActivity,loadRoom,movableRoomObject,PLANT_POSITION,recordFurnitureUse,ROOM_ART,ROOM_ACTIVITY_FURNITURE,ROOM_OBJECTS,ROOM_TIMING,roomLighting,roomDropPosition,sharedRoomActorDepth,sharedRoomFurnitureDepth,roomPlacementProblem,roomPoint,roomPosition,roomRoute,roomSleepNight,saveRoom,type RoomActivity,type RoomObject,type RoomPlacements,type RoomPosition} from '../core/companionRoom';
import PetBotChat from './PetBotChat';
import ManaRoomSpeech from './ManaRoomSpeech';
import {validateCoreMemories} from '../core/sceneMemory';
import type {Memory} from '../core/character';
import type {Episode} from '../core/episodes';
import type {DevProject} from '../core/gameDev';
import type {RecordedEvent} from '../core/events';
import {DEFAULT_ROOM_FINISHES,ROOM_FLOOR_FINISHES,ROOM_PIECE_COLORS,ROOM_WALL_FINISHES,roomCatalog,roomCatalogOffsets,roomEnergyState,type RoomCatalogPiece,type RoomFinishes,type RoomPieceColors} from '../core/companionRoom';
import {buyRoomPiece,chooseRoomDesign,emptyRoomShop,furniturePrompt,prepareFurnitureReference,prepareRoomBackground,prepareShopPiece,ROOM_BACKGROUND_LIMIT,ROOM_BACKGROUND_PROMPT,ROOM_SHOP_CATEGORIES,ROOM_SHOP_LIMIT,ROOM_SHOP_PRICE,type RoomDesign,type RoomShop,type RoomShopCategory} from '../core/roomShop';
import {uid} from '../core/types';
import type {ImageAttachment} from '../core/vision';
import ImageGenerationDrawer from './ImageGenerationDrawer';
import {completeRoomActivity,LUNA_VISIT_MEMORY_LIMIT,roomEffectStats,roomMood} from '../core/companionRoom';
import type {GameDevEntry} from './GameDevWorkspace';


const art='./companion-room/';
const roomPieceImage=(image:string)=>image.startsWith('data:')?image:ROOM_ART+image;
const idle=art+'mana_idle_1.webp';
const framesFor=(action:string,count=3)=>Array.from({length:count},(_,index)=>art+`mana_${action}_${index+1}.webp`);
const walkFrames=framesFor('walk');
const idleFrames=framesFor('idle',8);
const activities=[
 {id:'water',label:'Water the plant',object:'plant',position:PLANT_POSITION,facing:1,doing:'Mana is watering the plant.',done:'Mana watered the plant.'},
 {id:'read',label:'Read a book',object:'bookshelf',position:roomPosition(679,445),facing:1,doing:'Mana is reading.',done:'Mana finished reading.'},
 {id:'play',label:'Play at the table',object:'table',position:roomPosition(549,475),facing:-1,doing:'Mana is playing at the table.',done:'Mana finished playing.'},
 {id:'sleep',label:'Nap in the chair',object:'chair',position:roomPosition(627,424),facing:1,doing:'Mana is taking a nap.',done:'Mana woke up from her nap.'},
 {id:'bed',label:'Sleep in bed',object:'bed',position:roomPosition(275,458),facing:-1,doing:'Mana is sleeping in bed.',done:'Mana woke up in bed.'},
 {id:'think',label:'Think at the desk',object:'desk',position:roomPosition(432,335),facing:1,doing:'Mana is thinking at her desk.',done:'Mana finished thinking.'},
 {id:'window',label:'Look out the window',object:'window',position:roomPosition(307,328),facing:-1,doing:'Mana is looking out the window.',done:'Mana stepped away from the window.'},
 {id:'remember',label:'Revisit a memory',object:'photo-board',position:roomPosition(562,354),facing:1,doing:'Mana is looking at the photo board.',done:'Mana visited the photo board.'},
] as const satisfies readonly {id:RoomActivity;label:string;object:string;position:RoomPosition;facing:number;doing:string;done:string}[];
type Activity={id:RoomActivity;label:string;object:string;position:RoomPosition;facing:number;doing:string;done:string;eveningKey?:string};
function furnitureActivities(objects:readonly RoomObject[],catalog:readonly RoomCatalogPiece[]):Activity[]{
 return objects.flatMap(object=>{
  const base=activities.find(activity=>activity.id===object.activity);
  const piece=catalog.find(piece=>piece.id===object.id);
  if(!base||!piece)return [];
  const verb=base.id==='water'?'Water':base.id==='read'?'Read at':'Nap on';
  return [{...base,object:object.id,label:verb+' '+piece.name,done:`Mana finished her activity at the ${piece.name}.`}];
 });
}
const activityFrames=(id:RoomActivity)=>framesFor(id==='bed'?'sleep':id==='remember'?'think':id);
const bedActivity=activities.find(activity=>activity.id==='bed')!;
function activityTarget(activity:Activity,objects:readonly RoomObject[]){
 const placed=objects.find(object=>object.id===activity.object)!;
 const original=ROOM_OBJECTS.find(object=>object.id===activity.object);
 if(!original&&placed.footprint){
  const box=placed.footprint;
  return roomPosition((box.left+box.right)/2,box.bottom+10,objects);
 }
 if(!original)return activity.position;
 const point=roomPoint(activity.position);
 const dx=placed.x-original.x;
 const dy=activity.id==='remember'?dx*.5:placed.y-original.y;
 return roomPosition(placed.mirrored?placed.x+placed.width-(point.x-original.x):point.x+dx,point.y+dy,objects);
}

export default function CompanionRoom({episodes,memories,visible,timeZone,onActivity:recordActivity,projects,onOpenGameDev,events,onEditingChange,canGenerateFurniture,beforeFurnitureGeneration,petBotReady,onPetBotReply,manaSpeechReady,onManaThought,onManaRoomChat,onResidentRoomChat,onPhoneText,onAishiPhoneReply,onAishiPhoneCheckIn,onForgetManaMemory,onChooseInvitation,onAskGroupToJoin,onAskAishiHangout,onChoosePersonalGoal,onChooseActivityPreference}:{
 onChooseActivityPreference:(owner:SharedMemory['owner'],memories:string[],signal:AbortSignal)=>Promise<ActivityPreference|undefined>;
 onChoosePersonalGoal:(owner:MemoryInvitation['owner'],memories:SharedMemory[],signal:AbortSignal)=>Promise<TownPersonalGoal|undefined>;
 onAskAishiHangout:(owner:SharedMemory['owner'],kind:AishiHangoutKind,context:string,signal:AbortSignal)=>Promise<{accepted:boolean;text:string}|undefined>;
 onAskGroupToJoin:(host:RoomContact,activity:'sketch'|'read',memories:SharedMemory[],signal:AbortSignal)=>Promise<{accepted:boolean;text:string}|undefined>;
 onChooseInvitation:(owner:MemoryInvitation['owner'],choices:MemoryInvitation[],signal:AbortSignal)=>Promise<{choice:MemoryInvitation;text:string}|undefined>;
 onForgetManaMemory:(id:string)=>void;
 episodes:Episode[];memories:Memory[];visible:boolean;timeZone:string;onActivity:(action:string,title:string,outcome:string)=>void;
 projects:readonly DevProject[];onOpenGameDev:(entry:GameDevEntry)=>void;
 events:RecordedEvent[];onEditingChange:(editing:boolean)=>void;
 canGenerateFurniture:boolean;beforeFurnitureGeneration:(cpu:boolean)=>Promise<()=>Promise<void>>;
 petBotReady:boolean;onPetBotReply:(message:string,memory:string[],signal:AbortSignal,roomContext:string)=>Promise<{reply:string;memory?:string}>;
 manaSpeechReady:boolean;onManaThought:(context:string,signal:AbortSignal)=>Promise<string>;
 onManaRoomChat:(message:string,context:string,onReply:(reply:string)=>void)=>Promise<void>;
 onResidentRoomChat:(resident:RoomContact,message:string,context:string,signal:AbortSignal)=>Promise<{reply:string;memory?:string}>;
 onPhoneText:(message:PhoneMessage,history:readonly PhoneMessage[],signal:AbortSignal)=>Promise<string>;
 onAishiPhoneReply:(contact:TownPersonalGoal['owner'],history:readonly AishiPhoneMessage[],context:string,signal:AbortSignal)=>Promise<string>;
 onAishiPhoneCheckIn:(contact:TownPersonalGoal['owner'],history:readonly AishiPhoneMessage[],context:string,signal:AbortSignal)=>Promise<string>;
}){
 const [room]=useState(loadRoom);
 const social=useTownSocialState();
 const {invitationRequest,groupJoining,setGroupJoining,groupJoinPending,groupJoinError,groupJoinReply,
  friendMeetup,setFriendMeetup,aishiInvitation,setAishiInvitation,meetup,setMeetup,meetupPlace,
  rememberedParkActivity,sketchMeetup,meetupRequestedAt,
  aishiJoining,setAishiJoining,parkChat,setParkChat}=social;
 const [activityKeepsakes,setActivityKeepsakes]=useState(()=>room.activityKeepsakes??[]);
 const [sharedMemories,setSharedMemories]=useState(()=>room.sharedMemories??[]);
 const [nearbyHangoutOffer,setNearbyHangoutOffer]=useState<CharacterHangoutOffer>();
 useEffect(()=>{
  // AI replies finish outside this scene; synchronize before another scene save.
  const sync=()=>{const next=loadRoom().sharedMemories??[];current.current={...current.current,sharedMemories:next};setSharedMemories(next);};
  window.addEventListener(PROJECT_NEWS_EVENT,sync);
  return ()=>window.removeEventListener(PROJECT_NEWS_EVENT,sync);
 },[]);
 const [residentMemories,setResidentMemories]=useState<Partial<Record<RoomContact,string[]>>>(()=>
  Object.fromEntries(residentIds.map(id=>[id,room[residentProfiles[id].memory.coreKey]??[]])));
 const [livingGuest,setLivingGuest]=useState<RoomContact|null>(null);
 const [petBotFriends,setPetBotFriends]=useState(()=>room.petBotFriends??{});
 const metDuringVisit=useRef<RoomContact|undefined>(undefined);
 const [petBotMemory,setPetBotMemory]=useState(()=>room.petBotMemory??[]);
 const [petBotInvited,setPetBotInvited]=useState(false);
 const [petBotCue,setPetBotCue]=useState<'invite'|'home'>();
 const petBotReturnDeadline=useRef(0);
 const [petBotLocation,setPetBotLocation]=useState<{room:'bedroom'|'living'|'outside';entry?:StreetPoint}>({room:'bedroom'});
 const [manaSpeechRoom,setManaSpeechRoom]=useState<'bedroom'|'living'>();
 const [phoneMessages,setPhoneMessages]=useState(()=>room.aiPhone?room.phoneMessages??[]:[]);
 const [phoneReadMessages,setPhoneReadMessages]=useState<PhoneReadState>(()=>room.phoneReadMessages??{});
 function markPhoneRead(read:PhoneReadState){
  const merged={...current.current.phoneReadMessages,...read};
  current.current={...current.current,phoneReadMessages:merged};
  saveRoom(current.current);
  setPhoneReadMessages(merged);
 }
 const [pondSketch,setPondSketch]=useState(room.pondSketch);
 const [libraryStory,setLibraryStory]=useState(room.libraryStory);
 const [manaKeepsake,setManaKeepsake]=useState(room.manaKeepsake);
 const [sharedKeepsake,setSharedKeepsake]=useState(room.sharedKeepsake);
 const [phoneVisit,setPhoneVisit]=useState<{contact:RoomContact}>();
 const [visitorAvailable,setVisitorAvailable]=useState(true);
 const [awayVisitor,setAwayVisitor]=useState<RoomContact|null>(null);
 const [visitorPreparing,setVisitorPreparing]=useState<RoomContact|null>(null);
 const [visitorAtDoor,setVisitorAtDoor]=useState<RoomContact|null>(null);
 const [livingIdle,setLivingIdle]=useState(false);
 const [livingActivity,setLivingActivity]=useState('');
 const [lunaHomeActivity,setLunaHomeActivity]=useState('');
 const [lyraHomeActivity,setLyraHomeActivity]=useState('');
 const current=useRef(room.aiPhone?room:{...room,aiPhone:true as const,phoneMessages:[]});
 useEffect(()=>{if(!room.aiPhone)saveRoom(current.current);},[room]);
 const [guestbookVisits,setGuestbookVisits]=useState(()=>room.townGuestbook??[]);
 const [townDecorations,setTownDecorations]=useState(()=>room.townDecorations??DEFAULT_TOWN_DECORATIONS);
 const [weatherSettings,setWeatherSettings]=useState(()=>room.weather??DEFAULT_TOWN_WEATHER);
 function changeWeather(settings:TownWeatherSettings){
  current.current={...current.current,weather:settings};saveRoom(current.current);setWeatherSettings(settings);
 }
 function changeTownDecorations(settings:TownDecorationSettings){
  current.current={...current.current,townDecorations:settings};
  saveRoom(current.current);
  setTownDecorations(settings);
 }
 const [aishiHangout,setAishiHangout]=useState<AishiHangout>();
 const aishiParkOwner=aishiHangout&&aishiHangoutKinds[aishiHangout.kind].area==='park'?aishiHangout.owner:undefined;
 const aishiCafeOwner=aishiHangout?.kind==='cafe'?aishiHangout.owner:undefined;
 const [customTownEvents,setCustomTownEvents]=useState(()=>room.townEvents??[]);
 function addTownEvent(draft:TownEventDraft){
  if(!validTownEvent(draft))return;
  const events=[...(current.current.townEvents??[]).filter(event=>!draft.birthdayFor||event.id!==`birthday-${draft.birthdayFor}`),{...draft,title:draft.birthdayFor?birthdayTitle(draft.birthdayFor):draft.title.trim(),id:draft.birthdayFor?`birthday-${draft.birthdayFor}`:crypto.randomUUID()}];
  const next={...current.current,townEvents:events};
  saveRoom(next);
  current.current=next;
  setCustomTownEvents(events);
 }
 const [officeLayout,setOfficeLayout]=useState(room.officeLayout);
 function editTownEvent(id:string,draft:TownEventDraft){
  const previous=current.current.townEvents??[],events=updateTownEvent(previous,id,draft);
  if(events===previous)return false;
  current.current={...current.current,townEvents:events};saveRoom(current.current);setCustomTownEvents(events);return true;
 }
 function removeTownEvent(id:string){
  const previous=current.current.townEvents??[],events=deleteTownEvent(previous,id);
  if(events===previous)return false;
  current.current={...current.current,townEvents:events};saveRoom(current.current);setCustomTownEvents(events);return true;
 }
 function saveKeepsake(keepsake:ManaKeepsake){
  if(keepsake.shared){
   current.current={...current.current,sharedKeepsake:keepsake};
   setSharedKeepsake(keepsake);
  }else{
   current.current={...current.current,manaKeepsake:keepsake};
   setManaKeepsake(keepsake);
  }
  saveRoom(current.current);
 }
 function pendingKeepsake(){
  const {manaKeepsake,sharedKeepsake}=current.current;
  return [sharedKeepsake,manaKeepsake].find(keepsake=>keepsake&&!keepsake.pinned);
 }
 function recordLibraryStory(stage:LibraryStory['stage']){
  const story={stage,updatedAt:new Date().toISOString()};
  current.current={...current.current,libraryStory:story};
  saveRoom(current.current);
  setLibraryStory(story);
 }
 function recordPondSketch(status:PondSketchGoal['status']){
  const goal={status,updatedAt:new Date().toISOString()};
  current.current={...current.current,pondSketch:goal};
  setPondSketch(goal);
  const kind={invited:'sketch-invite',deferred:'sketch-deferred',finished:'sketch-finished'} as const;
  addPhoneMessage(phoneMessage('luna',kind[status],goal.updatedAt));
 }
 function savePhoneMessages(messages:PhoneMessage[]){
  current.current={...current.current,phoneMessages:messages};
  saveRoom(current.current);
  setPhoneMessages(messages);
 }
 function addPhoneMessage(message:PhoneMessage){
  savePhoneMessages(validatePhone([...(current.current.phoneMessages??[]),message]));
 }
 const phoneWriter=useRef({ready:manaSpeechReady,write:onPhoneText});
 useEffect(()=>{phoneWriter.current={ready:manaSpeechReady,write:onPhoneText};},[manaSpeechReady,onPhoneText]);
 useEffect(()=>{
  if(!visible)return;
  let active:AbortController|undefined;
  let retryAfter=0;
  const timer=window.setInterval(()=>{
   if(active||!phoneWriter.current.ready||Date.now()<retryAfter||document.visibilityState!=='visible'||!phoneCanSend(new Date(),timeZone,!!current.current.sleep))return;
   const messages=current.current.phoneMessages??[];
   const index=messages.findIndex(message=>!message.text);
   if(index<0)return;
   const draft=messages[index];
   const controller=new AbortController();
   active=controller;
   void phoneWriter.current.write(draft,messages.slice(0,index),controller.signal).then(text=>{
    if(controller.signal.aborted||!phoneCanSend(new Date(),timeZone,!!current.current.sleep))return;
    if(!text.trim()){retryAfter=Date.now()+12_000;return;}
    const latest=current.current.phoneMessages??[];
    const at=latest.findIndex(message=>!message.text&&message.contact===draft.contact&&message.kind===draft.kind&&message.at===draft.at);
    if(at<0)return;
    savePhoneMessages(latest.map((message,i)=>i===at?{...message,text:text.trim().slice(0,240)}:message));
   }).catch(()=>{retryAfter=Date.now()+12_000;}).finally(()=>{active=undefined;});
  },1000);
  return ()=>{window.clearInterval(timer);active?.abort();};
 },[visible,timeZone]);
 const [area,setArea]=useState<ManaverseArea>('bedroom');
 const [zoomLevels,setZoomLevels]=useState<Partial<Record<ManaverseArea,number>>>({});
 const zoom=zoomLevels[area]??1;
 const zoomAnchor=useRef<{viewport:HTMLElement;x:number;y:number}|undefined>(undefined);
 const [mapOpen,setMapOpen]=useState(false);
 const [followMana,setFollowMana]=useState(true);
 const [returning,setReturning]=useState(false);
 const [streetGuest,setStreetGuest]=useState<{contact:RoomContact;trip:StreetTrip}>();
 const [encounter,setEncounter]=useState<(ReturnType<typeof streetEncounterPairs>[number]&{started:number;variant:number;scene:'street'|'square'})>();
 const encounterCooldown=useRef(0);
 const nearbyPairs=useRef(new Set<string>());
 const paused=(id:StreetCharacter)=>encounter&&(encounter.first===id||encounter.second===id)?encounter.started:undefined;
 const manaPause=paused('mana');
 const {manaArea,setManaArea,manaStreetPosition,setManaStreetPosition,manaStreetTrip,setManaStreetTrip,
  officePosition,setOfficePosition,officeTrip,walkThroughOfficeDoor,startStreetWalk,enterStreet,
  residentExit,leaveResidentHome,finishResidentExit,leaveSquare,leaveDistrict,leaveTownBuilding}=useManaTravel(
   officeLayout,manaPause,()=>{
    petBotReturnDeadline.current=Date.now()+45_000;
    setPetBotInvited(false);
    current.current={...current.current,livingPosition:livingStreetEntry};
    saveRoom(current.current);
   },destination=>viewRoom(destination));
 const hostPlan=pendingHostVisit(phoneMessages);
 const [,refreshVisitTime]=useState(0);
 useEffect(()=>{
  if(!hostPlan?.scheduledFor||visitIsDue(hostPlan))return;
  const delay=Date.parse(hostPlan.scheduledFor)-Date.now();
  const timer=window.setTimeout(()=>refreshVisitTime(value=>value+1),Math.max(0,delay));
  return ()=>clearTimeout(timer);
 },[hostPlan?.scheduledFor]);
 const hostVisit=hostPlan&&visitIsDue(hostPlan)?hostPlan:undefined;
 const [eventClock,setEventClock]=useState(Date.now);
 useEffect(()=>{
  const refresh=()=>setEventClock(Date.now());
  const timer=window.setInterval(refresh,15_000);
  document.addEventListener('visibilitychange',refresh);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[]);
 const calendar=useMemo(()=>townEventCalendar(new Date(eventClock),timeZone,customTownEvents),[eventClock,timeZone,customTownEvents]);
 const routine=manaRoutine(calendar.clock);
 const weather=useMemo(()=>townWeather(calendar.clock,weatherSettings),[calendar.clock,weatherSettings]);
 const sheltering=weatherNeedsShelter(weather);
 const townGathering=calendar.active.length>0&&!meetup&&!hostVisit&&!sheltering;
 const cafePartner=meetupPlace==='cafe'?meetup:undefined;
 const [cafeEncounter,setCafeEncounter]=useState<RoomContact>();
 const seenCafeEncounter=useRef<RoomContact|undefined>(undefined);
 const parkContact=meetupPlace==='park'?meetup:undefined;
 const parkPaused=(id:StreetCharacter)=>!sheltering&&(parkChat?.first===id||parkChat?.second===id);
 const {outing:lunaOuting,resume:resumeLuna,leavePark:leaveLunaPark,leaveHome:leaveLunaHome,leaveLibrary:leaveLunaLibrary,leaveCafe:leaveLunaCafe,drop:dropLunaOuting}=useResidentOuting('luna',awayVisitor==='luna',timeZone,calendar.clock,paused('luna'),parkContact==='luna'||!!friendMeetup||aishiParkOwner==='luna',hostVisit?.contact==='luna'||visitorPreparing==='luna',!awayVisitor,cafePartner==='luna'||aishiCafeOwner==='luna',townGathering,cafeEncounter==='luna',sheltering);
 const {outing:lyraOuting,resume:resumeLyra,leavePark:leaveLyraPark,leaveHome:leaveLyraHome,leaveCafe:leaveLyraCafe,drop:dropLyraOuting}=useResidentOuting('lyra',awayVisitor==='lyra',timeZone,calendar.clock,paused('lyra'),parkContact==='lyra'||!!friendMeetup||aishiParkOwner==='lyra',hostVisit?.contact==='lyra'||visitorPreparing==='lyra',false,cafePartner==='lyra'||aishiCafeOwner==='lyra',townGathering,cafeEncounter==='lyra',sheltering);
 const lunaPark=useParkResident('luna',!!lunaOuting?.inPark,timeZone,leaveLunaPark,parkContact==='luna'||!!friendMeetup||aishiParkOwner==='luna',parkPaused('luna')||aishiJoining==='sketch',friendMeetup?.host,sheltering);
 const lyraPark=useParkResident('lyra',!!lyraOuting?.inPark,timeZone,leaveLyraPark,parkContact==='lyra'||!!friendMeetup||aishiParkOwner==='lyra',parkPaused('lyra'),friendMeetup?.host,sheltering);
 const cafeResidents=(['luna','lyra'] as const).filter(contact=>
  (contact==='luna'?lunaOuting:lyraOuting)?.cafeStage==='inside');
 const cafeLeaving=(['luna','lyra'] as const).filter(contact=>
  (contact==='luna'?lunaOuting:lyraOuting)?.cafeStage==='leaving');
 const cafePartnerPresent=!!cafePartner&&cafeResidents.includes(cafePartner);
 const cafeNeighbor=!aishiHangout&&manaArea==='cafe'&&!meetup&&!hostVisit&&!townGathering?cafeResidents[0]:undefined;
 useEffect(()=>{
  if(!cafeNeighbor){
   seenCafeEncounter.current=undefined;
   setCafeEncounter(undefined);
   return;
  }
  if(seenCafeEncounter.current===cafeNeighbor)return;
  const greet=window.setTimeout(()=>{
   seenCafeEncounter.current=cafeNeighbor;
   setCafeEncounter(cafeNeighbor);
  },1600);
  return ()=>clearTimeout(greet);
 },[cafeNeighbor]);
 useEffect(()=>{
  if(!cafeEncounter)return;
  const finish=window.setTimeout(()=>setCafeEncounter(undefined),14_000);
  return ()=>clearTimeout(finish);
 },[cafeEncounter]);
 const outdoorResidents=[
  ...(lunaOuting&&!lunaOuting.homeExit&&!lunaOuting.inPark&&!lunaOuting.inLibrary&&(!lunaOuting.cafeStage||lunaOuting.cafeStage==='to-district')?[{contact:'luna' as const,...lunaOuting}]:[]),
  ...(lyraOuting&&!lyraOuting.homeExit&&!lyraOuting.inPark&&(!lyraOuting.cafeStage||lyraOuting.cafeStage==='to-district')?[{contact:'lyra' as const,...lyraOuting}]:[]),
 ];
 const districtResidents=([{contact:'luna',outing:lunaOuting},{contact:'lyra',outing:lyraOuting}] as const)
  .flatMap(({contact,outing})=>outing&&(outing.cafeStage==='to-cafe'||outing.cafeStage==='from-cafe')?[{contact,...outing}]:[]);
 const squareResidents=outdoorResidents.filter(resident=>resident.squareStops!==undefined);
 const manaAtGathering=manaArea==='square'&&!manaStreetTrip;
 const lunaAtGathering=!!lunaOuting&&lunaOuting.squareStops!==undefined&&!lunaOuting.cafeStage&&!lunaOuting.leavingSquare&&!lunaOuting.trip;
 const lyraAtGathering=!!lyraOuting&&lyraOuting.squareStops!==undefined&&!lyraOuting.cafeStage&&!lyraOuting.leavingSquare&&!lyraOuting.trip;
 useEffect(()=>{
  if(sheltering)return;
  const present:TownGuest[]=[];
  if(manaAtGathering)present.push('Mana');
  if(lunaAtGathering)present.push('Luna');
  if(lyraAtGathering)present.push('Lyra');
  const previous=current.current.townGuestbook??guestbookVisits;
  const updated=recordTownAttendance(previous,calendar.active,present);
  if(updated!==previous){
   const next={...current.current,townGuestbook:updated};
   saveRoom(next);current.current=next;setGuestbookVisits(updated);
  }
  for(const event of calendar.active){
   const owner=birthdayOwner(event);if(!owner||!present.includes(birthdayGuest(owner)))continue;
   for(const speaker of ['mana','luna','lyra'] as const){
    if(speaker!==owner&&present.includes(birthdayGuest(speaker)))rememberTogether(`birthday-celebration-${owner}-${speaker}`,event.title,`${birthdayGuest(speaker)} and ${birthdayGuest(owner)} celebrated ${event.title} together in Town Square.`,[speaker,owner]);
   }
  }
 },[calendar.active,manaAtGathering,lunaAtGathering,lyraAtGathering,guestbookVisits,sheltering]);
 const guestbookEntries=useMemo(()=>townGuestbookEntries(guestbookVisits,calendar.clock),[guestbookVisits,calendar.clock]);
 const streetResidents=outdoorResidents.filter(resident=>resident.squareStops===undefined);
 const streetWalkers=useRef<StreetWalker[]>([]);
 streetWalkers.current=[
  ...(manaArea==='street'&&(!manaStreetTrip||manaStreetTrip.roaming)
   ?[{id:'mana' as const,position:manaStreetPosition,trip:manaStreetTrip}]:[]),
  ...streetResidents.filter(resident=>!resident.returning&&!resident.goingToSquare).map(({contact,position,trip})=>({id:contact,position,trip})),
 ];
 const squareWalkers=useRef<StreetWalker[]>([]);
 squareWalkers.current=[
  ...(manaArea==='square'&&(!manaStreetTrip||!manaStreetTrip.door)
   ?[{id:'mana' as const,position:manaStreetPosition,trip:manaStreetTrip}]:[]),
  ...squareResidents.filter(resident=>!resident.leavingSquare).map(({contact,position,trip})=>({id:contact,position,trip})),
 ];
 const finishEncounter=useRef(()=>{});
 finishEncounter.current=()=>{
  if(!encounter)return;
  const elapsed=Date.now()-encounter.started;
  if(paused('mana'))setManaStreetTrip(trip=>trip&&{...trip,started:trip.started+elapsed});
  if(paused('luna'))resumeLuna(elapsed);
  if(paused('lyra'))resumeLyra(elapsed);
  setEncounter(undefined);
 };
 useEffect(()=>{
  if(!encounter)return;
  const timer=window.setTimeout(()=>finishEncounter.current(),STREET_ENCOUNTER_MS);
  return ()=>clearTimeout(timer);
 },[encounter]);
 useEffect(()=>{
  if(awayVisitor&&paused(awayVisitor))finishEncounter.current();
 },[awayVisitor,encounter]);
 const [officeWorkTarget,setOfficeWorkTarget]=useState<StreetPoint>();
 const [leavingForStreet,setLeavingForStreet]=useState(false);
 function leaveHomeForOuting(invitePetBot:boolean){
  if(leavingForStreet||petBotCue||petBotLocation.room==='outside')return;
  if(invitePetBot&&Math.random()<.55){
   setPetBotCue('invite');
   return;
  }
  setPetBotInvited(false);
  setLeavingForStreet(true);
 }
 const park=useParkWalk(manaArea==='park',()=>enterStreet('park'),parkPaused('mana'));
 const parkActions=useRef(park);
 parkActions.current=park;
 const travel=(destination:'bedroom'|'living')=>{
  if(destination===manaArea)return;
  if(destination==='bedroom'){
   if(manaArea==='living'){
    const waitingForPet=petBotLocation.room==='outside'&&Date.now()<petBotReturnDeadline.current;
    if(!waitingForPet&&petBotCue!=='home')setReturning(true);
   }
   else if(manaArea==='street')startStreetWalk(streetDoors.living,'living');
   else if(manaArea==='park')park.leave();
   else if(manaArea==='square')leaveSquare();
   else if(manaArea==='district')leaveDistrict();
   else if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
   else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
   return;
  }
  current.current={...current.current,livingPosition:livingSpaceEntry};
  saveRoom(current.current);
  setManaArea(destination);
 };
 const viewRoom=(destination:typeof area)=>{
  setFollowMana(false);
  setArea(destination);
 };
 const [shop,setShop]=useState(()=>room.shop??emptyRoomShop());
 const [shopOpen,setShopOpen]=useState(false);
 const [draftBackground,setDraftBackground]=useState(room.background);
 const [backgrounds,setBackgrounds]=useState(()=>[...new Set([
  ...(room.background?[room.background]:[]),...(room.backgrounds??[]),
 ])].slice(0,ROOM_BACKGROUND_LIMIT));
 const [backgroundJob,setBackgroundJob]=useState(false);
 const [backgroundStatus,setBackgroundStatus]=useState('');
 const backgroundReference=ROOM_ART+'roombg.webp';
 const backgroundBusy=useRef(0);
 const [shopCategory,setShopCategory]=useState<RoomShopCategory|'Any category'>('Any category');
 const [design,setDesign]=useState<RoomDesign>();
 const [shopStatus,setShopStatus]=useState('');
 const generation=useRef(0);
 const [placements,setPlacements]=useState(room.placements);
 const [lighting,setLighting]=useState(()=>roomLighting(new Date(),timeZone));
 const [draft,setDraft]=useState<RoomPlacements|null>(null);
 const [draftFinishes,setDraftFinishes]=useState<RoomFinishes>(room.finishes??DEFAULT_ROOM_FINISHES);
 const [draftColors,setDraftColors]=useState<RoomPieceColors>(room.pieceColors??{});
 const editButton=useRef<HTMLButtonElement>(null);
 const editorTitle=useRef<HTMLHeadingElement>(null);
 const [selected,setSelected]=useState('');
 const [preview,setPreview]=useState<{placements:RoomPlacements;problem?:string}|null>(null);
 const [editMessage,setEditMessage]=useState('');
 const editDrag=useRef<{id:string;pointer:number;x:number;y:number;dx:number;dy:number;move?:NonNullable<typeof preview>}|null>(null);
 const editPausedAt=useRef<number|undefined>(undefined);
 const catalog=useMemo(()=>roomCatalog(shop),[shop]);
 const objects=useMemo(()=>arrangedRoom(placements,shop),[placements,shop]);
 const bedroomDoor=roomPosition(homeThresholds.bedroomToLiving.x*7.99,homeThresholds.bedroomToLiving.y*6.98,objects);
 const editing=draft!==null&&visible;
 useEffect(()=>{if(editing)editorTitle.current?.focus();},[editing]);
 const displayedObjects=useMemo(()=>draft===null?objects:arrangedRoom(preview?.placements??draft,shop),[objects,draft,preview,shop]);
 const frame=useRef(0);
 const [position,setPosition]=useState(room.position);
 const [sprite,setSprite]=useState(idle);
 const [facing,setFacing]=useState(()=>room.sleep?bedActivity.facing*(room.placements?.bed?.mirrored?-1:1):1);
 const [status,setStatus]=useState(room.sleep?bedActivity.doing:activities.find(activity=>activity.id===room.lastActivity)?.done??(room.wateredAt?'The plant has been watered.':''));
 const [resting,setResting]=useState<string|null>(room.sleep?'bed':null);
 const [memory,setMemory]=useState<{title:string;content:string}|null>(null);
 const [activityReaction,setActivityReaction]=useState<{area:ManaverseArea;context:string}>();
 const [projectReaction,setProjectReaction]=useState<{area:ManaverseArea;owner:TownPersonalGoal['owner'];context:string}>();
 const [effectSummary,setEffectSummary]=useState<string[]>([]);
 const effectStats=roomEffectStats(current.current);
 const [station,setStation]=useState<'desk'|'table'|null>(null);
 const [active,setActive]=useState(!!room.sleep);
 const [sleeping,setSleeping]=useState(!!room.sleep);
 const [eveningDates,setEveningDates]=useState(()=>room.eveningWindDownDates??{});
 function finishEvening(owner:SharedMemory['owner'],key:string,outcome:string){
  if(current.current.eveningWindDownDates?.[owner]===key||eveningWindDown(new Date(),timeZone)!==key)return;
  const dates={...current.current.eveningWindDownDates,[owner]:key};
  current.current={...current.current,eveningWindDownDates:dates,activityCooldownUntil:owner==='mana'?new Date(Date.now()+ROOM_TIMING.homePause).toISOString():current.current.activityCooldownUntil};
  saveRoom(current.current);setEveningDates(dates);
  recordActivity(`evening-wind-down-${owner}-${key}`,'Evening wind-down',outcome);
  if(owner==='mana'&&visible&&area==='bedroom')setActivityReaction({area:'bedroom',context:eveningGoodnightPrompt('Mana',outcome)});
 }
 function rememberTogether(action:string,title:string,outcome:string,participants:readonly SharedMemory['with'][]){
  const date=journalClock(new Date(),timeZone).date;
  const next=rememberSharedActivity(current.current.sharedMemories??[],`shared-${date}-${action}`,title,outcome,participants);
  if(next===current.current.sharedMemories)return;
  current.current={...current.current,sharedMemories:next};
  saveRoom(current.current);
  setSharedMemories(next);
 }
 const personalGoals=useTownPersonalGoals(current,visible&&!editing&&!sleeping,manaSpeechReady,invitationRequest,onChoosePersonalGoal,{timeZone,onMilestone:milestone=>recordActivity(milestone.action,milestone.title,milestone.outcome),onCompleted:goal=>{
  const name=goal.owner==='mana'?'Mana':residentProfiles[goal.owner].name;
  const context=townProjectCompletionPrompt(goal);
  if(context&&dive.active&&visible&&!editing&&!sleeping&&dive.root.current?.querySelector(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${name}"])`)){
   setActivityReaction(undefined);
   setProjectReaction({area,owner:goal.owner,context});
  }
 }});
 const displayKeepsakes=homeDisplayKeepsakes(activityKeepsakes,personalGoals.goals,Date.now(),guestbookVisits,timeZone);
 const coreForPreferences=(owner:SharedMemory['owner'])=>owner==='mana'?manaPreferenceMemories(memories):current.current[residentProfiles[owner].memory.coreKey]??[];
 const freeTimePreferences=useActivityPreferences(current,visible&&!editing&&!sleeping,manaSpeechReady,timeZone,invitationRequest,coreForPreferences,onChooseActivityPreference);
 function onActivity(action:string,title:string,outcome:string,participants?:readonly SharedMemory['with'][]){
  if(participants)rememberTogether(action,title,outcome,participants);
  const previousKeepsakes=current.current.activityKeepsakes??[];
  const nextKeepsakes=recordActivityKeepsake(previousKeepsakes,`keepsake-${journalClock(new Date(),timeZone).date}-${action}`,action,outcome,participants??['mana']);
  if(nextKeepsakes!==previousKeepsakes){
   current.current={...current.current,activityKeepsakes:nextKeepsakes};
   saveRoom(current.current);
   setActivityKeepsakes(nextKeepsakes);
  }
  personalGoals.record(`activity-${Date.now()}-${action}`,action,outcome,participants??['mana']);
  recordActivity(action,title,outcome);
  if(action!=='bedtime'&&visible&&area===manaArea&&(!participants||participants.includes('mana'))){
   setActivityReaction({area,context:`React naturally to the activity you just completed. Recorded outcome: ${outcome} (event time ${Date.now()})`});
  }
 }
 const activityLine=useSceneLine(!projectReaction&&visible&&!sleeping&&!editing&&activityReaction?.area===area&&manaArea===area?`${townWeatherContext(weather)}\n${activityReaction.context}`:undefined);
 const [energy,setEnergy]=useState(room.energy??100);
 const [favorite,setFavorite]=useState(()=>favoriteRoomActivity(room));
 const [idleCycle,setIdleCycle]=useState(0);
 const [poseFrame,setPoseFrame]=useState(0);
 const pausedTime=useRef(0);
 const activityRunning=useRef(false);
 const scene=useRef<HTMLDivElement>(null);
 const routineTick=useRef(()=>{});
 const finishedRoutineActivity=useRef('');
 const dive=useManaversePlayer(area,setArea,{bedroom:objects,living:livingFurnishings},officeLayout,setAishiJoining,id=>{
  if(groupJoining){
   if(friendMeetup?.at!==groupJoining.at||id!==groupJoining.activity)return;
   const outcome=`Aishi, Luna and Lyra ${parkActivities[id].outcome}.`;
   onActivity('aishi-group-'+id,id==='sketch'?'Group sketching':'Group reading',outcome,['aishi','luna','lyra']);
   setGroupJoining(undefined);
   setFriendMeetup(undefined);
   return;
  }
  const partner={sketch:'luna',read:'lyra',tinker:'mana'} as const;
  const outcomes={sketch:'Aishi and Luna sketched together by the park pond.',read:'Aishi and Lyra read together by the library window.',tinker:'Aishi and Mana fitted gears together at the Workshop workbench.'};
  onActivity('aishi-'+id,aishiActivities[id].label,outcomes[id],['aishi',partner[id]]);
 });
 function residentMapArea(contact:RoomContact,outing:typeof lunaOuting):ManaverseArea{
  if(streetGuest?.contact===contact)return 'street';
  if(awayVisitor===contact)return 'living';
  if(!outing)return contact==='luna'?'luna-home':roomSleepNight(new Date(),timeZone)?'lyra-room':'library';
  if(outing.inPark)return 'park';
  if(outing.inLibrary)return 'library';
  if(outing.cafeStage==='inside')return 'cafe';
  if(outing.cafeStage==='to-cafe'||outing.cafeStage==='from-cafe')return 'district';
  if(outing.squareStops!==undefined)return 'square';
  return 'street';
 }
 const enterView=dive.active?dive.go:viewRoom;
 const projectLine=useSceneLine(projectReaction&&projectReaction.area===area&&dive.active&&visible&&!editing&&!sleeping?projectReaction.context:undefined,projectReaction?.owner??'mana');
 useEffect(()=>{
  if(!projectReaction)return;
  if(projectReaction.area!==area||!dive.active||!visible||editing||sleeping){setProjectReaction(undefined);return;}
  const timer=window.setTimeout(()=>setProjectReaction(undefined),30_000);
  return ()=>window.clearTimeout(timer);
 },[projectReaction,area,dive.active,visible,editing,sleeping]);
 function changeZoom(next:number){
  if(next===zoom)return;
  const viewport=dive.root.current?.querySelector<HTMLElement>('.companion-room-body:not([hidden]) :is(.scene-viewport,.interior-viewport,.manaverse-park-view)');
  if(viewport){
   zoomAnchor.current={viewport,x:(viewport.scrollLeft+viewport.clientWidth/2)/viewport.scrollWidth,
    y:(viewport.scrollTop+viewport.clientHeight/2)/viewport.scrollHeight};
  }
  setZoomLevels(previous=>({...previous,[area]:next}));
 }
 useLayoutEffect(()=>{
  const anchor=zoomAnchor.current;
  zoomAnchor.current=undefined;
  if(!anchor?.viewport.isConnected)return;
  const {viewport,x,y}=anchor;
  viewport.scrollLeft=x*viewport.scrollWidth-viewport.clientWidth/2;
  viewport.scrollTop=y*viewport.scrollHeight-viewport.clientHeight/2;
 },[zoom]);
 useEffect(()=>{if(sleeping)travel('bedroom');},[sleeping,manaArea,manaStreetTrip,manaPause]);
 useEffect(()=>{if(followMana&&!editing&&!dive.active)setArea(manaArea);},[followMana,manaArea,editing,dive.active]);
 useEffect(()=>{
  if(followMana||editing||!visible||mapOpen||dive.active)return;
  let timer:number;
  const reset=()=>{
   window.clearTimeout(timer);
   timer=window.setTimeout(()=>setFollowMana(true),30_000);
  };
  const inputs=['pointermove','pointerdown','keydown','wheel'] as const;
  for(const input of inputs)window.addEventListener(input,reset,{passive:true});
  reset();
  return ()=>{
   window.clearTimeout(timer);
   for(const input of inputs)window.removeEventListener(input,reset);
  };
 },[area,followMana,editing,visible,mapOpen,dive.active]);
 useEffect(()=>{if(!visible||editing)setMapOpen(false);},[visible,editing]);
 const roomNow=()=> (editPausedAt.current??performance.now())-pausedTime.current;
 const coolingDown=()=>Date.parse(current.current.activityCooldownUntil??'')>Date.now();
 useEffect(()=>{
  if(encounter||editing||sheltering)return;
  const timer=window.setInterval(()=>{
   if(document.visibilityState!=='visible'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const now=Date.now();
   const pairs=[
    ...streetEncounterPairs(streetWalkers.current,now).map(pair=>({...pair,scene:'street' as const})),
    ...streetEncounterPairs(squareWalkers.current,now).map(pair=>({...pair,scene:'square' as const})),
   ];
   const key=(pair:typeof pairs[number])=>`${pair.scene}-${pair.first}-${pair.second}`;
   const next=new Set(pairs.map(key));
   const candidate=pairs.find(pair=>!nearbyPairs.current.has(key(pair)));
   nearbyPairs.current=next;
   if(candidate&&now>=encounterCooldown.current&&Math.random()<.55){
    encounterCooldown.current=now+25_000;
    setEncounter({...candidate,started:now,variant:Math.floor(Math.random()*2)});
   }
  },100);
  return ()=>clearInterval(timer);
 },[encounter,editing,sheltering]);
 useEffect(()=>{if(sheltering&&encounter)finishEncounter.current();},[sheltering,encounter]);
 const {startMeetup,cancelMeetup}=useSocialMeetups({
  state:social,room:current,sleeping,visitorAvailable,hostPlanned:!!hostPlan,isBedtime:()=>bedtime(),
  timeZone,onMessage:addPhoneMessage,onPondSketch:recordPondSketch,sheltering,
 });
 useEffect(()=>{if(sheltering&&meetup&&meetupPlace==='park')cancelMeetup(`${townWeatherLabel(weather)}; the outdoor meetup was postponed so everyone can walk to shelter.`);},[sheltering,meetup,meetupPlace]);
 const parkPartner=meetup==='luna'?lunaPark:lyraPark;
 const parkedPeople=[
  ...(park.walker?[{id:'mana' as const,walker:park.walker}]:[]),
  ...[aishiJoining==='sketch'&&!groupJoining?undefined:lunaPark,lyraPark].flatMap(resident=>resident?[{
   id:resident.contact,walker:resident.bench?{...resident.walker,point:resident.bench.point}:resident.walker,
   sketching:resident.contact==='luna'&&!!resident.bench,
  }]:[]),
 ];
 const friendChat:ParkChat|undefined=friendMeetup&&lunaPark?.bench&&lyraPark?.bench?{
  first:friendMeetup.host,second:friendMeetup.host==='luna'?'lyra':'luna',planned:true,activity:friendMeetup.activity,lines:{first:friendMeetup.text,second:friendMeetup.reply},
 }:undefined;
 const plannedChat:ParkChat|undefined=parkContact&&parkPartner?.bench&&manaArea==='park'&&!park.moving&&park.stop===parkBenches[parkContact].meetupStop
  ?{first:parkContact,second:'mana',planned:true,activity:sketchMeetup.current?'sketch':rememberedParkActivity??(lighting==='night'?'stars':parkContact==='luna'?'sketch':'read')}:undefined;
  useParkChat(sheltering?[]:parkedPeople,sheltering?undefined:friendChat??plannedChat,parkChat,setParkChat,completed=>{
  if(friendMeetup&&completed.second!=='mana'){
   onActivity('resident-park-meetup','Friends at the pond',`Luna and Lyra ${parkActivities[completed.activity].outcome}.`,['luna','lyra']);
   setFriendMeetup(undefined);
   return;
  }
  if(meetup!==completed.first)return;
  if(sketchMeetup.current)recordPondSketch('finished');
  else addPhoneMessage(phoneMessage(meetup,'park-completed'));
  sketchMeetup.current=false;
  const name=ROOM_CONTACTS[meetup].name;
  onActivity('park-meetup','Park meetup',`Mana and ${name} ${parkActivities[completed.activity].outcome}.`,['mana',meetup]);
  setMeetup(undefined);
 },groupJoinPending||!!groupJoining);
 const bedtime=()=>{
  const night=roomSleepNight(new Date(),timeZone);
  return night===current.current.skipSleepNight?undefined:night;
 };
 const meetupTick=useRef(()=>{});
 const offerPondSketch=useRef(()=>{});
 offerPondSketch.current=()=>{
  const goal=current.current.pondSketch;
  if(sheltering||!pondSketchDue(goal,new Date(),timeZone)||sleeping||editing||
   meetup||!visitorAvailable||hostPlan||pendingVisitRequest(current.current.phoneMessages??[])||document.visibilityState!=='visible')return;
  if(goal?.status==='invited')startMeetup('luna','park',true);
  else recordPondSketch('invited');
 };
 useEffect(()=>{
  if(!visible||pondSketch?.status==='finished')return;
  const timer=window.setInterval(()=>offerPondSketch.current(),45_000);
  return ()=>clearInterval(timer);
 },[visible,pondSketch?.status]);
 meetupTick.current=()=>{
  if(!meetup)return;
  if(bedtime()||sleeping||(!parkChat?.planned&&Date.now()-meetupRequestedAt.current>=180_000)){cancelMeetup();return;}
  if(editing||returning||parkPaused('mana'))return;
  if(manaArea==='bedroom'){
   if(!active&&!activityRunning.current)walkTo(bedroomDoor,undefined,true,undefined,()=>travel('living'));
  }else if(manaArea==='living'){
   if(livingIdle)leaveHomeForOuting(!cafePartner);
  }else if(cafePartner){
   if(manaArea==='street')startStreetWalk(streetDoors.square,'square');
   else if(manaArea==='square')startStreetWalk(squareDistrictExit,'district');
   else if(manaArea==='district')startStreetWalk(townBuildings.cafe.door,'cafe');
   else if(manaArea==='park')park.leave();
   else if(manaArea!=='cafe'){
    if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
    else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
   }
  }else if(manaArea==='street')startStreetWalk(streetDoors.park,'park');
  else if(manaArea==='park')park.walk(parkBenches[meetup].meetupStop);
  else if(manaArea==='square')leaveSquare();
  else if(manaArea==='district')leaveDistrict();
  else if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
  else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
 };
 useEffect(()=>{
  if(!meetup)return;
  const timer=window.setInterval(()=>meetupTick.current(),1200);
  return ()=>clearInterval(timer);
 },[meetup]);
 const finishCafeMeetup=useRef(()=>{});
 finishCafeMeetup.current=()=>{
  if(!cafePartner)return;
  addPhoneMessage(phoneMessage(cafePartner,'cafe-completed'));
  onActivity('cafe-meetup','Coffee Shop meetup',`Mana and ${ROOM_CONTACTS[cafePartner].name} caught up over a warm drink by the window.`,['mana',cafePartner]);
  setMeetup(undefined);
 };
 useEffect(()=>{
  if(!cafePartnerPresent||manaArea!=='cafe')return;
  const timer=window.setTimeout(()=>finishCafeMeetup.current(),9000);
  return ()=>clearTimeout(timer);
 },[cafePartner,cafePartnerPresent,manaArea]);
 const townGatheringTick=useRef(()=>{});
 townGatheringTick.current=()=>{
  if(editing||sleeping||returning||bedtime()||manaStreetTrip||manaPause||officeTrip||parkPaused('mana'))return;
  if(manaArea==='square'){
   const spot={x:51,y:69};
   if(manaStreetPosition.x!==spot.x||manaStreetPosition.y!==spot.y)startStreetWalk(spot);
  }else if(manaArea==='bedroom'){
   if(!active&&!activityRunning.current)walkTo(bedroomDoor,undefined,true,undefined,()=>travel('living'));
  }else if(manaArea==='living'){
   if(livingIdle)leaveHomeForOuting(true);
  }else if(manaArea==='street')startStreetWalk(streetDoors.square,'square');
  else if(manaArea==='park'){if(!park.moving)park.leave();}
  else if(manaArea==='district')leaveDistrict();
  else if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
  else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
 };
 useEffect(()=>{
  if(!townGathering||!visible)return;
  const timer=window.setInterval(()=>townGatheringTick.current(),1200);
  return ()=>clearInterval(timer);
 },[townGathering,visible]);
 const workshopWorking=useWorkshopActivity(manaArea==='workshop',sleeping||editing,officePosition,!!officeTrip,
  ()=>walkThroughOfficeDoor('workshop','workshop',WORKSHOP_WORK_POINT),
  ()=>onActivity('workshop-tinkering','Workshop','Mana made a little wind-up star at the Workshop.'));
 function doOccasionalRoomActivity(){
  if(coolingDown())return;
  const eveningKey=eveningWindDown(new Date(),timeZone);
  if(eveningKey&&current.current.eveningWindDownDates?.mana!==eveningKey){
   const desk=activities.find(activity=>activity.id==='think')!;
   const tidy:Activity={...desk,eveningKey,label:'Evening tidy-up',doing:'Mana is putting away her desk things for the evening.',done:'Mana put away her desk things for the evening.'};
   walkTo(activityTarget(tidy,objects),tidy,true);return;
  }
  if(eveningKey){
   // Leave the last two minutes quiet rather than begin another long session.
   if(journalClock(new Date(),timeZone).time>='21:58'){setStatus('Mana is winding down quietly before bed.');return;}
   const id=chooseRoomActivity(current.current,new Date(),timeZone,Math.random(),coreForPreferences('mana'),['read','window','remember']);
   const quiet=activities.find(activity=>activity.id===id)!;
   walkTo(activityTarget(quiet,objects),quiet,true);return;
  }
  if(!meetup&&!hostVisit&&!pendingVisitRequest(current.current.phoneMessages??[])){
   const keepsake=pendingKeepsake();
   if(!keepsake){
    const {manaKeepsake,sharedKeepsake}=current.current;
    const chosen=manaKeepsake&&sharedKeepsake?undefined:
     chooseManaKeepsake(events,Math.random(),manaKeepsake?'shared':sharedKeepsake?'solo':undefined);
    if(chosen)saveKeepsake(chosen);
   }else if(keepsake.shared&&!keepsake.shared.answered){
    const {messages,caption}=sharedKeepsakeExchange(keepsake.shared,keepsake.moment);
    const phoneMessages=validatePhone([...(current.current.phoneMessages??[]),...messages]);
    current.current={...current.current,phoneMessages};
    saveKeepsake({...keepsake,caption,shared:{...keepsake.shared,answered:true}});
    setPhoneMessages(phoneMessages);
   }else{
    const spot=activities.find(activity=>activity.id===keepsake.spot);
    if(spot&&!keepsake.revisited){
     const target=activityTarget(spot,objects);
     if(roomRoute(current.current.position,target,objects).length){
      walkTo(target,undefined,true,undefined,()=>{
       saveKeepsake({...keepsake,revisited:true});
       setStatus('Mana revisited the spot for her keepsake.');
      });
      return;
     }
    }else{
     const board=activities.find(activity=>activity.id==='remember')!;
     const target=activityTarget(board,objects);
     if(roomRoute(current.current.position,target,objects).length){
      walkTo(target,board,true);
      return;
     }
    }
   }
  }
  const choiceId=chooseRoomActivity(current.current,new Date(eventClock),timeZone,Math.random(),coreForPreferences('mana'));
  const choice=[...activities,...furnitureActivities(objects,catalog)].find(activity=>activity.id===choiceId);
  if(choice){
   walkTo(activityTarget(choice,objects),choice,true);
  }
 }

 routineTick.current=()=>{
  if(editing||sleeping||returning||leavingForStreet||manaStreetTrip||officeTrip||manaPause||parkPaused('mana')||cafeEncounter||aishiJoining==='tinker')return;
  const night=bedtime();
  if(!night&&(townGathering||meetup||hostVisit||!visitorAvailable&&manaArea==='living'))return;
  const destination=weatherShelterDestination(aishiHangout?.owner==='mana'&&!night?aishiHangoutKinds[aishiHangout.kind].area:manaRoutineDestination(calendar.clock,current.current.phoneMessages??[],!!night),manaArea,sheltering,petBotInvited||petBotLocation.room==='outside');
  if(manaArea===destination){
   if(aishiHangout?.owner==='mana'){if(destination==='park'&&!park.moving&&park.stop!==parkRoamStops[1])park.walk(parkRoamStops[1]);return;}
   if(manaArea==='bedroom'&&!active&&!activityRunning.current){
    if(night)walkTo(activityTarget(bedActivity,objects),bedActivity,true,night);
    else if(homeActivityCycleKey({place:manaArea,destination,slot:routine.key,cooldownUntil:current.current.activityCooldownUntil}))doOccasionalRoomActivity();
   }
   if(manaArea==='office'){
    const target=officeWorkApproach(officePosition,officeLayout);
    if(!target)return;
    if(Math.hypot(officePosition.x-target.x,officePosition.y-target.y)<.1){
     if(!officeWorkTarget||officeWorkTarget.x!==target.x||officeWorkTarget.y!==target.y)setOfficeWorkTarget(target);
    }else if(walkThroughOfficeDoor('office','office',target))setOfficeWorkTarget(target);
    return;
   }
   if(finishedRoutineActivity.current===routine.key)return;
   if(manaArea==='park'&&!park.moving)park.walk(parkRoamStops[0]);
   else if(manaArea==='square')startStreetWalk(squareSpots[0],undefined,true);

   else return;
   finishedRoutineActivity.current=routine.key;
   return;
  }
  if(manaArea==='bedroom'){
   if(!active&&!activityRunning.current)walkTo(bedroomDoor,undefined,true,undefined,()=>travel('living'));
   return;
  }
  if(manaArea==='living'){
   if(livingIdle){
    if(destination==='bedroom')travel('bedroom');
    else leaveHomeForOuting(destination==='park'||destination==='square');
   }
   return;
  }
  const secondStreet=isTownBuilding(destination)&&townBuildingStreet(destination)==='district';
  if(manaArea==='street'){
   const door=destination==='living'||destination==='bedroom'?'living':destination==='park'?'park':'square';
   startStreetWalk(streetDoors[door],door);
  }else if(manaArea==='square'){
   if(destination==='town-hall')startStreetWalk(townBuildings['town-hall'].door,'town-hall');
   else if(secondStreet)startStreetWalk(squareDistrictExit,'district');
   else leaveSquare();
  }else if(manaArea==='district'){
   if(secondStreet)startStreetWalk(townBuildings[destination].door,destination);
   else leaveDistrict();
  }else if(manaArea==='park'){
   if(!park.moving)park.leave();
  }else if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
  else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
 };
 useEffect(()=>{
  if(!visible)return;
  const tick=()=>{if(document.visibilityState==='visible')routineTick.current();};
  const timer=window.setInterval(tick,1800);
  document.addEventListener('visibilitychange',tick);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[visible]);

 useEffect(()=>{
  if(!sleeping)return;
  const check=()=>{
   if(current.current.sleep&&roomSleepNight(new Date(),timeZone)!==current.current.sleep.night)wake();
  };
  check();
  const timer=window.setInterval(check,15_000);
  document.addEventListener('visibilitychange',check);
  return ()=>{
   window.clearInterval(timer);
   document.removeEventListener('visibilitychange',check);
  };
 },[sleeping,timeZone]);

 useEffect(()=>{
  const update=()=>setLighting(roomLighting(new Date(),timeZone));
  update();
  if(!visible)return;
  const timer=window.setInterval(update,15_000);
  document.addEventListener('visibilitychange',update);
  return ()=>{
   window.clearInterval(timer);
   document.removeEventListener('visibilitychange',update);
  };
 },[timeZone,visible]);

 useEffect(()=>{
  for(const src of new Set([...walkFrames,...idleFrames,...activities.flatMap(activity=>activityFrames(activity.id))]))new Image().src=src;
  return ()=>{
   cancelAnimationFrame(frame.current);
  };
 },[]);

 useEffect(()=>{
  if(!effectSummary.length)return;
  const timer=window.setTimeout(()=>setEffectSummary([]),6500);
  return ()=>window.clearTimeout(timer);
 },[effectSummary]);

 useEffect(()=>{
  if(!activityReaction)return;
  const timer=window.setTimeout(()=>setActivityReaction(undefined),14_000);
  return ()=>window.clearTimeout(timer);
 },[activityReaction]);

 useEffect(()=>{
  if(!editing)return;
  editPausedAt.current=performance.now();
  return ()=>{
   pausedTime.current+=performance.now()-(editPausedAt.current??performance.now());
   editPausedAt.current=undefined;
  };
 },[editing]);

 const invitation=pendingVisitRequest(phoneMessages);
 const lastInvitationAt=latestVisitRequest(phoneMessages)?.at;
 useEffect(()=>{
  if(!visible||editing||sleeping||!visitorAvailable||invitation||hostPlan||meetup||friendMeetup)return;
  const lastHostAt=[...phoneMessages].reverse().find(message=>message.kind==='host-invite'||message.kind==='library-story-invite')?.at;
  const lastRequestAt=(lastHostAt??'')>(lastInvitationAt??'')?lastHostAt:lastInvitationAt;
  const due=lastRequestAt?Date.parse(lastRequestAt)+30*60_000:Date.now()+60_000;
  const schedule=()=>{
   clearTimeout(timer);
   if(document.visibilityState==='visible')timer=window.setTimeout(()=>{
    if(!phoneCanSend(new Date(),timeZone,!!current.current.sleep)||eveningWindDown(new Date(),timeZone)){timer=window.setTimeout(schedule,60_000);return;}
    const messages=current.current.phoneMessages??[];
    const lastHostInvite=[...messages].reverse().find(message=>message.kind==='host-invite'||message.kind==='library-story-invite');
    const inviteToTheirPlace=!lastHostInvite||lastHostInvite.at<=(lastInvitationAt??'');
    const previous=inviteToTheirPlace?lastHostInvite:latestVisitRequest(messages);
    const pair=chooseFriendshipPair(current.current.sharedMemories??[],residentIds.map(second=>({first:'mana' as const,second})));
    const contact=(pair?.second as RoomContact|undefined)??(previous?.contact==='luna'?'lyra':'luna');
    const memories=current.current[residentProfiles[contact].memory.visitKey];
    addPhoneMessage(phoneMessage(contact,inviteToTheirPlace?'host-invite':memories?.includes('beanbag-chat')?'beanbag-request':'visit-request'));
   },Math.max(1000,due-Date.now()));
  };
  let timer=0;
  schedule();
  document.addEventListener('visibilitychange',schedule);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
 },[visible,editing,sleeping,timeZone,visitorAvailable,invitation?.at,lastInvitationAt,hostPlan?.at,meetup,friendMeetup,phoneMessages]);

 const hostVisitTick=useRef(()=>{});
 const progressLibraryStory=useRef(()=>{});
 progressLibraryStory.current=()=>{
  const now=new Date();
  const story=current.current.libraryStory;
  const messages=current.current.phoneMessages??[];
  if(document.visibilityState!=='visible'||editing||!phoneCanSend(now,timeZone,sleeping)||eveningWindDown(now,timeZone)||awayVisitor==='lyra'||lyraOuting||!libraryStoryDue(story,now,timeZone))return;
  if(!story){recordLibraryStory('drafted');return;}
  if(!sleeping&&!meetup&&visitorAvailable&&!pendingHostVisit(messages)&&!pendingVisitRequest(messages)){
   addPhoneMessage(phoneMessage('lyra','library-story-invite'));
  }
 };
 useEffect(()=>{
  if(!visible||libraryStory?.stage==='finished')return;
  const timer=window.setInterval(()=>progressLibraryStory.current(),30_000);
  return ()=>clearInterval(timer);
 },[visible,libraryStory?.stage]);
 hostVisitTick.current=()=>{
  const visit=pendingHostVisit(current.current.phoneMessages??[]);
  if(!visit||!visitIsDue(visit)||bedtime()||sleeping||editing||returning||meetup)return;
  const destination=ROOM_CONTACTS[visit.contact].home;
  const hostOutside=visit.contact==='luna'?lunaOuting:lyraOuting;
  if(hostOutside||awayVisitor===visit.contact||!visitorAvailable)return;
  if(!visit.confirmed){
   addPhoneMessage(phoneMessage(visit.contact,'host-accepted'));
   return;
  }
  if(manaArea===destination)return;
  if(manaArea==='bedroom'){
   if(!active&&!activityRunning.current)walkTo(bedroomDoor,undefined,true,undefined,()=>travel('living'));
  }else if(manaArea==='living'){
   if(livingIdle)leaveHomeForOuting(false);
  }else if(manaArea==='street')startStreetWalk(streetDoors[destination],destination);
  else if(manaArea==='park')park.leave();
  else if(manaArea==='square')leaveSquare();
  else if(manaArea==='district')leaveDistrict();
  else if(isTownBuilding(manaArea)||isOfficeRoom(manaArea))leaveTownBuilding(manaArea);
  else if(manaArea==='library'||manaArea==='luna-home')leaveResidentHome(manaArea);
 };
 useEffect(()=>{
  if(!hostVisit||!visible)return;
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')hostVisitTick.current();},1200);
  return ()=>clearInterval(timer);
 },[hostVisit?.at,visible]);
 const hostMeeting=hostVisit?.confirmed&&manaArea===ROOM_CONTACTS[hostVisit.contact].home&&
  !(hostVisit.contact==='luna'?lunaOuting:lyraOuting)&&awayVisitor!==hostVisit.contact&&!sleeping;
 const residentHome=manaArea==='library'||manaArea==='luna-home'?manaArea:undefined;
 const homeContact=residentHome==='library'?'lyra':'luna';
 const residentAway=!!residentHome&&(awayVisitor===homeContact||!!(homeContact==='lyra'?lyraOuting:lunaOuting));
 const activeHomeVisit=hostVisit?.contact===homeContact;
 useEffect(()=>{
  if(!residentHome||(!residentAway&&activeHomeVisit))return;
  const timer=window.setTimeout(()=>leaveResidentHome(residentHome),residentAway?3500:12_000);
  return ()=>clearTimeout(timer);
 },[residentHome,residentAway,activeHomeVisit]);
 const finishHostVisit=useRef(()=>{});
 finishHostVisit.current=()=>{
  if(!hostVisit||!hostMeeting||bedtime())return;
  const name=ROOM_CONTACTS[hostVisit.contact].name;
  if(hostVisit.kind==='library-story-invite'){
   recordLibraryStory('finished');
   addPhoneMessage({...phoneMessage('lyra','host-completed'),detail:libraryStoryText});
   onActivity('library-founding-story','The framed note',libraryStoryText,['mana','lyra']);
   return;
  }
  addPhoneMessage(phoneMessage(hostVisit.contact,'host-completed'));
  onActivity('host-visit','Visit',`Mana visited ${name} at ${manaversePlaces[manaArea]}.`,['mana',hostVisit.contact]);
 };
 useEffect(()=>{
  if(!hostMeeting)return;
  const timer=window.setTimeout(()=>finishHostVisit.current(),hostVisit?.kind==='library-story-invite'?20_000:12_000);
  return ()=>clearTimeout(timer);
 },[hostMeeting,hostVisit?.at]);

 const acceptVisit=useRef(()=>{});
 const canArrive=useRef(false);
 canArrive.current=visitorAvailable&&!sleeping&&!editing;
 acceptVisit.current=()=>{
  const request=pendingVisitRequest(current.current.phoneMessages??[]);
  if(!request||!visitIsDue(request)||!visitorAvailable||bedtime()||(request.contact==='luna'?lunaOuting:lyraOuting))return;
  const arrive=()=>{
   const pending=pendingVisitRequest(current.current.phoneMessages??[]);
   if(!pending||pending.at!==request.at||!visitIsDue(pending)||!canArrive.current||bedtime())return;
   travel('living');
   addPhoneMessage(phoneMessage(request.contact,request.kind==='home-invite'?'home-invite-accepted':'visit-accepted'));
   setPhoneVisit({contact:request.contact});
  };
  if(manaArea==='living')arrive();
  else walkTo(bedroomDoor,undefined,true,undefined,arrive);
 };
 const freeForVisit=!aishiHangout&&visible&&!editing&&!sleeping&&!returning&&!meetup&&!hostVisit&&visitorAvailable&&
  (manaArea==='bedroom'?!activityRunning.current:manaArea==='living'&&!leavingForStreet&&livingIdle);
 useEffect(()=>{
  if(!invitation||!freeForVisit)return;
  let timer=0;
  const schedule=()=>{
   clearTimeout(timer);
   if(document.visibilityState==='visible')timer=window.setTimeout(()=>acceptVisit.current(),
    Math.max(3500,Date.parse(invitation.scheduledFor??invitation.at)-Date.now()));
  };
  schedule();
  document.addEventListener('visibilitychange',schedule);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
 },[invitation?.at,invitation?.scheduledFor,freeForVisit,active,idleCycle]);
 useEffect(()=>{
  if(!sleeping||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const timer=window.setInterval(()=>setPoseFrame(index=>index+1),160);
  return ()=>window.clearInterval(timer);
 },[sleeping]);



 function walkTo(target:RoomPosition,activity?:Activity,automatic=false,sleepNight?:string,onArrival?:()=>void){
  if(manaArea!=='bedroom'||activityRunning.current||current.current.sleep||editing)return;
  cancelAnimationFrame(frame.current);
  setIdleCycle(cycle=>cycle+1);
  setActive(true);
  setResting(null);
  setMemory(null);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const origin=current.current.position;
  const route=roomRoute(origin,target,objects);
  if(!route.length){setSprite(idle);setStatus('Mana could not find a path there.');setActive(false);return;}
  activityRunning.current=!!activity;
  const stopWalking=()=>{
   saveRoom(current.current);
   setSprite(idle);
   setActive(false);
  };
  const finish=()=>{
   current.current={...current.current,position:target};
   setPosition(target);
   if(onArrival){stopWalking();onArrival();return;}
   if(!activity){stopWalking();return;}
   saveRoom(current.current);
   setFacing(activity.facing*(objects.find(object=>object.id===activity.object)?.mirrored?-1:1));
   setStatus(activity.doing);
   setResting(activity.id==='sleep'||activity.id==='bed'?activity.object:null);
   if(sleepNight&&bedtime()===sleepNight){
    current.current={...current.current,sleep:{night:sleepNight,startedAt:new Date().toISOString()}};
    activityRunning.current=false;
    saveRoom(current.current);
    setSleeping(true);
    onActivity('bedtime','Bedtime','Mana went to bed for the night.');
    return;
   }
   const sprites=activityFrames(activity.id),began=roomNow();
   setSprite(sprites[0]);
   const animate=()=>{
    const elapsed=roomNow()-began;
    if(elapsed<(activity.eveningKey?EVENING_TIDY_MS:ROOM_TIMING.activity)){
     if(!reducedMotion)setSprite(sprites[Math.floor(elapsed/170)%sprites.length]);
     frame.current=requestAnimationFrame(animate);
     return;
    }
    if(activity.eveningKey){
     activityRunning.current=false;setActive(false);setResting(null);setSprite(idle);setStatus(activity.done);
     finishEvening('mana',activity.eveningKey,activity.done);return;
    }
    const {energy:updatedEnergy,stats,changes}=completeRoomActivity(current.current,activity.id);
    const wallet=current.current.shop??emptyRoomShop();
    const updatedShop={...wallet,coins:Math.min(9999,wallet.coins+5)};
    current.current={...recordFurnitureUse(current.current,activity.id),lastActivity:activity.id,energy:updatedEnergy,
     shop:updatedShop,effectStats:stats,
     activityCooldownUntil:new Date(Date.now()+ROOM_TIMING.homePause).toISOString(),
     ...(activity.id==='water'?{wateredAt:new Date().toISOString()}:{} )};
    saveRoom(current.current);
    setShop(updatedShop);
    setEnergy(updatedEnergy);
    setEffectSummary(changes);
    setFavorite(favoriteRoomActivity(current.current));
    setResting(null);
    setSprite(idle);
    activityRunning.current=false;
    setActive(false);
    if(activity.id==='remember'){
     const keepsake=pendingKeepsake();
     if(automatic&&keepsake&&(!keepsake.spot||keepsake.revisited)&&(!keepsake.shared||keepsake.shared.answered)&&!bedtime()){
      saveKeepsake({...keepsake,pinned:true});
      setStatus('Mana pinned a keepsake to her photo board.');
      onActivity(keepsake.shared?'shared-keepsake':'mana-keepsake','Photo board keepsake',`Mana pinned a keepsake: ${keepsake.moment}`);
      return;
     }
     const episode=[...episodes].sort((a,b)=>Number(b.kind==='special')-Number(a.kind==='special')||Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
     const saved=[...memories].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
     if(!automatic&&episode)setMemory({title:episode.source.title,content:episode.content});
     else if(!automatic&&saved)setMemory({title:'Saved memory',content:saved.content});
     else if(!automatic&&(current.current.manaKeepsake?.pinned||current.current.sharedKeepsake?.pinned))setMemory({title:'Photo board',content:''});
     setStatus(episode||saved?'Mana revisited a memory.':'There are no saved memories to revisit yet.');
     const outcome=episode?`Mana revisited a saved memory titled “${episode.source.title}”.`
      :saved?'Mana revisited a saved memory.':'Mana looked at the photo board.';
     onActivity('remember','Photo board',outcome);
    }else{
     setStatus(activity.done);
     onActivity(activity.id,activity.label,activity.done);
    }
   };
   frame.current=requestAnimationFrame(animate);
  };
  setStatus(onArrival?'Mana is walking to the living space exit.':activity?`Mana is walking to the ${activity.object}.`:'');
  if(reducedMotion){finish();return;}
  const legs=route.map((end,index)=>{
   const start=index===0?origin:route[index-1];
   const a=roomPoint(start),b=roomPoint(end);
   return {start,end,dx:b.x-a.x,duration:Math.max(1,walkTravelMs(a,b))};
  });
  const started=roomNow();
  let index=0,elapsedBeforeLeg=0;
  const advance=()=>{
   const now=roomNow();
   const elapsed=now-started;
   while(index<legs.length&&elapsed-elapsedBeforeLeg>=legs[index].duration){
    elapsedBeforeLeg+=legs[index].duration;
    index++;
   }
   if(index===legs.length){finish();return;}
   const {start,end,dx,duration}=legs[index];
   if(Math.abs(dx)>1)setFacing(dx<0?-1:1);
   const t=(elapsed-elapsedBeforeLeg)/duration;
   const point={u:start.u+(end.u-start.u)*t,v:start.v+(end.v-start.v)*t};
   current.current.position=point;
   setPosition(point);
   setSprite(reducedMotion?idle:walkFrames[Math.floor(elapsed/145)%walkFrames.length]);
   frame.current=requestAnimationFrame(advance);
  };
  frame.current=requestAnimationFrame(advance);
 }

 function wake(){
  const sleep=current.current.sleep;
  if(!sleep)return;
  const updatedEnergy=100;
  current.current={...current.current,sleep:undefined,lastActivity:'bed',energy:updatedEnergy};
  saveRoom(current.current);
  setEnergy(updatedEnergy);
  setResting(null);
  setSleeping(false);
  setActive(false);
  setStatus('Mana woke up.');
  onActivity('wake','Wake-up','Mana woke up after bedtime.');
 }

 function tryPlacement(id:string,dx:number,dy:number,mirrored=!!draft?.[id]?.mirrored){
  const next={...draft};
  const piece=catalog.find(item=>item.id===id);
  if(dx||dy||piece||mirrored)next[id]={dx,dy,...(mirrored?{mirrored:true as const}:{})};
  else delete next[id];
  if(!dx&&!dy&&Object.keys(next).length===0)return {placements:next};
  const arranged=arrangedRoom(next,shop);
  const problem=roomPlacementProblem(id,arranged);
  if(problem)return {placements:next,problem};
  if(piece){
   const otherObjects=arranged.filter(object=>object.id!==id);
   const box=arranged.find(object=>object.id===id)!.footprint!;
   if(activities.some(activity=>{
    const point=roomPoint(activityTarget(activity,otherObjects));
    return point.x>box.left&&point.x<box.right&&point.y>box.top&&point.y<box.bottom;
   }))return {placements:next,problem:'Leave room for Mana to use the nearby furniture.'};
  }
  const center=roomPosition(400,445,arranged);
  const exit=roomDropPosition(homeThresholds.bedroomToLiving,arranged);
  if(!exit||!roomRoute(center,exit,arranged).length)return {placements:next,problem:'Leave the living-space doorway and its approach clear.'};
  if([...activities,...furnitureActivities(arranged,catalog)].some(activity=>!roomRoute(center,activityTarget(activity,arranged),arranged).length)){
   return {placements:next,problem:'Leave a path to each activity.'};
  }
  return {placements:next};
 }

 function acceptPlacement(move:ReturnType<typeof tryPlacement>){
  if(!move.problem)setDraft(move.placements);
  setEditMessage(move.problem??'');
 }

 function placeCatalogPiece(piece:RoomCatalogPiece){
  if(!draft||draft[piece.id])return;
  for(const {dx,dy} of roomCatalogOffsets(piece)){
   const move=tryPlacement(piece.id,dx,dy);
   if(move.problem)continue;
   acceptPlacement(move);
   setSelected(piece.id);
   setEditMessage(`${piece.name} placed. Drag it to adjust.`);
   return;
  }
  setEditMessage('No clear spot found. Move or store a piece to make space.');
 }

 function storeCatalogPiece(id:string){
  const next={...draft};
  delete next[id];
  setDraft(next);
  if(selected===id)setSelected('');
  setEditMessage('Piece returned to the catalog.');
 }

 function moveFurniture(event:PointerEvent<HTMLButtonElement>){
  const move=editDrag.current,bounds=scene.current?.getBoundingClientRect();
  if(!move||move.pointer!==event.pointerId||!bounds)return;
  const dx=Math.round(move.dx+(event.clientX-move.x)*799/bounds.width);
  const dy=Math.round(move.dy+(event.clientY-move.y)*698/bounds.height);
  if(!move.move&&dx===move.dx&&dy===move.dy)return;
  const offset=move.move?.placements[move.id];
  if(move.move&&(offset?.dx??0)===dx&&(offset?.dy??0)===dy)return;
  move.move=tryPlacement(move.id,dx,dy);
  setPreview(move.move);
 }

 function finishFurniture(event:PointerEvent<HTMLButtonElement>,cancelled=false){
  const move=editDrag.current;
  if(!move||move.pointer!==event.pointerId)return;
  editDrag.current=null;
  setPreview(null);
  if(!cancelled&&move.move)acceptPlacement(move.move);
 }

 function finishEditing(save:boolean){
  backgroundBusy.current++;
  setBackgroundJob(false);
  generation.current++;
  setDesign(undefined);
  setShopOpen(false);
  editDrag.current=null;
  setPreview(null);
  setEditMessage('');
  if(save&&draft){
   cancelAnimationFrame(frame.current);
   activityRunning.current=false;
   setActive(false);
   setResting(null);
   setSprite(idle);
   setMemory(null);
   const point=roomPoint(current.current.position);
   const position=roomPosition(point.x,point.y,arrangedRoom(draft,shop));
   current.current={...current.current,position,placements:draft,finishes:draftFinishes,pieceColors:draftColors,background:draftBackground,backgrounds};
   saveRoom(current.current);
   setPlacements(draft);
   setPosition(position);
   setStatus('Room arrangement saved.');
  }
  setDraft(null);
  onEditingChange(false);
  requestAnimationFrame(()=>editButton.current?.focus());
 }

 function saveShop(next:RoomShop){
  current.current={...current.current,shop:next};
  saveRoom(current.current);
  setShop(next);
 }
 async function stockFurniture(request:RoomDesign,image:ImageAttachment){
  const run=generation.current;
  try{
   const piece=await prepareShopPiece(image,'shop-'+uid(),request.name);
   if(generation.current!==run)return;
   const latest=current.current.shop??emptyRoomShop();
   if(latest.pieces.length>=ROOM_SHOP_LIMIT)throw Error('The furniture shop is full.');
   saveShop({...latest,pieces:[...latest.pieces,piece]});
   setShopStatus(`${piece.name} is ready to buy.`);
  }catch(error){
   if(generation.current===run)setShopStatus(error instanceof Error?error.message:String(error));
  }finally{
   if(generation.current===run)setDesign(undefined);
  }
 }

 async function previewBackground(image:ImageAttachment){
  const run=backgroundBusy.current;
  try{
   const background=await prepareRoomBackground(image,backgroundReference);
   if(run!==backgroundBusy.current)return;
   const library=backgrounds.includes(background)?backgrounds:[...backgrounds,background];
   current.current={...current.current,backgrounds:library};
   saveRoom(current.current);
   setBackgrounds(library);
   setDraftBackground(background);
   setBackgroundStatus('Added to your library. Save room to apply it.');
  }catch(error){
   if(run===backgroundBusy.current)setBackgroundStatus(error instanceof Error?error.message:String(error));
  }finally{
   if(run===backgroundBusy.current)setBackgroundJob(false);
  }
 }
 const restOffset=resting?placements?.[resting]:undefined;
 const restObject=resting?objects.find(object=>object.id===resting):undefined;
 const originalRestObject=resting?ROOM_OBJECTS.find(object=>object.id===resting):undefined;
 const restPoint=resting==='chair'?{x:632,y:390}:resting==='bed'?{x:143,y:444}:null;
 const point=restObject?.activity==='sleep'&&restObject.footprint
  ?{x:restObject.x+restObject.width/2,y:restObject.footprint.bottom-5}:restPoint
  ?{x:restObject?.mirrored&&originalRestObject?restObject.x+restObject.width-(restPoint.x-originalRestObject.x):restPoint.x+(restOffset?.dx??0),
   y:restPoint.y+(restOffset?.dy??0)}:roomPoint(position);
 const depth=Math.max(sharedRoomActorDepth(point),restObject?sharedRoomFurnitureDepth(restObject)+1:0);
 const displayedSprite=sleeping?activityFrames('bed')[poseFrame%3]:sprite;
 const roomActivities=[...activities,...furnitureActivities(objects,catalog)];
 const stationTab=station==='desk'?'projects':'published';
 const energyState=roomEnergyState(energy,resting!==null);
 const mood=roomMood(energy,effectStats);
 const statsPanel=<details className="companion-room-effect-stats">
    <summary aria-label={`Mood ${mood.label}, Energy ${energy}, Focus ${effectStats.focus}, Happiness ${effectStats.happiness}. Show skill totals`}>
     <span title={mood.label} aria-hidden="true">{mood.face}</span>
     <span title={`Energy · ${energyState}`} aria-hidden="true">⚡ {energy}</span>
     <span title="Focus" aria-hidden="true">🎯 {effectStats.focus}</span>
     <span title="Happiness" aria-hidden="true">♥ {effectStats.happiness}</span>
    </summary>
    <div className="companion-room-skill-totals">Knowledge {effectStats.knowledge} · Gaming {effectStats.gaming}</div>
   </details>;
 const finishes=editing?draftFinishes:current.current.finishes??DEFAULT_ROOM_FINISHES;
 const colors=editing?draftColors:current.current.pieceColors;
 const selectedPiece=displayedObjects.find(object=>object.id===selected);
 const stationProjects=station?projects.filter(project=>!!project.publishedAt===(station==='table')):[];
 function openStationProject(projectId?:string){
  setStation(null);
  onOpenGameDev({tab:stationTab,projectId});
 }
 const dropOutdoor=(scene:'street'|'square'|'district',character:StreetCharacter,point:StreetPoint)=>{
  const valid=scene==='street'?isStreetFloor:isSquareFloor;
  if(!(scene==='district'?isDistrictFloor:valid)(point)||paused(character))return;
  if(character==='mana'){
   if(manaArea===scene&&!manaStreetTrip&&!meetup&&!hostVisit)setManaStreetPosition(point);
  }else if(character==='luna'&&meetup!=='luna')dropLunaOuting(point);
  else if(character==='lyra'&&meetup!=='lyra')dropLyraOuting(point);
 };
 function residentMapActivity(contact:RoomContact,outing:typeof lunaOuting):NonNullable<MapCharacters[RoomContact]>{
  const location=residentMapArea(contact,outing);
  const home=ROOM_CONTACTS[contact].home;
  const name=ROOM_CONTACTS[contact].name;
  const parkResident=contact==='luna'?lunaPark:lyraPark;
  const activity=aishiHangout?.owner===contact?`${name} is ${aishiHangout.phase==='sharing'?'spending time with Aishi':'on the way to meet Aishi'}.`:sheltering&&outing&&!outing.trip&&(outing.inLibrary||outing.cafeStage==='inside')?`${name} is sheltering from the weather.`:
   friendMeetup?`${name} is ${location==='park'?'spending time at the pond with':'on the way to meet'} ${ROOM_CONTACTS[contact==='luna'?'lyra':'luna'].name}.`:
   awayVisitor===contact?`${name} is visiting Mana.`:
   cafeEncounter===contact?`${name} is sharing the window table with Mana.`:
   parkResident?.bench?.label??(outing?.trip?`${name} is walking.`:
   townGathering&&location==='square'?`${name} is at the town gathering.`:
   !outing?(contact==='luna'?lunaHomeActivity:lyraHomeActivity):undefined);
  const travellingTo:ManaverseArea|undefined=outing?.trip&&(
   outing.returning?home:outing.goingToPark?'park':outing.goingToLibrary?'library':
   outing.goingToSquare?'square':outing.cafeStage==='to-cafe'?'cafe':undefined);
  const next=aishiHangout?.owner===contact?(location===aishiHangoutKinds[aishiHangout.kind].area?undefined:{place:aishiHangoutKinds[aishiHangout.kind].area}):sheltering?(outing&&!outing.inLibrary&&outing.cafeStage!=='inside'?{place:home}:undefined):friendMeetup&&location!=='park'?{place:'park' as const}:travellingTo?{place:travellingTo}:
   townGathering&&location!=='square'?{place:'square' as const}:
   townGathering?undefined:outing||awayVisitor===contact?{place:home}:nextResidentStop(contact,calendar.clock.time,calendar.clock.date);
  return {location,activity,next};
 }
 const manaDoor=manaStreetTrip?.door==='square-from-district'?'square':manaStreetTrip?.door;
 const weatherTarget=weatherShelterDestination(aishiHangout?.owner==='mana'&&!bedtime()?aishiHangoutKinds[aishiHangout.kind].area:manaRoutineDestination(calendar.clock,phoneMessages,!!bedtime()),manaArea,sheltering,petBotInvited||petBotLocation.room==='outside');
 const livingHomeCycle=homeActivityCycleKey({place:manaArea,destination:weatherTarget,slot:routine.key,
  cooldownUntil:current.current.activityCooldownUntil,night:!!bedtime(),
  busy:!visible||editing||sleeping||returning||leavingForStreet||townGathering||!!meetup||!!hostVisit||!!friendMeetup||!visitorAvailable});
 // Keep one choice for this cycle; normal rerenders must not reroll her walk.
 const livingHomeChoice=useMemo(()=>livingHomeCycle?chooseRoomActivity(current.current,new Date(),timeZone,Math.random(),coreForPreferences('mana'),['water','read','sleep']):undefined,[livingHomeCycle]);
 const manaNext=aishiHangout?.owner==='mana'?(manaArea===aishiHangoutKinds[aishiHangout.kind].area?undefined:{place:aishiHangoutKinds[aishiHangout.kind].area}):sheltering?(manaDoor?{place:manaDoor}:manaArea!==weatherTarget?{place:weatherTarget}:undefined):townGathering?(manaArea==='square'?undefined:{place:'square' as const}):
  manaDoor?{place:manaDoor}:manaArea!==routine.place&&!meetup&&!hostVisit?{place:routine.place}:
  !meetup&&!hostVisit?nextManaStop(calendar.clock.time,manaArea,calendar.clock.date):undefined;
 const officeWorking=manaArea==='office'&&!officeTrip&&!!officeWorkTarget&&
  Math.hypot(officePosition.x-officeWorkTarget.x,officePosition.y-officeWorkTarget.y)<.1;
 const manaActivity=sleeping?'Mana is asleep.':aishiHangout?.owner==='mana'?`Mana is ${aishiHangout.phase==='sharing'?'spending time with Aishi':'on the way to meet Aishi'}.`:manaStreetTrip||officeTrip?'Mana is walking.':
  sheltering&&weatherTarget===manaArea?`Mana is staying indoors during ${weather.kind==='snow'?'steady snowfall':'the rain'}.`:
  cafeEncounter?`Mana is sharing the window table with ${ROOM_CONTACTS[cafeEncounter].name}.`:
  officeWorking?'Mana is working at a workstation.':
  townGathering&&manaArea==='square'?'Mana is at the town gathering.':
  manaArea==='workshop'&&workshopWorking?'Mana is tinkering at the workbench.':
  manaArea==='living'?livingActivity:manaArea==='bedroom'&&active?status:
  manaArea==='park'&&park.moving?'Mana is walking around the park.':undefined;
 const availableJoin:AishiActivity|undefined=aishiHangout?.phase==='sharing'?'read':friendMeetup?groupJoining?.activity:!sheltering&&dive.playerArea==='park'&&lunaPark?.bench&&!parkPaused('luna')?'sketch':
  dive.playerArea==='library'&&lyraHomeActivity==='Lyra is reading by the window.'&&!lyraOuting&&awayVisitor!=='lyra'?'read':
  dive.playerArea==='workshop'&&manaArea==='workshop'&&!officeTrip&&Math.hypot(officePosition.x-WORKSHOP_WORK_POINT.x,officePosition.y-WORKSHOP_WORK_POINT.y)<.1&&!sleeping&&!meetup&&!hostVisit&&!townGathering?'tinker':undefined;
 const hangouts=useAishiHangouts({hangout:aishiHangout,setHangout:setAishiHangout,root:dive.root,lease:invitationRequest,timeZone,ready:manaSpeechReady,
  enabled:visible&&!editing&&!sleeping&&dive.active,busy:townGathering||!!meetup||!!friendMeetup||!!hostVisit||!!hostPlan||!!invitation||!!visitorPreparing||!!awayVisitor||!!aishiInvitation||!!manaSpeechRoom,
  sheltering,area:dive.playerArea,point:dive.playerPoint,walking:dive.walking,joining:!!aishiJoining,
  ownerReady:(owner,destination)=>owner==='mana'?manaArea===destination&&!manaStreetTrip&&!officeTrip&&(destination!=='park'||!park.moving&&park.stop===parkRoamStops[1]):destination==='park'?!!(owner==='luna'?lunaPark:lyraPark)?.bench:(owner==='luna'?lunaOuting:lyraOuting)?.cafeStage==='inside',
  context:owner=>`Current town time: ${calendar.clock.date} ${calendar.clock.time}. Current location: ${owner==='mana'?manaArea:residentMapArea(owner,owner==='luna'?lunaOuting:lyraOuting)}. ${owner==='mana'?(officeWorking?'Working at the office.':workshopWorking?'Tinkering at the workbench.':status):owner==='luna'?lunaHomeActivity:lyraHomeActivity}. Existing schedules, work and bedtime take priority.`,
  ask:onAskAishiHangout,go:dive.go,join:scene=>dive.joinActivity('read',scene),stop:dive.stopJoining,
  onComplete:hangout=>{const result=completedAishiHangout(hangout);onActivity(result.action,result.title,result.outcome,['aishi',hangout.owner]);}
 });
 const smallFavor=useSmallFavors({room:current,lease:invitationRequest,root:dive.root,timeZone,ready:manaSpeechReady,allowOffers:!nearbyHangoutOffer&&!aishiHangout&&!eveningWindDown(new Date(),timeZone),
  enabled:!nearbyHangoutOffer&&!aishiHangout&&visible&&!editing&&!sleeping&&!bedtime()&&!townGathering&&!friendMeetup&&!meetup&&!hostVisit&&!aishiInvitation&&!manaSpeechRoom,
  available:availableJoin,area:dive.playerArea,point:dive.playerPoint,walking:dive.walking,joining:aishiJoining,
  choose:onChooseInvitation,join:activity=>dive.joinActivity(activity),onComplete:(action,title,outcome,owner)=>{
   rememberTogether(action,title,outcome,['aishi',owner]);recordActivity(action,title,outcome);
  }});
 function freeForAishiCheckIn(contact:TownPersonalGoal['owner']){
  if(contact==='mana')return !manaStreetTrip&&!officeTrip&&!officeWorking&&!workshopWorking&&!active&&!(manaArea==='park'&&park.moving);
  const outing=contact==='luna'?lunaOuting:lyraOuting,visitor=contact==='luna'?lunaPark:lyraPark;
  return !outing?.trip&&!outing?.homeExit&&!outing?.libraryLeaving&&(!outing?.inPark||!!visitor?.bench)&&(!outing?.cafeStage||outing.cafeStage==='inside');
 }
 const aishiPhone=useAishiPhone({room:current,enabled:visible&&!editing&&dive.active,ready:manaSpeechReady&&phoneCanSend(new Date(),timeZone),canReply:()=>phoneCanSend(new Date(),timeZone),reply:onAishiPhoneReply,
  proactive:{enabled:!sleeping&&!sheltering&&!eveningWindDown(new Date(),timeZone)&&!nearbyHangoutOffer&&!aishiHangout&&!aishiJoining&&!hangouts.pending&&!smallFavor.favor&&!townGathering&&!meetup&&!friendMeetup&&!hostVisit&&!hostPlan&&!invitation&&!visitorPreparing&&!awayVisitor&&!aishiInvitation&&!manaSpeechRoom,lease:invitationRequest,free:freeForAishiCheckIn,write:onAishiPhoneCheckIn},
  context:contact=>`Town time: ${calendar.clock.date} ${calendar.clock.time}. Your current location: ${contact==='mana'?manaArea:residentMapArea(contact,contact==='luna'?lunaOuting:lyraOuting)}. Current activity: ${contact==='mana'?manaActivity:residentMapActivity(contact,contact==='luna'?lunaOuting:lyraOuting).activity}. Aishi is texting remotely; no physical meeting is implied.`
 });
 const previousAishiOffer=useRef<CharacterHangoutOffer|undefined>(undefined);
 useEffect(()=>{
  const previous=previousAishiOffer.current;
  if(previous&&(!nearbyHangoutOffer||aishiOfferId(previous)!==aishiOfferId(nearbyHangoutOffer)))aishiPhone.invitationStatus(aishiOfferId(previous),'expired');
  if(nearbyHangoutOffer)aishiPhone.rememberOffer(nearbyHangoutOffer);
  previousAishiOffer.current=nearbyHangoutOffer;
 },[nearbyHangoutOffer]);
 const characterInvitations=useCharacterHangoutInvitations({
  enabled:visible&&!editing&&!sleeping&&dive.active&&!sheltering&&!projectReaction&&!activityReaction&&!aishiHangout&&!aishiJoining&&!hangouts.pending&&!smallFavor.favor&&!townGathering&&!meetup&&!friendMeetup&&!hostVisit&&!hostPlan&&!invitation&&!visitorPreparing&&!awayVisitor&&!aishiInvitation&&!manaSpeechRoom,
  ready:manaSpeechReady,timeZone,walking:dive.walking,room:current,root:dive.root,lease:invitationRequest,
  offer:nearbyHangoutOffer,setOffer:setNearbyHangoutOffer,
  free:freeForAishiCheckIn,
  context:owner=>`Current town time: ${calendar.clock.date} ${calendar.clock.time}. Current location: ${owner==='mana'?manaArea:residentMapArea(owner,owner==='luna'?lunaOuting:lyraOuting)}. Existing schedules, work, visits, bedtime and shelter take priority.`,
  choose:onChooseInvitation,start:hangouts.acceptOffer
 });
 function acceptCharacterInvitation(){
  const offer=nearbyHangoutOffer;if(!offer)return;
  const accepted=characterInvitations.accept();aishiPhone.invitationStatus(aishiOfferId(offer),accepted?'accepted':'expired');
 }
 function declineCharacterInvitation(){
  if(nearbyHangoutOffer)aishiPhone.invitationStatus(aishiOfferId(nearbyHangoutOffer),'declined');
  characterInvitations.decline();
 }
 const {groupJoinPoint,askToJoinGroup,groupReplySpeaker,invitationSpeaker}=useSocialActivities({
  smallFavorActive:!!smallFavor.favor,favorCooldownUntil:smallFavor.cooldownUntil,windDown:!!nearbyHangoutOffer||!!aishiHangout||!!eveningWindDown(new Date(),timeZone),
  state:social,room:current,visible,editing,sleeping,night:!!bedtime(),manaSpeechReady,lighting,sheltering,
  hasTownEvent:calendar.active.length>0,townGathering,visitorAvailable,awayVisitor,visitorPreparing,
  hostPlan:!!hostPlan,invitation:!!invitation,cafeEncounter,friendChat,dive,availableJoin,sharedMemories,
  personalGoals,onChooseInvitation,onAskGroupToJoin,startMeetup,
 });
 const characterInvitationSpeaker=nearbyHangoutOffer?dive.root.current?.querySelector(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${hangoutName(nearbyHangoutOffer.owner)}"])`):undefined;
 const botRoom=petBotLocation.room;
 useEffect(()=>{
  if(!livingGuest){metDuringVisit.current=undefined;return;}
  if(botRoom!=='living'||sleeping||metDuringVisit.current===livingGuest)return;
  metDuringVisit.current=livingGuest;
  const next=meetPetBotFriend(current.current.petBotFriends??{},livingGuest);
  current.current={...current.current,petBotFriends:next};
  saveRoom(current.current);
  setPetBotFriends(next);
 },[livingGuest,botRoom,sleeping]);
 const botDestination=sleeping?'bedroom':manaArea==='living'&&leavingForStreet&&petBotInvited?'outside':
  manaArea==='bedroom'||manaArea==='living'?manaArea:petBotInvited?'outside':botRoom==='outside'?'living':botRoom;
 const botExit=botRoom===botDestination||botRoom==='outside'?undefined:botRoom==='bedroom'?homeThresholds.bedroomToLiving:
  botDestination==='bedroom'?homeThresholds.livingToBedroom:homeThresholds.livingToStreet;
 const petBotListening=!sleeping&&!!petBotCue&&botRoom==='living'&&manaArea==='living';
 const petBotCueLine=useSceneLine(visible&&petBotListening?
  petBotCue==='invite'?'NPC conversation: You and Pet Bot are at home. You have decided to take Pet Bot for a walk. Tell Pet Bot directly that you two are about to go for a walk.':
   'NPC conversation: You and Pet Bot just returned home. Tell Pet Bot directly that it can go back to roaming around inside.':undefined);
 useEffect(()=>{
  if(!petBotCue)return;
  if(sleeping){setPetBotCue(undefined);setPetBotInvited(false);return;}
  const timer=window.setTimeout(()=>{
   if(petBotCue==='invite'){
    setPetBotInvited(petBotListening);
    setLeavingForStreet(true);
   }
   setPetBotCue(undefined);
  },!petBotListening?25_000:petBotCueLine?2400:6500);
  return ()=>window.clearTimeout(timer);
 },[petBotCue,petBotListening,petBotCueLine,sleeping]);
 const outdoorPet=useOutdoorPetWalk(botRoom==='outside',now=>{
  if(botDestination!=='outside')return {area:'street',point:streetDoors.living,goingHome:true};
  if(manaArea==='living')return {area:'street',point:streetDoors.living};
  if(manaArea==='park'&&park.walker)return {area:'park',point:park.walker.point};
  if(manaArea==='street'||manaArea==='square'||manaArea==='district'){
   const inConversation=encounter?.scene===manaArea&&[encounter.first,encounter.second].includes('mana');
   const point=inConversation?(encounter.first==='mana'?encounter.a:encounter.b):
    manaStreetTrip&&!manaPause?streetPositionAt(manaStreetTrip,now):manaStreetPosition;
   return {area:manaArea,point};
  }
  const outside:OutdoorArea=isTownBuilding(manaArea)?townBuildingStreet(manaArea):isOfficeRoom(manaArea)?'district':'street';
  return {area:outside,point:manaversePassage(manaArea,outside)?.entry??manaStreetPosition};
 },()=>{
  setPetBotLocation({room:'living',entry:homeThresholds.livingToStreet});
  if(!sleeping)setPetBotCue('home');
 });
 const homeBot=botRoom!=='outside'?<PetBotChat
  objects={botRoom==='living'?livingFurnishings:objects} entry={petBotLocation.entry} exit={botExit} editing={editing} pause={petBotListening}
  bedtime={sleeping} returnToCharge={sleeping&&botRoom==='bedroom'}
  characterChatOpen={manaSpeechRoom===botRoom} onOpen={()=>setManaSpeechRoom(undefined)}
  onArrive={()=>{
   if(botRoom===botDestination)return;
   if(botRoom==='bedroom')setPetBotLocation({room:'living',entry:homeThresholds.livingToBedroom});
   else if(botDestination==='bedroom')setPetBotLocation({room:'bedroom',entry:homeThresholds.bedroomToLiving});
   else if(botDestination==='outside')setPetBotLocation({room:'outside'});
  }}
  visitor={botRoom==='living'&&!sleeping?livingGuest??undefined:undefined}
  roomContext={townWeatherContext(weather)+'\n'+(sleeping?'Mana is asleep in her bedroom. Keep quiet.':manaArea==='bedroom'?status:manaArea==='living'?livingActivity||'Mana is in the living space.':'Mana is away from home.')+
   petBotFriendContext(petBotFriends,botRoom==='living'&&!sleeping?livingGuest??undefined:undefined)}
  memory={petBotMemory} ready={petBotReady&&visible&&!editing&&area===botRoom} onReply={onPetBotReply} onMemory={fact=>{
   const next=validateCoreMemories([...(current.current.petBotMemory??[]),fact]);
   current.current={...current.current,petBotMemory:next};
   saveRoom(current.current);
   setPetBotMemory(next);
  }}/>:null;
 const mapCharacters:MapCharacters={
  mana:{location:manaArea,activity:manaActivity,next:manaNext},
  luna:residentMapActivity('luna',lunaOuting),
  lyra:residentMapActivity('lyra',lyraOuting),
  aishi:dive.playerArea?{location:dive.playerArea,activity:groupJoining?`Aishi is ${groupJoining.activity==='sketch'?'sketching':'reading'} with Luna and Lyra by the park pond.`:aishiJoining?aishiActivities[aishiJoining].activity:'You’re exploring Manaverse.'}:undefined,
 };
 const canSpeakHere=visible&&!editing&&!sleeping&&area===manaArea;
 function saveResidentMemories(resident:RoomContact,memories:string[]){
  const {coreKey}=residentProfiles[resident].memory;
  current.current={...current.current,[coreKey]:memories};
  saveRoom(current.current);
  setResidentMemories(previous=>({...previous,[resident]:memories}));
 }

 const residentChat=(resident:RoomContact)=>visible?{
  ready:manaSpeechReady,
  onSend:async(message:string,context:string,onReply:(text:string)=>void,signal:AbortSignal)=>{
   const result=await onResidentRoomChat(resident,message,`${townWeatherContext(weather)}\n${context}`,signal);
   signal.throwIfAborted();
   if(result.memory&&result.reply){
    const {coreKey,limit}=residentProfiles[resident].memory;
    saveResidentMemories(resident,validateCoreMemories([...(current.current[coreKey]??[]),result.memory],limit));
   }
   onReply(result.reply);
  },
 }:undefined;
 const petCueHere=area==='living'&&petBotListening&&petBotCue;
 const sceneLine=petCueHere?(petBotCueLine??(petCueHere==='invite'?'Mana is inviting Pet Bot for a walk.':'Mana is asking Pet Bot to roam at home.')):activityLine;
 const activitySpeaker=sceneLine&&manaSpeechRoom!==area?dive.root.current?.querySelector('.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with Mana"])'):undefined;
 const projectSpeaker=projectLine&&projectReaction?.area===area?dive.root.current?.querySelector(`.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${projectReaction.owner==='mana'?'Mana':residentProfiles[projectReaction.owner].name}"])`):undefined;
 const toggleManaSpeech=(place:'bedroom'|'living')=>setManaSpeechRoom(previous=>previous===place?undefined:place);
 const manaSpeech=(place:'bedroom'|'living',x:number,y:number,context:string,fallback?:string)=><ManaRoomSpeech
  open={manaSpeechRoom===place} onClose={()=>setManaSpeechRoom(undefined)} ready={manaSpeechReady}
  anchor={{'--thought-x':`${x/799*100}%`,'--thought-y':`${y/698*100}%`} as CSSProperties}
  context={`${townWeatherContext(weather)}\n${context}`} fallback={fallback} onThought={onManaThought} onChat={onManaRoomChat}/>;
 const interiors:TownInterior[]=area!=='cafe'&&(isTownBuilding(area)||isOfficeRoom(area))?['cafe',area]:['cafe'];
 return <TownWeatherProvider weather={weather} settings={weatherSettings} onChange={changeWeather} active={visible&&!editing} indoors={!isOutdoorMap(area)}><CharacterNightLighting.Provider value={lighting==='night'}><ScenePanContext.Provider value={()=>setFollowMana(false)}><section ref={dive.root} className="companion-room" tabIndex={dive.active?0:undefined}
  onPointerDownCapture={event=>{if(!(event.target as Element).closest('[data-scene-editor]'))dive.onPointerDown(event);}}
  onPointerUpCapture={event=>{if(!(event.target as Element).closest('[data-scene-editor]'))dive.onPointerUp(event);}}
  onKeyDown={event=>{if(!(event.target as Element).closest('[data-scene-editor]'))dive.onKeyDown(event);}} data-weather={weather.kind} data-lighting={lighting} data-editing={editing} style={{'--scene-zoom':editing?1:zoom} as CSSProperties} aria-labelledby="companion-room-title">
  <header className="drawer-head">
   <h2 id="companion-room-title" ref={editorTitle} tabIndex={-1}>{editing?'Room editor':manaversePlaces[area]}</h2>{!editing&&<span className="town-weather-status" role="status">{townWeatherLabel(weather)}{sheltering?" · indoor shelter":""}</span>}
   {!editing&&<button type="button" className="btn" onClick={()=>{
    if(dive.active){dive.diveOut();setFollowMana(true);setArea(manaArea);}
    else{setFollowMana(false);dive.diveIn();}
   }}>{dive.active?'Dive out':'Dive in'}</button>}
   {!editing&&!dive.active&&<button className="btn" aria-pressed={followMana} onClick={()=>setFollowMana(value=>!value)}>Auto focus</button>}
   {!editing&&<SceneZoomControls zoom={zoom} onZoom={changeZoom}/>}
   {canSpeakHere&&(area==='bedroom'||area==='living')&&<button type="button" className="btn" aria-pressed={manaSpeechRoom===area} onClick={()=>{
    setStation(null);setMemory(null);toggleManaSpeech(area);
   }}>Talk to Mana</button>}
   {!editing&&favorite&&<span className="companion-room-energy">Favorite {ROOM_ACTIVITY_FURNITURE[favorite]}</span>}
   {editing?<div className="companion-room-editor-actions">
    <button className="btn" disabled={!!preview||backgroundJob} onClick={()=>{setDraft({});setDraftFinishes(DEFAULT_ROOM_FINISHES);setDraftColors({});setDraftBackground(undefined);setBackgroundStatus('');setSelected('');setEditMessage('Legacy arrangement ready to save.');}}>Reset to legacy layout</button>
    <button className="btn" disabled={!!preview} onClick={()=>finishEditing(false)}>Cancel</button>
    <button className="btn primary" disabled={!!preview||backgroundJob} onClick={()=>finishEditing(true)}>Save room</button>
   </div>:!dive.active&&area==='bedroom'&&manaArea==='bedroom'&&<button ref={editButton} className="btn" onClick={()=>{
    setDraft({...placements});setDraftFinishes(current.current.finishes??DEFAULT_ROOM_FINISHES);
    setDraftColors({...current.current.pieceColors});setDraftBackground(current.current.background);setBackgroundStatus('');onEditingChange(true);
    setSelected('');setEditMessage('');setStation(null);
   }}>Edit room</button>}
  </header>
  {dive.avatar}
  {!nearbyHangoutOffer&&!projectLine&&activitySpeaker&&createPortal(<p className="manaverse-player-greeting scene-activity-line" role="status">{sceneLine}</p>,activitySpeaker)}
  {!nearbyHangoutOffer&&projectSpeaker&&createPortal(<p className="manaverse-player-greeting scene-project-line" role="status">{projectLine}</p>,projectSpeaker)}
  {visible&&!editing&&!sleeping&&!sheltering&&area==='square'&&<BirthdayCelebration events={calendar.active} visits={guestbookVisits} root={dive.root.current}
   present={([...manaAtGathering?['mana' as const]:[],...lunaAtGathering?['luna' as const]:[],...lyraAtGathering?['lyra' as const]:[]])}
   onWish={(event,speaker)=>{
    const previous=current.current.townGuestbook??[];
    const updated=recordBirthdayWish(previous,event,speaker);if(updated===previous)return;
    current.current={...current.current,townGuestbook:updated};saveRoom(current.current);setGuestbookVisits(updated);
   }}/>} 
  <WeatherReactions root={dive.root} area={area} characters={mapCharacters} timeZone={timeZone}
   active={visible&&!nearbyHangoutOffer&&!editing&&!mapOpen&&!manaSpeechRoom&&!sceneLine&&!meetup&&!friendMeetup&&!hostMeeting&&!petBotListening}/>
  {characterInvitationSpeaker&&nearbyHangoutOffer&&createPortal(<p className="manaverse-player-greeting scene-invitation-line" role="status">{nearbyHangoutOffer.text}</p>,characterInvitationSpeaker)}
  {invitationSpeaker&&aishiInvitation&&createPortal(<p className="manaverse-player-greeting scene-invitation-line" role="status">{aishiInvitation.text}</p>,invitationSpeaker)}
  {groupReplySpeaker&&groupJoinReply&&createPortal(<p className="manaverse-player-greeting scene-invitation-line" role="status">{groupJoinReply.text}</p>,groupReplySpeaker)}
  {dive.active&&<div className="manaverse-player-activity-controls">
   <AishiHangoutPanel offer={nearbyHangoutOffer} onAccept={acceptCharacterInvitation} onDecline={declineCharacterInvitation} hangout={aishiHangout} nearby={hangouts.nearby} pending={hangouts.pending} message={hangouts.message} ready={manaSpeechReady} onInvite={(owner,kind)=>void hangouts.invite(owner,kind)} onCancel={()=>hangouts.cancel()}/>
   <SmallFavorPanel favor={smallFavor.favor} speaker={smallFavor.speaker} onAccept={smallFavor.accept} onAnswer={smallFavor.answer} onDismiss={smallFavor.dismiss}/>
   {groupJoinError&&groupJoinPoint&&<p role="status">{groupJoinError}</p>}
   {(groupJoinPoint||groupJoinPending)&&!aishiJoining&&<button type="button" className="btn" disabled={groupJoinPending||!manaSpeechReady} onClick={()=>void askToJoinGroup()}>{groupJoinPending?'Asking…':'Ask to join'}</button>}
   {aishiInvitation&&<button type="button" className="btn" onClick={()=>setAishiInvitation(undefined)}>Not now</button>}
   <p className="manaverse-player-controls" role="status">{dive.notice||'Click clear floor or use arrow keys to walk. Use doors to explore.'}</p>
   {aishiJoining?<button className="btn" type="button" onClick={()=>{smallFavor.dismiss();dive.stopJoining();}}>Leave activity</button>:
    availableJoin&&!smallFavor.favor&&<button className="btn" type="button" onClick={()=>dive.joinActivity(availableJoin)}>{aishiActivities[availableJoin].label}</button>}
  </div>}
  <div className="companion-room-status-bar" hidden={editing}>
   {statsPanel}
   <AishiPhone visible={visible&&!editing&&dive.active} state={aishiPhone.state} ready={manaSpeechReady&&phoneCanSend(new Date(),timeZone)} busy={aishiPhone.busy} status={aishiPhone.status} timeZone={timeZone}
    characters={mapCharacters} area={dive.playerArea??area} calendar={{townEventClock:calendar.clock,customTownEvents,onAddTownEvent:addTownEvent,onUpdateTownEvent:editTownEvent,onDeleteTownEvent:removeTownEvent}} memories={sharedMemories}
    offer={nearbyHangoutOffer} hangout={aishiHangout} onAccept={acceptCharacterInvitation} onDecline={declineCharacterInvitation} onEnd={()=>hangouts.cancel()} onMapOpenChange={setMapOpen} onChooseArea={enterView} onSend={aishiPhone.send} onRead={aishiPhone.markRead}/>
   <RoomPhone activityKeepsakes={activityKeepsakes} birthdayVisits={guestbookVisits} onStartTownProject={personalGoals.start} preferenceSummaries={freeTimePreferences.summaries} today={{
    characters:mapCharacters,activeEvents:calendar.active,goals:personalGoals.goals,
    meetup:meetup?{contact:meetup,place:meetupPlace}:undefined,
    friends:friendMeetup?{host:friendMeetup.host,activity:friendMeetup.activity,ready:!!friendChat,joining:!!groupJoining}:undefined,
    offer:aishiInvitation?{owner:aishiInvitation.choice.owner,activity:aishiInvitation.choice.activity,text:aishiInvitation.text}:undefined,
   }} personalGoals={personalGoals.goals} visible={!editing&&!dive.active} backgroundActive={visible&&!editing} sleeping={sleeping} messages={phoneMessages} events={events} projects={projects}
    area={area} characters={mapCharacters} onChooseArea={enterView} diving={dive.active} onMapOpenChange={setMapOpen}
    meetup={meetup} meetupPlace={meetupPlace} pondSketch={pondSketch}
    manaKeepsake={manaKeepsake} sharedKeepsake={sharedKeepsake} libraryStory={libraryStory}
    manaMemories={memories} onForgetManaMemory={onForgetManaMemory} sharedMemories={sharedMemories} onForgetSharedMemory={id=>{
     const next=(current.current.sharedMemories??[]).filter(memory=>memory.id!==id);
     current.current={...current.current,sharedMemories:next};
     saveRoom(current.current);
     setSharedMemories(next);
    }} petBotFriends={petBotFriends} onForgetPetFriend={contact=>{
     const next={...(current.current.petBotFriends??{})};
     delete next[contact];
     current.current={...current.current,petBotFriends:next};
     saveRoom(current.current);
     setPetBotFriends(next);
    }} petBotMemories={petBotMemory} onForgetPetMemory={fact=>{
     const next=(current.current.petBotMemory??[]).filter(memory=>memory!==fact);
     current.current={...current.current,petBotMemory:next};
     saveRoom(current.current);
     setPetBotMemory(next);
    }} coreMemories={residentMemories} onForgetMemory={(resident,fact)=>{
     const key=residentProfiles[resident].memory.coreKey;
     saveResidentMemories(resident,(current.current[key]??[]).filter(memory=>memory!==fact));
    }} onSend={addPhoneMessage} readMessages={phoneReadMessages} onReadMessages={markPhoneRead} timeZone={timeZone}/>
  </div>
  {editing&&<aside className="companion-room-edit-sidebar" aria-label="Room editing controls">
   <div className="companion-room-finishes">
   <label>Walls <select value={draftFinishes.wall} onChange={event=>{
    const wall=ROOM_WALL_FINISHES.find(finish=>finish===event.target.value);
    if(wall)setDraftFinishes(previous=>({...previous,wall}));
   }}>{ROOM_WALL_FINISHES.map(finish=><option key={finish}>{finish}</option>)}</select></label>
   <label>Floor <select value={draftFinishes.floor} onChange={event=>{
    const floor=ROOM_FLOOR_FINISHES.find(finish=>finish===event.target.value);
    if(floor)setDraftFinishes(previous=>({...previous,floor}));
   }}>{ROOM_FLOOR_FINISHES.map(finish=><option key={finish}>{finish}</option>)}</select></label>
   </div>
   <details className="companion-room-catalog">
    <summary>Room backgrounds</summary>
    <button className="btn" disabled={!canGenerateFurniture||!!design||backgroundJob||backgrounds.length>=ROOM_BACKGROUND_LIMIT} onClick={()=>{
     backgroundBusy.current++;
     setBackgroundStatus('');
     setBackgroundJob(true);
    }}>Generate empty room</button>
    <label>Background library
     <select disabled={backgroundJob} value={draftBackground?backgrounds.indexOf(draftBackground):''} onChange={event=>{
      setDraftBackground(event.target.value===''?undefined:backgrounds[Number(event.target.value)]);
      setBackgroundStatus('');
     }}>
      <option value="">Default cartoon room</option>
      {backgrounds.map((background,index)=><option key={index} value={index}>Generated room {index+1}</option>)}
     </select>
    </label>
    {draftBackground&&<button className="btn" disabled={backgroundJob||draftBackground===current.current.background} onClick={()=>{
     const library=backgrounds.filter(background=>background!==draftBackground);
     current.current={...current.current,backgrounds:library};
     saveRoom(current.current);
     setBackgrounds(library);
     setDraftBackground(undefined);
     setBackgroundStatus('Background removed from the library.');
    }}>Remove previewed background</button>}
    {backgrounds.length>=ROOM_BACKGROUND_LIMIT&&<p className="hint-soft">Library full. Remove an unused background to make space.</p>}
    {backgroundJob&&<ImageGenerationDrawer inline initialRequest={{backend:'qwen',prompt:ROOM_BACKGROUND_PROMPT}}
     objectDimensions={{width:800,height:704}}
     prepareObjectReference={signal=>prepareFurnitureReference({reference:'roombg.webp'},signal)}
     available={canGenerateFurniture} beforeGenerate={beforeFurnitureGeneration} onGenerated={image=>void previewBackground(image)}
     onFailure={message=>{setBackgroundStatus(message);setBackgroundJob(false);}}
     onClose={()=>{backgroundBusy.current++;setBackgroundJob(false);}} onStopped={()=>{backgroundBusy.current++;setBackgroundJob(false);}}
     showSave={false} onSave={()=>{}}/>}
    {backgroundStatus&&<p role="status">{backgroundStatus}</p>}
   </details>
   <div className="companion-room-piece-controls">
    <label>Piece color <select disabled={!selectedPiece||!!preview} value={draftColors[selected]??'Original'} onChange={event=>{
     const color=ROOM_PIECE_COLORS.find(option=>option===event.target.value);
     if(!color)return;
     setDraftColors(previous=>{
      const next={...previous};
      if(color==='Original')delete next[selected];
      else next[selected]=color;
      return next;
     });
    }}>{ROOM_PIECE_COLORS.map(color=><option key={color}>{color}</option>)}</select></label>
    <button className="btn" disabled={!!preview||!selectedPiece?.footprint}
     aria-pressed={!!draft?.[selected]?.mirrored} onClick={()=>{
      const {dx=0,dy=0,mirrored}=draft?.[selected]??{};
      acceptPlacement(tryPlacement(selected,dx,dy,!mirrored));
     }}>Mirror piece</button>
   </div>
   <nav className="companion-room-shop-tabs" aria-label="Room furniture">
    <button className="btn" aria-pressed={!shopOpen} disabled={!!design} onClick={()=>setShopOpen(false)}>Catalog</button>
    <button className="btn" aria-pressed={shopOpen} onClick={()=>setShopOpen(true)}>Furniture shop</button>
   </nav>
   {shopOpen?<section className="companion-room-catalog" aria-label="Furniture shop">
    <p><strong>Mana’s coins · {shop.coins}</strong></p>
    <p className="hint-soft">Mana earns 5 coins for each completed furniture activity.</p>
    <label>Generation category
     <select value={shopCategory} disabled={!!design} onChange={event=>{
      const category=ROOM_SHOP_CATEGORIES.find(option=>option===event.target.value);
      setShopCategory(category??'Any category');
     }}>
      <option>Any category</option>
      {ROOM_SHOP_CATEGORIES.map(category=><option key={category}>{category}</option>)}
     </select>
    </label>
    <button className="btn primary companion-room-generate-furniture" disabled={!!design||backgroundJob||!canGenerateFurniture||shop.pieces.length>=ROOM_SHOP_LIMIT} onClick={()=>{
     generation.current++;
     setShopStatus('');
     setDesign(chooseRoomDesign(shopCategory,shop.pieces));
    }}>Let Mana create furniture</button>
    {!canGenerateFurniture&&<p className="hint-soft">Furniture generation is available when Mana’s other work is idle.</p>}
    {shop.pieces.length>=ROOM_SHOP_LIMIT&&<p className="hint-soft">The shop holds up to {ROOM_SHOP_LIMIT} designs. Dismiss a listing or remove a stored purchase to make room.</p>}
    {design&&<ImageGenerationDrawer inline initialRequest={{backend:'qwen',prompt:furniturePrompt(design.description)}} available={canGenerateFurniture}
     prepareObjectReference={signal=>prepareFurnitureReference(design,signal)}
     beforeGenerate={beforeFurnitureGeneration} onGenerated={image=>void stockFurniture(design,image)}
     onFailure={message=>{setDesign(undefined);setShopStatus(message);}}
     onClose={()=>{generation.current++;setDesign(undefined);}} onStopped={()=>{generation.current++;setDesign(undefined);}}
     showSave={false} onSave={()=>{}}/>}
    {shopStatus&&<p role="status">{shopStatus}</p>}
    <div className="companion-room-catalog-grid">
     {shop.pieces.filter(piece=>!piece.owned).map(piece=><div className="companion-room-catalog-piece" key={piece.id}>
      <img src={piece.image} alt=""/><strong>{piece.name}</strong>
      <button className="btn" disabled={shop.coins<ROOM_SHOP_PRICE} onClick={()=>{
       const latest=current.current.shop??emptyRoomShop();
       const next=buyRoomPiece(latest,piece.id);
       if(next!==latest){saveShop(next);setShopStatus(`${piece.name} is now in the room catalog.`);}
      }}>Buy · {ROOM_SHOP_PRICE} coins</button>
      <button className="btn" onClick={()=>{
       const latest=current.current.shop??emptyRoomShop();
       saveShop({...latest,pieces:latest.pieces.filter(item=>item.id!==piece.id||item.owned)});
      }}>Dismiss</button>
     </div>)}
    </div>
   </section>:<section className="companion-room-catalog" aria-labelledby="room-catalog-title">
   <h3 id="room-catalog-title">Furniture and plants</h3>
   <div className="companion-room-catalog-grid">
    {catalog.map(piece=>{
     const placed=!!draft?.[piece.id];
     return <div className="companion-room-catalog-piece" key={piece.id} data-room-object={piece.id}>
      <img src={roomPieceImage(piece.image)} data-piece-color={colors?.[piece.id]} alt="" draggable={false}/>
      <span>{piece.name}</span>
      <button className="btn" disabled={!!preview} aria-label={`${placed?'Store':'Place'} ${piece.name}`}
       onClick={()=>placed?storeCatalogPiece(piece.id):placeCatalogPiece(piece)}>{placed?'Store':'Place'}</button>
      {piece.id.startsWith('shop-')&&!placed&&!placements?.[piece.id]&&
       <button className="btn" aria-label={`Remove ${piece.name} from catalog without a refund`} onClick={()=>{
        const latest=current.current.shop??emptyRoomShop();
        const pieceColors={...current.current.pieceColors};
        delete pieceColors[piece.id];
        current.current={...current.current,pieceColors};
        setDraftColors(previous=>{const next={...previous};delete next[piece.id];return next;});
        saveShop({...latest,pieces:latest.pieces.filter(item=>item.id!==piece.id)});
        setEditMessage(`${piece.name} was removed from the catalog.`);
       }}>Remove</button>}
     </div>;
    })}
   </div>
   </section>}
  </aside>}
  <LivingSpace onVisitorPresent={setLivingGuest} petBot={botRoom==='living'?homeBot:null} position={current.current.livingPosition??livingSpaceEntry}
   renderSpeech={canSpeakHere&&area==='living'?(feet,activity)=>manaSpeech('living',feet.x,feet.y-145,`You are in your living space. ${activity}`):undefined}
   phoneVisit={phoneVisit} onVisitAvailability={setVisitorAvailable} onManaIdle={setLivingIdle} onActivityStatus={setLivingActivity}
   onVisitorAway={setAwayVisitor} onVisitorPreparing={contact=>{setVisitorPreparing(contact);if(!contact)setVisitorAtDoor(null);}} visitorAtDoor={visitorAtDoor} onStreetGuest={setStreetGuest}
   scheduledActivity={livingHomeCycle} scheduledKind={livingHomeChoice==='water'?'water':livingHomeChoice==='read'?'read':'sleep'} onActivityDone={(id,label)=>{
    const {energy:updatedEnergy,stats,changes}=completeRoomActivity(current.current,id);
    const wallet=current.current.shop??emptyRoomShop();
    const updatedShop={...wallet,coins:Math.min(9999,wallet.coins+5)};
    current.current={...recordFurnitureUse(current.current,id),lastActivity:id,energy:updatedEnergy,
     shop:updatedShop,effectStats:stats,
     activityCooldownUntil:new Date(Date.now()+ROOM_TIMING.homePause).toISOString(),
     ...(id==='water'?{wateredAt:new Date().toISOString()}:{})};
    saveRoom(current.current);
    setShop(updatedShop);
    setEnergy(updatedEnergy);
    setEffectSummary(changes);
    setFavorite(favoriteRoomActivity(current.current));
    const outcome=id==='water'?'Mana watered the living space plant.':id==='read'?'Mana finished reading in the living space.':'Mana finished resting by the beanbag.';
    onActivity(id,label,outcome);
   }}
   shown={area==='living'} present={manaArea==='living'} onBedroom={()=>enterView('bedroom')} onStreet={()=>enterView('street')}
   sleeping={sleeping} memories={{luna:current.current.lunaVisitMemories?.[0],lyra:current.current.lyraVisitMemories?.[0]}} onRemember={(contact,memory)=>{
    if(memory==='beanbag-chat')rememberTogether('beanbag-chat-'+contact,'Beanbag chat',`Mana and ${residentProfiles[contact].name} chatted by the beanbag.`,['mana',contact]);
    if(memory==='quiet-company'){
     const outcome=`Mana and ${residentProfiles[contact].name} spent a quiet break together by the beanbag.`;
     rememberTogether('quiet-company-'+contact,'Quiet companionship',outcome,['mana',contact]);
     recordActivity('quiet-company-'+contact,'Quiet companionship',outcome);
    }
    const key=residentProfiles[contact].memory.visitKey;
    const memories=[memory,...(current.current[key]??[])].slice(0,LUNA_VISIT_MEMORY_LIMIT);
    current.current={...current.current,[key]:memories};
    saveRoom(current.current);
    if(memory!=='quiet-company')addPhoneMessage(phoneMessage(contact,memory==='beanbag-chat'?'chat-followup':'sleep-followup'));
   }}
   returning={returning||leavingForStreet} streetExit={leavingForStreet} onReturn={arrived=>{
    setReturning(false);
    setLeavingForStreet(false);
    if(!arrived)return;
    if(leavingForStreet){enterStreet('living');return;}
    const position=bedroomDoor;
    current.current={...current.current,position};
    saveRoom(current.current);
    setPosition(position);
    setStatus('Mana is looking around.');
    setManaArea('bedroom');
   }}
   onPosition={livingPosition=>{current.current={...current.current,livingPosition};saveRoom(current.current);}}/>
  {area==='street'&&<ManaverseStreet petBot={botRoom==='outside'&&outdoorPet.area===area?outdoorPet:undefined} follow={followMana} onDrop={(id,point)=>dropOutdoor('street',id,point)} manaPosition={manaArea==='street'?manaStreetPosition:undefined}
   manaTrip={manaStreetTrip} visitor={streetGuest} residents={streetResidents} encounter={encounter?.scene==='street'?encounter:undefined} door={enterView}/>}
  {area==='square'&&<ManaverseStreet petBot={botRoom==='outside'&&outdoorPet.area===area?outdoorPet:undefined} follow={followMana} onDrop={(id,point)=>dropOutdoor('square',id,point)} square decorations={townDecorations} calendarDate={calendar.clock.date} activeEvents={calendar.active} eventTitle={calendar.active.map(event=>event.title).join(' · ')} manaPosition={manaArea==='square'?manaStreetPosition:undefined}
   manaTrip={manaStreetTrip} residents={squareResidents} encounter={encounter?.scene==='square'?encounter:undefined}
   door={enterView} onStreet={()=>enterView('street')} onDistrict={()=>enterView('district')} onBuilding={enterView}/>}
  {area==='district'&&<ManaverseStreet petBot={botRoom==='outside'&&outdoorPet.area===area?outdoorPet:undefined} follow={followMana} onDrop={(id,point)=>dropOutdoor('district',id,point)} district manaPosition={manaArea==='district'?manaStreetPosition:undefined}
   manaTrip={manaStreetTrip} residents={districtResidents} door={enterView}
   onStreet={()=>enterView('square')} onBuilding={enterView}/>}
  {interiors.map(building=><DistrictInterior key={building} building={building} shown={area===building} manaPresent={manaArea===building}
   officeLayout={officeLayout} onSaveOfficeLayout={(next:OfficeLayout)=>{
    current.current={...current.current,officeLayout:next};
    saveRoom(current.current);
    setOfficeLayout(next);
   }}
   officeWorking={building==='office'&&officeWorking}
   workshopWorking={building==='workshop'&&manaArea==='workshop'&&(workshopWorking||aishiJoining==='tinker')}
   onManaDrop={manaArea===building&&!meetup&&!hostVisit&&!sleeping?setOfficePosition:undefined} onManaPosition={setOfficePosition}
   officePosition={officePosition} officeTrip={officeTrip?.room===building?officeTrip:undefined}
   follow={followMana} onPan={()=>setFollowMana(false)} openOfficeRoom={enterView}
   cafeResidents={cafeResidents} cafeLeaving={cafeLeaving} onCafeExit={contact=>contact==='luna'?leaveLunaCafe():leaveLyraCafe()} cafeEncounter={cafeEncounter} cafeChat={manaArea==='cafe'&&cafePartnerPresent?cafePartner:undefined}
   exit={()=>enterView(isOfficeRoom(building)?officeRooms[building].parent:townBuildingStreet(building))} noticePlans={{decorationSettings:townDecorations,onDecorationChange:changeTownDecorations,messages:phoneMessages,meetup,meetupPlace,meetupStarted:!!parkChat?.planned||manaArea==='cafe'&&cafePartnerPresent,sleeping,timeZone,townEventClock:calendar.clock,customTownEvents,onAddTownEvent:addTownEvent,onUpdateTownEvent:editTownEvent,onDeleteTownEvent:removeTownEvent,guestbookEntries}}/>)}
  {area==='park'&&<ManaversePark aishiReading={aishiHangout?.phase==='sharing'&&aishiHangout.kind==='read'?aishiHangout.owner:undefined} petBot={botRoom==='outside'&&outdoorPet.area==='park'?outdoorPet:undefined} onManaDrop={!meetup&&!hostVisit&&!park.moving?park.drop:undefined} walker={park.walker} residents={[lunaPark,lyraPark]} chat={parkChat} follow={followMana} onPan={()=>setFollowMana(false)}
   exit={()=>enterView('street')}/>}
  <ResidentRoom onActivityDone={(resident,pose)=>personalGoals.record(`home-${resident}-${Date.now()}`,`home-${pose}`,`${residentProfiles[resident].name} completed a ${pose} session at home.`,[resident])} eveningCompleted={eveningDates.lyra} onEveningComplete={finishEvening} preferences={freeTimePreferences.preferences} coreMemories={coreForPreferences('lyra')} preferredPose={personalGoals.preferred('lyra')} keepsake={displayKeepsakes.find(keepsake=>keepsake.owner==='lyra')} resident="lyra" sharingActivity={aishiJoining==='read'&&!groupJoining&&!aishiHangout} onActivityStatus={setLyraHomeActivity} shown={area==='library'||area==='lyra-room'} upstairs={area==='lyra-room'} onStairs={()=>enterView(area==='lyra-room'?'library':'lyra-room')} away={awayVisitor==='lyra'} outdoors={!!lyraOuting&&!lyraOuting.homeExit} leavingHome={!!lyraOuting?.homeExit||visitorPreparing==='lyra'} onResidentExit={()=>visitorPreparing==='lyra'?setVisitorAtDoor('lyra'):leaveLyraHome()} timeZone={timeZone} manaPresent={manaArea==='library'} lunaVisiting={!!lunaOuting?.inLibrary} lunaLeaving={lunaOuting?.libraryLeaving} onLunaExit={()=>{
    if(!lyraOuting&&awayVisitor!=='lyra')rememberTogether('luna-library-visit','Library visit','Luna visited Lyra at the library.',['luna','lyra']);
    leaveLunaLibrary();
   }}
   chat={residentChat('lyra')}
   storyLine={hostMeeting&&hostVisit?.kind==='library-story-invite'?libraryStoryText:undefined}
   manaLeaving={residentExit==='library'} onManaExit={()=>finishResidentExit('library')}
   onStreet={()=>enterView('street')}/>
  <ResidentRoom onActivityDone={(resident,pose)=>personalGoals.record(`home-${resident}-${Date.now()}`,`home-${pose}`,`${residentProfiles[resident].name} completed a ${pose} session at home.`,[resident])} eveningCompleted={eveningDates.luna} onEveningComplete={finishEvening} preferences={freeTimePreferences.preferences} coreMemories={coreForPreferences('luna')} preferredPose={personalGoals.preferred('luna')} keepsake={displayKeepsakes.find(keepsake=>keepsake.owner==='luna')} resident="luna" chat={residentChat('luna')} onActivityStatus={setLunaHomeActivity} shown={area==='luna-home'} away={awayVisitor==='luna'} outdoors={!!lunaOuting&&!lunaOuting.homeExit} leavingHome={!!lunaOuting?.homeExit||visitorPreparing==='luna'} onResidentExit={()=>visitorPreparing==='luna'?setVisitorAtDoor('luna'):leaveLunaHome()} timeZone={timeZone} manaPresent={manaArea==='luna-home'} manaLeaving={residentExit==='luna-home'} onManaExit={()=>finishResidentExit('luna-home')} onStreet={()=>enterView('street')}/>
  <div className="companion-room-body" hidden={area!=='bedroom'}>
   <p id="room-controls">{editing?'Drag furniture or wall decorations, or focus a piece and use the arrow keys.':'Watch Mana go about her day.'}</p>
   <SceneViewport disabled={editing}>
   <div ref={scene} className="companion-room-scene" tabIndex={0} role="group" aria-label="Room floor" aria-describedby="room-controls">
    {!editing&&<MapTransferArrow point={homeThresholds.bedroomToLiving} direction="down-right" label="Go to the living space" onClick={()=>enterView('living')}/>}
    <img className="companion-room-art" src={(editing?draftBackground:current.current.background)??backgroundReference} alt="" draggable={false}/>
    {finishes.wall!=='Original'&&<img className="companion-room-art companion-room-wall-finish" data-finish={finishes.wall} src={(editing?draftBackground:current.current.background)??backgroundReference} alt="" draggable={false}/>}
    {finishes.floor!=='Original'&&<img className="companion-room-art companion-room-floor-finish" data-finish={finishes.floor} src={(editing?draftBackground:current.current.background)??backgroundReference} alt="" draggable={false}/>}
    <div className="companion-room-light" aria-hidden="true"/>
    {displayedObjects.map(object=>{
     const activity=roomActivities.find(item=>item.object===object.id);
     const style={left:`${object.x/799*100}%`,top:`${object.y/698*100}%`,width:`${object.width/799*100}%`,
      zIndex:sharedRoomFurnitureDepth(object)};
     const orientation=object.mirrored?{transform:'scaleX(-1)'}:undefined;
     if(editing&&movableRoomObject(object)){
      const name=catalog.find(piece=>piece.id===object.id)?.name??(object.id==='chair'?'Beanbag':object.id==='table'?'Coffee table':object.id.replace('-', ' '));
      return <button key={object.id} className="companion-room-object companion-room-move" data-room-object={object.id}
       style={{...style,zIndex:object.id===selected?2000:object.footprint?.bottom??2}} aria-label={`Move ${name}`}
       aria-pressed={object.id===selected} data-invalid={object.id===selected&&!!preview?.problem}
       onClick={event=>{event.stopPropagation();setSelected(object.id);}}
       onPointerDown={event=>{
        if(event.button!==0||editDrag.current)return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setSelected(object.id);
        const {dx=0,dy=0}=draft?.[object.id]??{};
        editDrag.current={id:object.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,dx,dy};
       }}
       onPointerMove={moveFurniture} onPointerUp={finishFurniture}
       onPointerCancel={event=>finishFurniture(event,true)} onLostPointerCapture={event=>finishFurniture(event,true)}
       onKeyDown={event=>{
        const nudge={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[event.key];
        if(!nudge||editDrag.current)return;
        event.preventDefault();event.stopPropagation();
        setSelected(object.id);
        const {dx=0,dy=0}=draft?.[object.id]??{};
        acceptPlacement(tryPlacement(object.id,dx+nudge[0],dy+nudge[1]));
       }}>
       <img src={roomPieceImage(object.image)} data-piece-color={colors?.[object.id]} style={orientation} alt="" draggable={false}/>
      </button>;
     }
     if(!activity||(object.id!=='desk'&&object.id!=='table'))return <img key={object.id} className="companion-room-decoration" data-room-object={object.id} data-piece-color={colors?.[object.id]} style={{...style,...orientation}} src={roomPieceImage(object.image)} alt="" draggable={false}/>;
     const stationObject=object.id==='desk'||object.id==='table'?object.id:null;
     const label=stationObject==='desk'?'Desk':stationObject==='table'?'Game table':activity.label;
     return <button key={object.id} className="companion-room-object" data-room-object={object.id} aria-label={label} title={label} style={style}
      aria-expanded={stationObject?station===stationObject:undefined}
      disabled={editing} onClick={event=>{
       event.stopPropagation();
       if(stationObject){setMemory(null);setStation(station===stationObject?null:stationObject);}
      }}>
      <img src={roomPieceImage(object.image)} data-piece-color={colors?.[object.id]} style={orientation} alt="" draggable={false}/>
     </button>;
    })}
    {!editing&&area==='bedroom'&&objects.some(object=>object.id==='desk')&&displayKeepsakes.filter(keepsake=>keepsake.owner==='mana').map(keepsake=>{
     const desk=objects.find(object=>object.id==='desk')!;
     return <ActivityKeepsake key={keepsake.id} keepsake={keepsake} timeZone={timeZone} reflect={visible&&manaArea==='bedroom'&&!sleeping} style={{
      left:`${(desk.x+desk.width*(desk.mirrored ? .24 : .76))/799*100}%`,top:`${(desk.y+desk.width*.45)/698*100}%`,
      width:`${desk.width*.14/799*100}%`,zIndex:sharedRoomFurnitureDepth(desk)+1,
     }}/>;
    })}
    {botRoom==='bedroom'&&homeBot}
    {manaArea==='bedroom'&&!editing&&<CharacterGesture character="mana" asleep={sleeping} className="companion-room-mana" onDrop={!active&&!sleeping?point=>{
     const target=roomDropPosition(point,objects);
     if(!target||activityRunning.current)return;
     current.current={...current.current,position:target};
     setPosition(target);
     saveRoom(current.current);
    }:undefined} style={{
     left:`${point.x/799*100}%`,top:`${point.y/698*100}%`,zIndex:depth,transform:`translate(-50%, ${resting?-80:-98}%)`,
    }}>
     {sleeping||active?<img src={displayedSprite} alt="Mini Mana" draggable={false} style={{transform:`scaleX(${facing})`}}/>:
      <ManaSprite facing={facing} visible={visible&&area==='bedroom'}/>}
    </CharacterGesture>}
   {station&&!editing&&<aside className="memory-card companion-room-memory companion-room-station" aria-label={station==='desk'?'Desk projects':'Game table'} onClick={event=>event.stopPropagation()}>
    <header><strong>{station==='desk'?'Desk projects':'Published games'}</strong><button className="btn" onClick={()=>setStation(null)}>Close</button></header>
    {stationProjects.length?stationProjects.map(project=><button className="btn" key={project.id} onClick={()=>openStationProject(project.id)}>{project.title}</button>)
     :<p>{station==='desk'?'No projects in development yet.':'No published games yet.'}</p>}
    <button className="btn primary" onClick={()=>openStationProject()}>{station==='desk'?'Open Game Dev':'Open Published'}</button>
   </aside>}
   {memory&&!station&&!editing&&<aside className="memory-card companion-room-memory" aria-label="Photo board memory" onClick={event=>event.stopPropagation()}>
    {sharedKeepsake?.pinned&&<section>
     <strong>Shared keepsake</strong>
     <p>{sharedKeepsake.moment}</p><p>“{sharedKeepsake.caption}”</p>
    </section>}
    {manaKeepsake?.pinned&&<section>
     <strong>Mana’s keepsake</strong>
     <p>{manaKeepsake.moment}</p><p>“{manaKeepsake.caption}”</p>
    </section>}
    {memory.content&&<><strong>{memory.title}</strong><p>{memory.content}</p></>}
    <button className="btn" onClick={()=>setMemory(null)}>Close memory</button>
   </aside>}
   {canSpeakHere&&area==='bedroom'&&!station&&!memory&&manaSpeech('bedroom',point.x,point.y-(resting?.59:.92)*.19*799,`You are in your bedroom. ${status||'You are looking around.'}`)}
   </div>
   </SceneViewport>
   <p role="status">{editing?preview?.problem??editMessage:manaArea!=='bedroom'?{living:'Mana is in the living space.',street:'Mana is out on the street.',library:'Mana is at Lyra’s library.','luna-home':'Mana is at Luna’s home.',park:'Mana is at Manaverse Park.',square:'Mana is in Town Square.',district:'Mana is on Second Street.',office:officeWorking?'Mana is working at a workstation.':'Mana is at the AI Workforce Office.','meeting-room':'Mana is in the meeting room.','aishi-office':'Mana is in Aishi’s office.','office-hallway':'Mana is in the office hallway.',pantry:'Mana is in the pantry.','rest-area':'Mana is in the rest area.',cafe:'Mana is at the Coffee Shop.',workshop:'Mana is at the Workshop.','town-hall':'Mana is at Town Hall.'}[manaArea]:[status,...effectSummary].filter(Boolean).join(' · ')}</p>
  </div>
 </section></ScenePanContext.Provider></CharacterNightLighting.Provider></TownWeatherProvider>;
}








