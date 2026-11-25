import {useEffect,useRef,useState,type RefObject} from 'react';
import {memoryInvitations,residentFriendChoices,type MemoryInvitation} from '../core/memoryInvitations';
import {parkGroupJoinPoint,type AishiActivity} from '../core/aishiActivities';
import {residentProfiles} from '../core/residentProfiles';
import {ROOM_CONTACTS,pendingVisitRequest,phoneMessage,type PhoneMessage,type RoomContact} from '../core/roomPhone';
import {pondSketchDue,type PondSketchGoal} from '../core/pondSketch';
import type {RoomState} from '../core/companionRoom';
import type {SharedMemory} from '../core/residentRelationships';
import type {StreetPoint} from '../core/manaverseStreet';
import type {ParkChat} from './useParkChat';
import type {useManaversePlayer} from './useManaversePlayer';
import type {useTownPersonalGoals} from './useTownPersonalGoals';
import {useSceneTask} from './useSceneTask';
import {availableFriendshipPairs,chooseFriendshipPair} from '../core/friendshipHabits';

export function useTownSocialState(){
 const invitationRequest=useRef<AbortController|undefined>(undefined);
 const [groupJoining,setGroupJoining]=useState<{at:number;activity:'sketch'|'read'}>();
 const [groupJoinPending,setGroupJoinPending]=useState(false);
 const [groupJoinError,setGroupJoinError]=useState('');
 const [groupJoinReply,setGroupJoinReply]=useState<{host:RoomContact;text:string}>();
 const [friendMeetup,setFriendMeetup]=useState<{host:RoomContact;activity:'sketch'|'read';text:string;reply:string;at:number}>();
 const [aishiInvitation,setAishiInvitation]=useState<{choice:MemoryInvitation;text:string}>();
 const [meetup,setMeetup]=useState<RoomContact>();
 const [meetupPlace,setMeetupPlace]=useState<'park'|'cafe'>('park');
 const [rememberedParkActivity,setRememberedParkActivity]=useState<'sketch'|'read'|'stars'>();
 const sketchMeetup=useRef(false);
 const meetupRequestedAt=useRef(0);
 const [aishiJoining,setAishiJoining]=useState<AishiActivity>();
 const [parkChat,setParkChat]=useState<ParkChat>();
 return {invitationRequest,groupJoining,setGroupJoining,groupJoinPending,setGroupJoinPending,
  groupJoinError,setGroupJoinError,groupJoinReply,setGroupJoinReply,friendMeetup,setFriendMeetup,
  aishiInvitation,setAishiInvitation,meetup,setMeetup,meetupPlace,setMeetupPlace,
  rememberedParkActivity,setRememberedParkActivity,sketchMeetup,meetupRequestedAt,
  aishiJoining,setAishiJoining,parkChat,setParkChat};
}
export type TownSocialState=ReturnType<typeof useTownSocialState>;
type Invitation={choice:MemoryInvitation;text:string};

export function useSocialMeetups({state,room,sleeping,visitorAvailable,hostPlanned,isBedtime,timeZone,onMessage,onPondSketch,sheltering=false}:{
 sheltering?:boolean;
 state:TownSocialState;room:RefObject<RoomState>;sleeping:boolean;visitorAvailable:boolean;hostPlanned:boolean;
 isBedtime:()=>string|undefined;timeZone:string;onMessage:(message:PhoneMessage)=>void;onPondSketch:(status:PondSketchGoal['status'])=>void;
}){
 function startMeetup(contact:RoomContact,place:'park'|'cafe',sketch=false,invitation?:Invitation){
  if(sheltering&&place==='park')return;
  if(state.meetup||state.friendMeetup||sleeping||isBedtime()||!visitorAvailable||hostPlanned||pendingVisitRequest(room.current.phoneMessages??[]))return;
  if(sketch&&(room.current.pondSketch?.status!=='invited'||!pondSketchDue(room.current.pondSketch,new Date(),timeZone)))return;
  state.sketchMeetup.current=sketch;
  state.setRememberedParkActivity(invitation?.choice.parkActivity);
  state.meetupRequestedAt.current=Date.now();
  if(invitation)onMessage({...phoneMessage(contact,place==='cafe'?'cafe-request':'park-request'),text:invitation.text,detail:invitation.choice.fact});
  else if(!sketch)onMessage(phoneMessage(contact,place==='cafe'?'cafe-invite':'park-invite'));
  onMessage(phoneMessage(contact,sketch?'sketch-accepted':invitation?(place==='cafe'?'cafe-request-accepted':'park-request-accepted'):place==='cafe'?'cafe-accepted':'park-accepted'));
  state.setMeetupPlace(place);
  state.setMeetup(contact);
  return true;
 }
 function cancelMeetup(reason?:string){
  if(!state.meetup)return;
  if(state.sketchMeetup.current)onPondSketch('deferred');
  else onMessage({...phoneMessage(state.meetup,state.meetupPlace==='cafe'?'cafe-cancelled':'park-cancelled'),...(reason?{detail:reason}:{})});
  state.sketchMeetup.current=false;
  state.setMeetup(undefined);
 }
 return {startMeetup,cancelMeetup};
}

type SocialOptions={
 windDown?:boolean;
 smallFavorActive?:boolean;favorCooldownUntil?:number;
 sheltering?:boolean;
 state:TownSocialState;room:RefObject<RoomState>;visible:boolean;editing:boolean;sleeping:boolean;night:boolean;
 manaSpeechReady:boolean;lighting:string;hasTownEvent:boolean;townGathering:boolean;visitorAvailable:boolean;
 awayVisitor:RoomContact|null;visitorPreparing:RoomContact|null;hostPlan:boolean;invitation:boolean;
 cafeEncounter:RoomContact|undefined;friendChat:Extract<ParkChat,{planned:true}>|undefined;
 dive:ReturnType<typeof useManaversePlayer>;availableJoin:AishiActivity|undefined;sharedMemories:SharedMemory[];
 personalGoals:ReturnType<typeof useTownPersonalGoals>;
 onChooseInvitation:(owner:MemoryInvitation['owner'],choices:MemoryInvitation[],signal:AbortSignal)=>Promise<Invitation|undefined>;
 onAskGroupToJoin:(host:RoomContact,activity:'sketch'|'read',memories:SharedMemory[],signal:AbortSignal)=>Promise<{accepted:boolean;text:string}|undefined>;
 startMeetup:(contact:RoomContact,place:'park'|'cafe',sketch?:boolean,invitation?:Invitation)=>boolean|undefined;
};

export function useSocialActivities(options:SocialOptions){
 const {state,room:current,visible,editing,sleeping,night,manaSpeechReady,lighting,hasTownEvent,townGathering,
  visitorAvailable,awayVisitor,visitorPreparing,hostPlan,invitation,cafeEncounter,friendChat,dive,availableJoin,
  sharedMemories,personalGoals,onChooseInvitation,onAskGroupToJoin,startMeetup}=options;
 const sheltering=options.sheltering===true;
 const {invitationRequest,groupJoining,setGroupJoining,groupJoinPending,setGroupJoinPending,
  groupJoinError,setGroupJoinError,groupJoinReply,setGroupJoinReply,friendMeetup,setFriendMeetup,
  aishiInvitation,setAishiInvitation,meetup,aishiJoining,parkChat}=state;
 const invitationGate=useRef<{npc:boolean;friends?:boolean;aishi?:AishiActivity;sheltering?:boolean}>({npc:false});
 const invitationWriter=useRef(onChooseInvitation);
 invitationWriter.current=onChooseInvitation;
 const groupJoinGate=useRef<{at:number;host:RoomContact;activity:'sketch'|'read';point:StreetPoint}|undefined>(undefined);
 const lastAishiInvitation=useRef(0);
 useEffect(()=>{
  if(!visible)invitationRequest.current?.abort();
  return ()=>invitationRequest.current?.abort();
 },[visible,invitationRequest]);
 const lastAutonomousMeetup=useRef(Date.now());
 useSceneTask(visible,manaSpeechReady,60_000,invitationRequest,async signal=>{
  if(hasTownEvent||Date.now()-lastAutonomousMeetup.current<12*60_000||
   !invitationGate.current.npc||current.current.pondSketch?.status==='invited'||Math.random()>=.35)return;
  const pair=chooseFriendshipPair(current.current.sharedMemories??[],availableFriendshipPairs(!!invitationGate.current.npc,!!invitationGate.current.friends));
  if(!pair||pair.first!=='mana')return;
  const contact=pair.second as RoomContact;
  const choices=memoryInvitations(current.current.sharedMemories??[],contact,'mana')
   .filter(choice=>(!sheltering||choice.activity==='cafe')&&(choice.parkActivity!=='stars'||lighting==='night'));
  if(!choices.length){
   if(startMeetup(contact,sheltering?'cafe':Math.random()<.5?'park':'cafe'))lastAutonomousMeetup.current=Date.now();
   return;
  }
  lastAutonomousMeetup.current=Date.now();
  const invitation=await invitationWriter.current(contact,choices,signal);
  if(signal.aborted||!invitation||!invitationGate.current.npc||
   !(current.current.sharedMemories??[]).some(memory=>memory.id===invitation.choice.memoryId))return;
  const place=invitation.choice.activity;
  if(place==='park'&&invitationGate.current.sheltering)return;
  if(place==='park'||place==='cafe')startMeetup(contact,place,false,invitation);
 });
 useEffect(()=>{
  if(aishiJoining&&(availableJoin!==aishiJoining||groupJoining&&friendMeetup?.at!==groupJoining.at))dive.stopJoining();
 },[aishiJoining,availableJoin,groupJoining,friendMeetup?.at,dive.stopJoining]);
 const groupJoinPoint=friendChat&&dive.playerArea==='park'&&dive.playerPoint&&!dive.walking&&!aishiJoining&&
  !editing&&!sleeping?parkGroupJoinPoint(dive.playerPoint,friendChat.first):undefined;
 groupJoinGate.current=friendMeetup&&groupJoinPoint?{at:friendMeetup.at,host:friendMeetup.host,activity:friendMeetup.activity,point:groupJoinPoint}:undefined;
 async function askToJoinGroup(){
  const group=groupJoinGate.current;
  if(!group||!manaSpeechReady||invitationRequest.current||groupJoinPending)return;
  const controller=new AbortController();
  invitationRequest.current=controller;
  setGroupJoinPending(true);
  setGroupJoinError('');
  setGroupJoinReply(undefined);
  const deadline=window.setTimeout(()=>controller.abort(),30_000);
  try{
   const reply=await onAskGroupToJoin(group.host,group.activity,current.current.sharedMemories??[],controller.signal);
   const currentGroup=groupJoinGate.current;
   if(controller.signal.aborted||!reply||!currentGroup||currentGroup.at!==group.at){
    if(currentGroup?.at===group.at)setGroupJoinError('Couldn’t finish the reply. Try asking again.');
    return;
   }
   setGroupJoinReply({host:group.host,text:reply.text});
   if(!reply.accepted)return;
   const joined=dive.joinActivity(group.activity,{
    area:'park',point:currentGroup.point,facing:group.host==='luna'?1:-1,speaker:ROOM_CONTACTS[group.host].name,
    activity:`Aishi is ${group.activity==='sketch'?'sketching':'reading'} with Luna and Lyra by the park pond.`,
   });
   if(joined)setGroupJoining({at:group.at,activity:group.activity});
  }catch{
   if(groupJoinGate.current?.at===group.at)setGroupJoinError('Couldn’t finish the reply. Try asking again.');
  }finally{
   clearTimeout(deadline);
   if(invitationRequest.current===controller)invitationRequest.current=undefined;
   setGroupJoinPending(false);
  }
 }
 useEffect(()=>{
  if(groupJoining&&(!aishiJoining||friendMeetup?.at!==groupJoining.at||dive.playerArea!=='park')){
   dive.stopJoining();
   setGroupJoining(undefined);
  }
 },[groupJoining,aishiJoining,friendMeetup?.at,dive.playerArea,dive.stopJoining]);
 useEffect(()=>{
  if(!groupJoinReply)return;
  const timer=window.setTimeout(()=>setGroupJoinReply(undefined),6000);
  return ()=>clearTimeout(timer);
 },[groupJoinReply]);
 const groupReplySpeaker=groupJoinReply&&dive.playerArea==='park'?dive.root.current?.querySelector(
  `.manaverse-park-map .character-gesture:has(button[aria-label="Interact with ${ROOM_CONTACTS[groupJoinReply.host].name}"])`):undefined;
 invitationGate.current={
  sheltering,
  npc:visible&&!editing&&!sleeping&&!night&&!options.windDown&&visitorAvailable&&!meetup&&!friendMeetup&&!hostPlan&&!invitation&&
   !hasTownEvent&&document.visibilityState==='visible',
  friends:!sheltering&&visible&&!editing&&!sleeping&&!night&&!options.windDown&&visitorAvailable&&!meetup&&!friendMeetup&&!hostPlan&&!invitation&&
   !awayVisitor&&!visitorPreparing&&!townGathering&&!cafeEncounter&&!aishiJoining&&!parkChat&&document.visibilityState==='visible',
  aishi:visible&&!editing&&!sleeping&&!night&&!options.windDown&&!options.smallFavorActive&&Date.now()>=(options.favorCooldownUntil??0)&&!friendMeetup&&!aishiJoining&&document.visibilityState==='visible'?availableJoin:undefined,
 };
 const lastFriendOffer=useRef(Date.now());
 useSceneTask(visible,manaSpeechReady,60_000,invitationRequest,async signal=>{
  if(!invitationGate.current.friends||Date.now()-lastFriendOffer.current<10*60_000)return;
  const pair=chooseFriendshipPair(current.current.sharedMemories??[],availableFriendshipPairs(!!invitationGate.current.npc,true));
  if(!pair||pair.first==='mana')return;
  const host:RoomContact=Math.random()<.5?'luna':'lyra';
  const guest:RoomContact=host==='luna'?'lyra':'luna';
  const available=residentFriendChoices(current.current.sharedMemories??[],host);
  const preferred=personalGoals.preferred(host,true)??personalGoals.preferred(guest,true);
  const choices=preferred==='sketch'||preferred==='read'?available.filter(choice=>choice.parkActivity===preferred):available;
  const choose=invitationWriter.current;
  lastFriendOffer.current=Date.now();
  const offer=await choose(host,choices,signal);
  if(signal.aborted||!offer||!invitationGate.current.friends)return;
  const replyChoice:MemoryInvitation={...offer.choice,id:'accept-'+offer.choice.id,owner:guest,recipient:host,
   responding:true,fact:`${residentProfiles[host].name} invited you to ${offer.choice.parkActivity} by the park pond. Their message: ${offer.text}`};
  const answer=await choose(guest,[replyChoice],signal);
  if(signal.aborted||!answer||!invitationGate.current.friends)return;
  const activity=offer.choice.parkActivity;
  if(activity==='sketch'||activity==='read')setFriendMeetup({host,activity,text:offer.text,reply:answer.text,at:Date.now()});
 });
 useEffect(()=>{
  if(!friendMeetup)return;
  if(sheltering||sleeping||townGathering||awayVisitor||hostPlan||meetup){setFriendMeetup(undefined);return;}
  const timer=window.setTimeout(()=>setFriendMeetup(undefined),Math.max(0,friendMeetup.at+240_000-Date.now()));
  return ()=>clearTimeout(timer);
 },[friendMeetup,sleeping,townGathering,awayVisitor,hostPlan,meetup,sheltering]);
 useSceneTask(visible,manaSpeechReady,30_000,invitationRequest,async signal=>{
  const activity=invitationGate.current.aishi;
  if(!activity||aishiInvitation||Date.now()-lastAishiInvitation.current<12*60_000)return;
  const owner={sketch:'luna',read:'lyra',tinker:'mana'} as const;
  const choices=memoryInvitations(current.current.sharedMemories??[],owner[activity],'aishi',activity);
  if(!choices.length)return;
  lastAishiInvitation.current=Date.now();
  const offer=await invitationWriter.current(owner[activity],choices,signal);
  if(signal.aborted||!offer||invitationGate.current.aishi!==activity||
   !(current.current.sharedMemories??[]).some(memory=>memory.id===offer.choice.memoryId))return;
  setAishiInvitation(offer);
 });
 useEffect(()=>{
  if(!aishiInvitation)return;
  if(aishiJoining||availableJoin!==aishiInvitation.choice.activity||!visible||editing||
   !sharedMemories.some(memory=>memory.id===aishiInvitation.choice.memoryId)){setAishiInvitation(undefined);return;}
  const timer=window.setTimeout(()=>setAishiInvitation(undefined),20_000);
  return ()=>clearTimeout(timer);
 },[aishiInvitation,aishiJoining,availableJoin,visible,editing,sharedMemories]);
 const invitationSpeaker=aishiInvitation?dive.root.current?.querySelector(
  `.companion-room-body:not([hidden]) .character-gesture:has(button[aria-label="Interact with ${aishiInvitation.choice.owner==='mana'?'Mana':residentProfiles[aishiInvitation.choice.owner].name}"])`):undefined;

 return {groupJoinPoint,askToJoinGroup,groupReplySpeaker,invitationSpeaker};
}

