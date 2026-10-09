import type { Vowel } from './avatar';
// Windows US-English visemes reduced to the five mouth images in Mana's avatar.
export function visemeMouth(viseme:number):Vowel|null {
  if(!Number.isInteger(viseme)||viseme<0||viseme>21||viseme===0||viseme===21)return null;
  if([1,2,9,11,12,20].includes(viseme))return 'a';
  if([3,8,10].includes(viseme))return 'o';
  if([7,13,16].includes(viseme))return 'u';
  if([6,15,17,19].includes(viseme))return 'i';
  return 'e';
}

export function playbackMouth(currentId:string,event:{playbackId:string;viseme:number}):Vowel|null|undefined {
  return currentId&&event.playbackId===currentId ? visemeMouth(event.viseme) : undefined;
}
