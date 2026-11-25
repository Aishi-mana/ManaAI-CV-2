import {generatedAudioPath,validateTranslationAttribution} from './musicStudio';
import {guideReady,englishRevision} from './midiMelody';
import type {TranslationProject,AdaptationRightsBasis} from './translationWorkbench';

export type GuideRecordingRightsBasis='owned'|'licensed'|'public-domain';
export interface TranslationAttribution{
 projectId:string;sourceTitle:string;englishLyrics:string[];
 lyricRightsBasis:AdaptationRightsBasis;melodyRightsBasis:AdaptationRightsBasis;
 guideRightsBasis:GuideRecordingRightsBasis;
 melodySource:string;englishRevision:string;reviewedAt:string;
 guideAudioName:string;
 backingRightsBasis?:GuideRecordingRightsBasis;
 backingAudio?:string;
}
export interface TranslationHandoff{
 token:string;localAudio:string;backingAudio?:string;title:string;
 attribution:TranslationAttribution;
}
const rights=(value:unknown):value is GuideRecordingRightsBasis=>
 value==='owned'||value==='licensed'||value==='public-domain';
const stamp=(value:unknown):value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
 new Date(value).toISOString()===value;
const allowedId=(id:unknown):id is string=>typeof id==='string'&&/^translation-[a-zA-Z0-9_-]{1,80}$/.test(id);
const safeName=(s:unknown,max:number):s is string=>typeof s==='string'&&!!s.trim()&&s.length<=max;
/** Owners render the English guide in OpenUtau, choose the WAV manually and
 * acknowledge voicebank/recording reuse rights. This never verifies language,
 * recording provenance, guide quality, melody or licensed adaptation scope. */
export function prepareTranslationHandoff(args:{
 project:TranslationProject;
 imported:{path:string;seconds:number;name:string};
 rightsBasis:GuideRecordingRightsBasis;acknowledged:boolean;
 backing?:{imported:{path:string;seconds:number;name:string};
  rightsBasis:GuideRecordingRightsBasis;acknowledged:boolean};
 token:string;now?:Date;
}):TranslationHandoff{
 const p=args.project,melody=p?.melody;
 if(!p||!allowedId(p.id)||!melody||!guideReady(melody,p.lines))
  throw Error('Review the current English lyrics and Phase 3B MIDI note mapping before voice conversion.');
 if(!rights(p.rightsBasis)||!rights(melody.rightsBasis))
  throw Error('Review adaptation and melody rights before using the guide.');
 if(!rights(args.rightsBasis)||args.acknowledged!==true)
  throw Error('Confirm permission to use the OpenUtau rendered singing recording and voicebank.');
 if(!/^translationjob-[a-zA-Z0-9_-]{1,80}$/.test(args.token))
  throw Error('Invalid English guide handoff.');
 const source=generatedAudioPath(args.imported?.path);
 if(!source||typeof args.imported.seconds!=='number'||!Number.isFinite(args.imported.seconds)||
    !(1<=args.imported.seconds&&args.imported.seconds<=3600))
  throw Error('Import a valid, locally rendered singing guide (1 second–1 hour).');
 if(!safeName(args.imported.name,100))throw Error('The imported guide needs a name.');
 let backingAudio:string|undefined,backingRightsBasis:GuideRecordingRightsBasis|undefined;
 if(args.backing){
  if(!rights(args.backing.rightsBasis)||args.backing.acknowledged!==true)
   throw Error('Confirm the rights to use the instrumental backing recording separately.');
  backingAudio=generatedAudioPath(args.backing.imported?.path);
  if(!backingAudio||backingAudio===source||
     typeof args.backing.imported.seconds!=='number'||!Number.isFinite(args.backing.imported.seconds)||
     Math.abs(args.backing.imported.seconds-args.imported.seconds)>1)
   throw Error('Choose a different imported instrumental WAV aligned within one second of the guide.');
  backingRightsBasis=args.backing.rightsBasis;
 }
 const now=args.now??new Date();
 if(!Number.isFinite(now.getTime()))throw Error('Invalid guide review timestamp.');
 const attribution:TranslationAttribution={
  projectId:p.id,sourceTitle:p.title,
  englishLyrics:p.lines.map(line=>line.english),
  lyricRightsBasis:p.rightsBasis,melodyRightsBasis:melody.rightsBasis,
  guideRightsBasis:args.rightsBasis,
  melodySource:melody.sourceName,englishRevision:englishRevision(p.lines),
  reviewedAt:now.toISOString(),guideAudioName:args.imported.name,
  ...(backingAudio&&backingRightsBasis?{backingAudio,backingRightsBasis}:{})
 };
 const valid=validateTranslationAttribution(attribution);
 if(!valid)throw Error('The translation provenance was incomplete.');
 return {token:args.token,localAudio:source,
  ...(backingAudio?{backingAudio}:{}),
  title:(p.title.trim().slice(0,100)||'English adaptation')+' · Mana English vocal',
  attribution:valid};
}
