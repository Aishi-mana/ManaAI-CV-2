import {generatedAudioPath} from './musicStudio';
import {normalizeCoverIdea,type CoverIdea} from './coverDiscovery';

export const COVER_RIGHTS_BASIS=['owned','licensed','public-domain'] as const;
export type CoverRightsBasis=typeof COVER_RIGHTS_BASIS[number];
export interface CoverAttribution {
 ideaId:string;
 sourceTitle:string;
 sourceUrl:string;
 rightsBasis:CoverRightsBasis;
 reviewedAt:string;
}
export interface CoverHandoff {
 token:string;
 localAudio:string;
 title:string;
 attribution:CoverAttribution;
}
/** Source pages and actual audio files are different. Only an explicit owner's
 * local file choice, plus composition AND recording rights acknowledgment,
 * can produce a converter handoff. This is not independent license verification. */
export function prepareCoverHandoff(args:{
 idea:CoverIdea;rightsBasis:CoverRightsBasis;acknowledged:boolean;
 imported:{path:string;seconds:number;name:string};token:string;now?:Date;
}):CoverHandoff{
 const idea=normalizeCoverIdea(args.idea);
 const path=generatedAudioPath(args.imported?.path);
 const seconds=args.imported?.seconds;
 if(!idea)throw Error('Choose a saved cover inspiration.');
 if(!COVER_RIGHTS_BASIS.includes(args.rightsBasis)||args.acknowledged!==true)
  throw Error('Review rights for both the composition and recording before using local audio.');
 if(!path||typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<=0||seconds>3600)
  throw Error('The selected local audio was not imported into Music Studio correctly.');
 if(!/^coverjob-[a-zA-Z0-9_-]{1,80}$/.test(args.token))throw Error('Invalid cover handoff.');
 const now=args.now??new Date();
 if(!Number.isFinite(now.getTime()))throw Error('Invalid cover review time.');
 const title=(typeof args.imported.name==='string'?args.imported.name:'').trim().slice(0,100);
 return {
  token:args.token,localAudio:path,title:(title||'Local recording')+' · Mana cover',
  attribution:{ideaId:idea.id,sourceTitle:idea.title,sourceUrl:idea.url,
   rightsBasis:args.rightsBasis,reviewedAt:now.toISOString()},
 };
}
