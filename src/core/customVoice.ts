import {readStored,writeStored} from './persistence';
export const CUSTOM_VOICE='Mana · GPT-SoVITS';
export type VoicePreset='default'|'cheerful'|'thoughtful'|'gentle'|'legacy'|'automatic';
export type VoiceLanguage='en'|'ja';
export type LegacyDelivery='neutral'|'cheerful'|'thoughtful'|'gentle';
export type VoiceTone='default'|'cheerful'|'gentle'|'sad'|'worried'|'angry';
export interface VoiceReference{path:string;text:string}
export interface CustomVoiceSettings{pythonPath:string;repoPath:string;port:number;referencePath:string;referenceText:string;gptPath:string;sovitsPath:string;singingPython:string;singingRepo:string;preset:VoicePreset;legacyDelivery:LegacyDelivery;referenceLanguage:VoiceLanguage;replyLanguage:VoiceLanguage;automaticReferences:Record<VoiceTone,VoiceReference>;references:Record<Exclude<VoicePreset,'default'|'automatic'>,VoiceReference>}
export const CONFIRMED_REFERENCE_TEXT='Chiimu purei wa tokui na hou da yo. Shinrai dekiru minna to issho ni nanika o suru no tte sugoku tanoshii shi ne.';
const PREVIOUS_JAPANESE_TEXT='チームプレイは得意な方だよ。信頼できるみんなと一緒に何かをするのってすごく楽しいしね。';
const OLD_REFERENCE_TEXT="Do you think I should be able to do that? I don't think I should be able to do that. I don't think I should be able to do that.";
export const DEFAULT_CUSTOM:CustomVoiceSettings={preset:'automatic',automaticReferences:{"angry": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/angry.wav", "text": "I told you exactly what would happen if you touched that. Are you seriously going to stand there and pretend you didn't hear me? Just turn around and leave before I completely lose my mind."}, "cheerful": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/cheerful-r2.wav", "text": "Oh my gosh, oh my gosh! It's finally here! Open it right now! Fast! Fast! Fast!"}, "default": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/default-r2.wav", "text": "Hey Aishi, sit down and let me grab that heavy bag for you. You've been on your feet all day. Of course! Now just relax, I'm gonna heat up some of that soup you love, okay?"}, "gentle": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/gentle.wav", "text": "Take a deep breath. Everything is going to be just fine. The stars are out tonight and you are completely safe."}, "sad": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/sad.wav", "text": "I thought we'd have more time. It's strange how something can feel so permanent, and then one day, it's just... not."}, "worried": {"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/worried.wav", "text": "Hey, please look at me. I'm right here, okay? I'm not going anywhere, I promise. Just squeeze my hand. Let me help you carry this."}},legacyDelivery:'neutral',referenceLanguage:'en',replyLanguage:'en',references:{legacy:{path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-legacy.wav',text:"Let's spend time together today. I remember when Ashi said I love you."},cheerful:{path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/cheerful.wav',text:'Reberu appu omedetou. Yatta ne! Rea aitemu da! Wakatta yo. Ryoukai da yo. Kore de oshimai. Otsukaresama.'},thoughtful:{path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/thoughtful.wav',text:'Demo, dokoka no omise ni hairu no kana? Mokutekichi wa doko darou? Umi toka yama toka, yuuenchi toka.'},gentle:{path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/gentle.wav',text:'HP, ki o tsukete ne. Muri shicha dame da yo. Daijoubu? Chotto monotarinai kanaa. Sou da naa. Uun.'}},pythonPath:'C:/Users/Admin/miniconda3/envs/GPTSoVits/python.exe',repoPath:'C:/AI/GPT-SoVITS',port:9882,referencePath:'C:/AI/GPT-SoVITS/main_reference.wav',referenceText:CONFIRMED_REFERENCE_TEXT,gptPath:'C:/AI/GPT-SoVITS/GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt',sovitsPath:'C:/AI/GPT-SoVITS/GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2G2333k.pth',singingPython:'C:/AI/ManaAI-CV-2/data/music-tools/Scripts/python.exe',singingRepo:'C:/AI/ManaAI-CV-2/data/seed-vc'};
const STYLE_TRANSCRIPTS={"cheerful": {"japanese": "レベルアップおめでとう。やったね！レアアイテムだ！わかったよ。了解だよ。これでおしまい。お疲れ様。", "romaji": "Reberu appu omedetou. Yatta ne! Rea aitemu da! Wakatta yo. Ryoukai da yo. Kore de oshimai. Otsukaresama."}, "thoughtful": {"japanese": "でも、どこかのお店に入るのかな？目的地はどこだろう？海とか山とか、遊園地とか。", "romaji": "Demo, dokoka no omise ni hairu no kana? Mokutekichi wa doko darou? Umi toka yama toka, yuuenchi toka."}, "gentle": {"japanese": "HP、気をつけてね。無理しちゃダメだよ。大丈夫？ちょっと物足りないかなあ。そうだなあ。うーん。", "romaji": "HP, ki o tsukete ne. Muri shicha dame da yo. Daijoubu? Chotto monotarinai kanaa. Sou da naa. Uun."}} as const;
const OLD_CHEERFUL={"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/cheerful.wav", "text": "Oh my gosh, look! It's finally happening! No way, we actually did it! Woohoo, yes!"};
const OLD_AUTOMATIC_DEFAULT={"path": "C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/default.wav", "text": "Once upon a time, in a faraway kingdom, a brave knight set out on a quest to rescue the lost princess."};
// Only expand absent fields in old settings; backup validation still rejects invalid or unknown fields.
export function upgradeCustomVoice(value:unknown):unknown{
 if(!value||typeof value!=='object'||Array.isArray(value))return value;
 const v={...value as Record<string,unknown>};
 for(const key of ['preset','legacyDelivery','referenceLanguage','replyLanguage','references','automaticReferences'] as const)if(!Object.prototype.hasOwnProperty.call(v,key))v[key]=DEFAULT_CUSTOM[key];
 if(v.referencePath===DEFAULT_CUSTOM.referencePath&&(v.referenceText===OLD_REFERENCE_TEXT||v.referenceText===PREVIOUS_JAPANESE_TEXT||v.referenceText===CONFIRMED_REFERENCE_TEXT)){
  v.referenceText=CONFIRMED_REFERENCE_TEXT;
  if(v.preset==='default')v.referenceLanguage='en';
 }
 if(v.references&&typeof v.references==='object'&&!Array.isArray(v.references)){
  const refs={...v.references as Record<string,unknown>};
  if(!Object.prototype.hasOwnProperty.call(refs,'legacy'))refs.legacy=DEFAULT_CUSTOM.references.legacy;
  for(const style of ['cheerful','thoughtful','gentle'] as const){const ref=refs[style];if(ref&&typeof ref==='object'&&!Array.isArray(ref)){const r={...ref as Record<string,unknown>};if(r.text===STYLE_TRANSCRIPTS[style].japanese)r.text=STYLE_TRANSCRIPTS[style].romaji;refs[style]=r;}}
  v.references=refs;
  const selected=refs[String(v.preset)] as Record<string,unknown>|undefined;
  if(selected&&['cheerful','thoughtful','gentle'].some(style=>selected.text===STYLE_TRANSCRIPTS[style as keyof typeof STYLE_TRANSCRIPTS].romaji))v.referenceLanguage='en';
 }
 if(v.automaticReferences&&typeof v.automaticReferences==='object'&&!Array.isArray(v.automaticReferences)){
  const refs={...v.automaticReferences as Record<string,unknown>};const ref=refs.cheerful as Record<string,unknown>|undefined;
  if(ref&&ref.path===OLD_CHEERFUL.path&&ref.text===OLD_CHEERFUL.text)refs.cheerful={...ref,...DEFAULT_CUSTOM.automaticReferences.cheerful};
  const fallback=refs.default as Record<string,unknown>|undefined;
  if(fallback&&fallback.path===OLD_AUTOMATIC_DEFAULT.path&&fallback.text===OLD_AUTOMATIC_DEFAULT.text)refs.default={...fallback,...DEFAULT_CUSTOM.automaticReferences.default};
  v.automaticReferences=refs;
 }
 return v;
}
export function validateCustomVoice(value:unknown):CustomVoiceSettings{
 const upgraded=upgradeCustomVoice(value);const v=upgraded&&typeof upgraded==='object'?upgraded as Record<string,unknown>:{};
 const result=JSON.parse(JSON.stringify(DEFAULT_CUSTOM)) as CustomVoiceSettings;
 for(const key of ['pythonPath','repoPath','referencePath','referenceText','gptPath','sovitsPath','singingPython','singingRepo'] as const){if(typeof v[key]==='string'&&(v[key] as string).length<=(key==='referenceText'?3000:1000))result[key]=v[key] as string;}
 if(typeof v.port==='number'&&Number.isInteger(v.port)&&v.port>=1024&&v.port<=65535)result.port=v.port;
 if(['default','cheerful','thoughtful','gentle','legacy','automatic'].includes(String(v.preset)))result.preset=v.preset as VoicePreset;
 if(['neutral','cheerful','thoughtful','gentle'].includes(String(v.legacyDelivery)))result.legacyDelivery=v.legacyDelivery as LegacyDelivery;
 for(const key of ['referenceLanguage','replyLanguage'] as const)if(v[key]==='en'||v[key]==='ja')result[key]=v[key];
 if(v.references&&typeof v.references==='object')for(const style of ['cheerful','thoughtful','gentle','legacy'] as const){const ref=(v.references as Record<string,unknown>)[style];if(ref&&typeof ref==='object'){const r=ref as Record<string,unknown>;if(typeof r.path==='string'&&r.path.length<=1000)result.references[style].path=r.path;if(typeof r.text==='string'&&r.text.length<=3000)result.references[style].text=r.text;}}
 if(v.automaticReferences&&typeof v.automaticReferences==='object')for(const tone of ['default','cheerful','gentle','sad','worried','angry'] as const){const ref=(v.automaticReferences as Record<string,unknown>)[tone];if(ref&&typeof ref==='object'){const r=ref as Record<string,unknown>;if(typeof r.path==='string'&&r.path.length<=1000)result.automaticReferences[tone].path=r.path;if(typeof r.text==='string'&&r.text.length<=3000)result.automaticReferences[tone].text=r.text;}}
 return result;
}
export function emotionVoiceTone(emotion?:string|null):VoiceTone{switch(emotion?.toLowerCase()){case 'happy':case 'excited':case 'cheerful':return 'cheerful';case 'worried':return 'worried';case 'sad':return 'sad';case 'angry':return 'angry';case 'gentle':case 'sleepy':case 'embarrassed':return 'gentle';default:return 'default';}}
export function voiceReference(config:CustomVoiceSettings,emotion?:string|null):VoiceReference{return config.preset==='automatic'?config.automaticReferences[emotionVoiceTone(emotion)]:config.preset==='default'?{path:config.referencePath,text:config.referenceText}:config.references[config.preset];}
export function loadCustomVoice(){try{const raw=JSON.parse(readStored('mana.custom_voice.v1')??'null');const config=validateCustomVoice(raw);if(raw&&typeof raw==='object'&&!Object.prototype.hasOwnProperty.call(raw,'automaticReferences'))config.preset='automatic';return config;}catch{return validateCustomVoice(null);}}
export function saveCustomVoice(settings:CustomVoiceSettings){writeStored('mana.custom_voice.v1',JSON.stringify(validateCustomVoice(settings)));}
export function waveBytes(base64:string):Uint8Array{if(base64.length>16000000)throw Error('Generated audio is too large.');const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));if(bytes.length<44||String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WAVE')throw Error('Voice service did not return WAV audio.');return bytes;}
export function audioMouth(samples:Float32Array,offset:number,rate:number,text:string,duration:number):'a'|'e'|'i'|'o'|'u'|null{const start=Math.max(0,Math.floor(offset*rate));let energy=0,count=0;for(let i=start;i<Math.min(samples.length,start+Math.floor(rate*0.04));i++){energy+=samples[i]*samples[i];count++;}if(!count||Math.sqrt(energy/count)<0.015)return null;const vowels=text.toLowerCase().match(/[aeiou]/g)??['a'];return vowels[Math.min(vowels.length-1,Math.floor(offset/Math.max(0.01,duration)*vowels.length))] as 'a'|'e'|'i'|'o'|'u';}

export function customSpeechText(text:string,config:CustomVoiceSettings):string{return (config.preset==='legacy'||config.preset==='automatic')&&config.replyLanguage==='en'?text.replace(/\bAishi\b/gi,'Eye-shee'):text;}

export function customSpeechRate(rate:number,config:CustomVoiceSettings):number{return Math.max(-10,Math.min(10,rate+(config.preset==='legacy'&&config.legacyDelivery==='cheerful'?2:0)));}
