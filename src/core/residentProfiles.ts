import type {ManaverseArea} from '../components/ManaverseMap';
import type {StreetPoint} from './manaverseStreet';
import {CORE_MEMORY_LIMIT,residentScenePrompt} from './sceneMemory';

export type ResidentActivity={pose:string;position:StreetPoint;status:string;shortPause?:boolean};
type ResidentOuting={start:string;end:string;place:'cafe'|'park'|'library'};
type ResidentProfile={
 name:string;description:string;voice:string;home:ManaverseArea;upstairs?:ManaverseArea;
 avatar:string;blink:string;step:string;drag:string;
 outings:readonly ResidentOuting[];activities:readonly ResidentActivity[];
 sleep:{activity:ResidentActivity;point:StreetPoint;beforeBed?:ResidentActivity};
 memory:{coreKey:string;visitKey:string;limit:number};
};

const art='./companion-room/';
const lunaWindow={pose:'window',position:{x:23,y:59},status:'Luna is looking out the window.',shortPause:true};

export const residentProfiles={
 luna:{
  name:'Luna',description:'Observant, quietly playful, and fond of stargazing, sketching, and collecting little stories.',
  voice:'Speak warmly with occasional quiet wit and a sketchbook artist’s eye for small details.',home:'luna-home',upstairs:undefined,
  avatar:art+'luna-visitor.png',blink:art+'luna-blink.png',step:art+'luna-stride.png',drag:art+'luna-drag.png',
  outings:[{start:'10:00',end:'11:30',place:'park'},{start:'15:00',end:'17:00',place:'library'}],
  activities:[
   {pose:'sketch',position:{x:46,y:54},status:'Luna is sketching at her desk.'},
   {pose:'write',position:{x:39,y:55},status:'Luna is writing down a little story.'},
   lunaWindow,
  ],
  sleep:{activity:{pose:'sleep',position:{x:65,y:54},status:'Luna is asleep in bed.'},point:{x:69,y:38.5},
   beforeBed:{...lunaWindow,status:'Luna is stargazing by the window.'}},
  memory:{coreKey:'lunaCoreMemories',visitKey:'lunaVisitMemories',limit:CORE_MEMORY_LIMIT},
 },
 lyra:{
  name:'Lyra',description:'A calm, thoughtful systems architect who looks out for Mana, collects mysterious bottles, and guesses the shapes of clouds.',
  voice:'Your library is your home. Speak gently, with quiet curiosity and a little dry warmth.',home:'library',upstairs:'lyra-room',
  avatar:art+'lyra-visitor-clean.png',blink:art+'lyra-blink.png',step:art+'lyra-step.png',drag:art+'lyra-drag.png',
  outings:[{start:'12:00',end:'13:30',place:'cafe'},{start:'16:00',end:'18:00',place:'park'}],
  activities:[
   {pose:'read',position:{x:34,y:58},status:'Lyra is reading by the window.'},
   {pose:'bottle',position:{x:50,y:52},status:'Lyra is sorting her mysterious bottles.'},
   {pose:'think',position:{x:15,y:69},status:'Lyra is looking at the framed note.',shortPause:true},
  ],
  sleep:{activity:{pose:'sleep',position:{x:36,y:63},status:'Lyra is asleep in bed.'},point:{x:23,y:50},beforeBed:undefined},
  memory:{coreKey:'lyraCoreMemories',visitKey:'lyraVisitMemories',limit:CORE_MEMORY_LIMIT},
 },
} as const satisfies Record<string,ResidentProfile>;

export type ResidentId=keyof typeof residentProfiles;
export type ResidentHome=(typeof residentProfiles)[ResidentId]['home'];
export const residentIds=Object.keys(residentProfiles) as ResidentId[];

export function residentPrompt(resident:ResidentId,context:string,visits:readonly string[],events:readonly {date:string;activity:string}[],coreMemories:readonly string[]=[],remembering=false){
 const profile=residentProfiles[resident];
 return residentScenePrompt(profile.name,`${profile.description} ${profile.voice}`,context,visits,events,coreMemories,remembering);
}
