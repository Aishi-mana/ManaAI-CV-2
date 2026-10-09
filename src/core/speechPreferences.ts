import { readStored, writeStored } from './persistence';
import { isRecord, integerInRange } from './validation';
import { cleanReply } from './emotion';
import type { Msg } from './types';

export interface SpeechPreferences { voice: string; automatic: boolean; rate:number; volume:number }
export function validateSpeechPreferences(value: unknown): SpeechPreferences {
  const v=isRecord(value)?value:{};
  return {voice:typeof v.voice==='string'&&v.voice.length<=200?v.voice:'',automatic:v.automatic===true,
    rate:integerInRange(v.rate,-10,10)?v.rate:0,volume:integerInRange(v.volume,0,100)?v.volume:100};
}
export function loadSpeechPreferences():SpeechPreferences {
  try{return validateSpeechPreferences(JSON.parse(readStored('mana.speech.v1')??'null'));}
  catch{return validateSpeechPreferences(null);}
}
export function saveSpeechPreferences(value:SpeechPreferences){writeStored('mana.speech.v1',JSON.stringify(validateSpeechPreferences(value)));}

// Seed with loaded history. Observe new IDs during streaming; consume each once at completion.
export class AutomaticSpeech {
  private seen:Set<string>;
  private pending=new Set<string>();
  constructor(messages:Msg[]){this.seen=new Set(messages.map(m=>m.id));}
  next(messages:Msg[],busy:boolean,enabled:boolean,available:boolean,charName:string):string|null {
    for(const m of messages){if(!this.seen.has(m.id)){this.seen.add(m.id);if(enabled&&m.role==='assistant')this.pending.add(m.id);}}
    if(busy)return null;
    const candidates=messages.filter(m=>this.pending.has(m.id));
    this.pending.clear();
    if(!enabled||!available)return null;
    const m=candidates[candidates.length-1];
    if(!m||m.error)return null;
    const text=cleanReply(m.content,charName).text.trim();
    return text&&text.length<=30_000?text:null;
  }
}
