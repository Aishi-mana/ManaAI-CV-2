export const originalStyles=['gentle-piano','acoustic-guitar','jazz','rock','synth-pop'] as const;
export interface OriginalBrief{prompt:string;lyrics:string;style:typeof originalStyles[number];instrumental:boolean;duration:number;seed:number}
export function validateOriginalBrief(value:unknown):OriginalBrief|undefined{
 if(!value||typeof value!=='object')return;const v=value as Record<string,unknown>;
 if(typeof v.prompt!=='string'||!v.prompt.trim()||v.prompt.length>2000||typeof v.lyrics!=='string'||v.lyrics.length>6000||!originalStyles.includes(v.style as OriginalBrief['style'])||typeof v.instrumental!=='boolean'||typeof v.duration!=='number'||!Number.isFinite(v.duration)||v.duration<10||v.duration>180||typeof v.seed!=='number'||!Number.isInteger(v.seed)||v.seed<0||v.seed>2147483647)return;
 return {prompt:v.prompt.trim(),lyrics:v.lyrics,style:v.style as OriginalBrief['style'],instrumental:v.instrumental,duration:v.duration,seed:v.seed};
}
export function originalFingerprint(brief:OriginalBrief){return JSON.stringify([brief.prompt.trim(),brief.lyrics,brief.style,brief.instrumental,brief.seed]);}
export interface OriginalDirection {mood:string;instruments:string;tempo:string;structure:string}
export function composeOriginalPrompt(prompt:string,direction:OriginalDirection):string {
 const parts=[prompt.trim()];
 if(direction.mood.trim())parts.push(`Mood: ${direction.mood.trim()}.`);
 if(direction.instruments.trim())parts.push(`Featured instruments: ${direction.instruments.trim()}.`);
 if(direction.tempo.trim())parts.push(`Tempo: ${direction.tempo.trim()} BPM.`);
 if(direction.structure.trim())parts.push(`Song structure: ${direction.structure.trim()}.`);
 return parts.filter(Boolean).join('\n');
}
export function validOriginalTempo(value:string):boolean{return value.trim()===''||(/^\d+$/.test(value)&&Number(value)>=40&&Number(value)<=240);}
