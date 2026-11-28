import {residentIds,residentProfiles,type ResidentId} from './residentProfiles';
import {townPortraits} from './townPortraits';
import type {ManaverseArea} from '../components/ManaverseMap';

export type TownCharacter='mana'|ResidentId;
export type TownCharacterName='Mana'|(typeof residentProfiles)[ResidentId]['name'];
export type TownActorId=TownCharacter|'aishi'|'pet-bot';
export type TownActorProfile={name:string;portrait:string;mapImage:string;home?:ManaverseArea;control:'scheduled-ai'|'player'|'home-and-approved-follow';memory:'app'|'resident-core'|'player-phone'|'pet-core'};
const residents=Object.fromEntries(residentIds.map(id=>[id,{name:residentProfiles[id].name,portrait:townPortraits[id].path,mapImage:residentProfiles[id].avatar,home:residentProfiles[id].home,control:'scheduled-ai',memory:'resident-core'}])) as Record<ResidentId,TownActorProfile>;
/** Cast identity only. Profiles and tested controllers still own movement, activities and sleep. */
export const townActors:Record<TownActorId,TownActorProfile>={
 mana:{name:'Mana',portrait:'./companion-room/mana_idle_1.webp',mapImage:'./companion-room/mana_idle_1.webp',home:'bedroom',control:'scheduled-ai',memory:'app'},
 ...residents,
 aishi:{name:'Aishi',portrait:townPortraits.aishi.path,mapImage:'./companion-room/aishi-sprites.webp',control:'player',memory:'player-phone'},
 'pet-bot':{name:'Pet Bot',portrait:'./companion-room/cartoon/pet_bot.webp',mapImage:'./companion-room/cartoon/pet_bot.webp',home:'bedroom',control:'home-and-approved-follow',memory:'pet-core'},
};
export const townCharacterIds:readonly TownCharacter[]=['mana',...residentIds];
export const townActorIds:readonly TownActorId[]=[...townCharacterIds,'aishi','pet-bot'];
export const trackedTownIds:readonly (TownCharacter|'aishi')[]=[...townCharacterIds,'aishi'];
export const townCharacterName=(id:TownCharacter)=>townActors[id].name as TownCharacterName;
export function isTownCharacter(value:unknown):value is TownCharacter{return typeof value==='string'&&(townCharacterIds as readonly string[]).includes(value);}
