import type {CoverMusicPreference} from './weeklyCovers';

/** Filename and page titles are only hints, never audio analysis or proof of
 * language, copyright status, origin, or ownership. */
export function animeCoverHintScore(title:string):number{
 const value=title.slice(0,220).toLocaleLowerCase();
 const anime=/\b(?:anime|anison|anisong|j[ -]?pop|opening|ending|ost)\b|(?:^|[\s([_-])(?:op|ed)\s*\d*(?:[\s)\]_-]|$)/i.test(value);
 const english=/\b(?:english|eng\.?|dubbed|dub)\b|\b(?:en|eng)[ -]?(?:ver(?:sion)?|cover)\b/i.test(value);
 const opening=/\bopening\b|(?:^|[\s([_-])op\s*\d*(?:[\s)\]_-]|$)/i.test(value);
 return (anime?3:0)+(english?2:0)+(opening?1:0);
}
export function rankCoverCandidates<T>(
 values:readonly T[],title:(value:T)=>string,preference:CoverMusicPreference,
):T[]{
 if(preference!=='english-anime')return [...values];
 return values.map((item,index)=>({item,index,score:animeCoverHintScore(title(item))}))
  .sort((a,b)=>b.score-a.score||a.index-b.index)
  .map(x=>x.item);
}
export function coverPreferenceInstruction(preference:CoverMusicPreference):string{
 return preference==='english-anime'
  ?'Prefer an anime opening or anime-song English vocal cover when the supplied title explicitly indicates one. You may prefer an English version over a Japanese one. Filenames and page titles are not proof of what language is sung. Do not claim you have heard the audio; never translate lyrics or invent an English vocal guide. If no such title is available, choose an otherwise appropriate approved candidate.'
  :'Choose from the supplied candidates based on your musical interests.';
}
export function coverPreferenceSearchTheme(theme:string,preference:CoverMusicPreference):string{
 const value=theme.trim().replace(/\s+/g,' ');
 return preference==='english-anime'
  ?([value,'anime opening English vocal cover song information licensing rights'].filter(Boolean).join(' ')).slice(0,240)
  :value;
}
