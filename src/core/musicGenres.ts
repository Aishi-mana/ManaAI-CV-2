export const ROCK_LEADS=[['electric-guitar','Distorted guitar'],['crunch-guitar','Crunch guitar'],['rock-organ','Rock organ']] as const;
export const POP_LEADS=[['electric-piano','Electric piano'],['acoustic-piano','Acoustic piano'],['synth-lead','Synth lead'],['clean-guitar','Clean electric guitar']] as const;
export const JAZZ_LEADS=[['sax','Punchy sax'],['clarinet','Clarinet swing'],['muted-trumpet','Muted trumpet']] as const;
export const COUNTRY_LEADS=[['fiddle','Fiddle'],['clean-guitar','Clean electric guitar'],['harmonica','Harmonica'],['banjo','Banjo'],['pedal-steel','Pedal steel'],['acoustic-guitar','Acoustic guitar']] as const;
export type BackingStyle='original'|'rock'|'jazz'|'pop'|'country'|'piano-trio'|'guitar-electric';
export const BAND_STYLE_OPTIONS=[['rock','Rock band'],['jazz','Jazz swing'],['pop','Pop band'],['country','Country band']] as const;
export const SOURCE_NOTE_STYLE_OPTIONS=[['piano-trio','Piano trio · source notes'],['guitar-electric','Electric guitar · source notes']] as const;
export const isBandStyle=(style:string)=>BAND_STYLE_OPTIONS.some(([value])=>value===style);
export type BandSource='guitar'|'piano'|'keys'|'vocal';
export const checkedBandSource=(value:unknown):BandSource=>value==='piano'||value==='keys'||value==='vocal'?value:'guitar';
export function genreLeadOptions(style:string){
 return style==='rock'?ROCK_LEADS:style==='pop'?POP_LEADS:style==='jazz'?JAZZ_LEADS:style==='country'?COUNTRY_LEADS:undefined;
}
export function checkedGenreLead(style:string,value:unknown):string|undefined{
 const options=genreLeadOptions(style);
 if(!options)return undefined;
 return options.some(([id])=>id===value)?String(value):options[0][0];
}
