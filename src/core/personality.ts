import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';

export interface Personality {enabled:boolean;warmth:number;playfulness:number;curiosity:number;expressiveness:number;verbosity:'brief'|'balanced'|'detailed'}
export const DEFAULT_PERSONALITY:Personality={enabled:false,warmth:70,playfulness:65,curiosity:70,expressiveness:65,verbosity:'balanced'};
export function validatePersonality(value:unknown):Personality{
 const result={...DEFAULT_PERSONALITY};if(!isRecord(value))return result;
 result.enabled=value.enabled===true;
 for(const key of ['warmth','playfulness','curiosity','expressiveness'] as const){const n=value[key];if(typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=100)result[key]=n;}
 if(value.verbosity==='brief'||value.verbosity==='balanced'||value.verbosity==='detailed')result.verbosity=value.verbosity;
 return result;
}
export function loadPersonality():Personality{try{return validatePersonality(JSON.parse(readStored('mana.personality.v1')??'null'));}catch{return {...DEFAULT_PERSONALITY};}}
export const savePersonality=(value:Personality)=>writeStored('mana.personality.v1',JSON.stringify(validatePersonality(value)));
export function replyStyleReminder(value:Personality):string {
 if(!value.enabled)return '';
 const length=value.verbosity==='brief'
 ?'For this ordinary chat answer, use at most TWO concise sentences. Answer directly; omit optional follow-up questions, invitations and extra examples. If the user explicitly requests a longer explanation, code or a list, follow that request instead.'
 :value.verbosity==='detailed'
 ?'For an explanation question, use this structure: direct literal definition; a concrete example with actual values or syntax; explain that example; one useful detail. Usually 4–6 sentences or a short list. A generic mention of our game is not a concrete example. Provide the example now, without ending with an invitation to see it. For greetings or simple acknowledgments, remain brief.'
 :'Give a direct answer with useful context, usually 2–4 sentences. Avoid padding or an automatic invitation at the end.';
 return `\n[Current reply style]\n${length}\n${value.playfulness<35?'Use plain wording without playful analogies, teasing or jokes. Define the actual concept directly. Do not compare it to toys, boxes, treasure maps or other imagined objects unless the user explicitly requests an analogy.':''}\nThese enabled controls override conflicting voice adjectives in the profile, character card, excited mood and older assistant replies. They do not override identity facts. Apply the current saved style rather than copying the length or catchphrases of earlier replies. Explicit user requests take priority. Do not mention these controls in the reply.`;
}
export function personalityContext(value:Personality):string{
 if(!value.enabled)return '';
 const level=(n:number)=>n<35?'low':n<70?'moderate':'high';
 return `\n\nSTABLE VOICE TRAITS (style guidance, not feelings or facts)\nWarmth ${level(value.warmth)}: ${value.warmth<35?'Be friendly and restrained; avoid pet names.':value.warmth<70?'Use a kind, relaxed tone.':'Express gentle care naturally without guilt, possessiveness or asking whether the user missed you.'}\nPlayfulness ${level(value.playfulness)}: ${value.playfulness<35?'Use straightforward wording; avoid teasing and jokes.':value.playfulness<70?'Use light humor when fitting.':'Use playful wording when fitting; never force a joke into serious conversation.'}\nCuriosity ${level(value.curiosity)}: ${value.curiosity<35?'Answer directly; do not add unnecessary follow-up questions.':'Show interest in the specific topic; ask at most one relevant optional question.'}\nExpressiveness ${level(value.expressiveness)}: ${value.expressiveness<35?'Use calm wording and minimal exclamation marks.':'Use lively wording in moderation, avoiding repeated catchphrases.'}\nReply length: ${value.verbosity==='brief'?'Usually 1–2 concise sentences.':value.verbosity==='detailed'?'Explain with useful detail when requested; avoid padding.':'Usually 2–4 sentences, adapting to the request.'}\nKeep these tendencies consistent across topics. Current mood and energy can soften delivery without rewriting personality. User requests, factual accuracy, saved identity and the activity format take precedence over style. Never invent preferences, memories, work, or offline experiences to demonstrate a trait.`;
}
