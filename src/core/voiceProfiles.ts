// Register a voice here after its local assets and converter route are installed.
// Chat and singing store independent profile IDs; saved audio keeps its original voice.
export const TRAINED_MANA_MODEL='C:/AI/ManaAI-CV-2/data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth';
export const TRAINED_MOUSEY_MODEL='C:/AI/ManaAI-CV-2/data/applio-training/engine/logs/mousey-v2-trial-v1/mousey-v2-trial-v1_50e_8300s.pth';
export const VOICE_PROFILES=[
 {id:'mana-trained-v1',name:'Mana · trained',engine:'trained',reference:TRAINED_MANA_MODEL},
 {id:'mousey-trained-v2',name:'Mousey v2 · trained',engine:'trained',reference:TRAINED_MOUSEY_MODEL},
 {id:'mana-reference',name:'Mana · reference voice',engine:'reference',reference:''},
] as const;
export type VoiceProfileId=typeof VOICE_PROFILES[number]['id'];
export function validVoiceProfile(value:unknown):value is VoiceProfileId{return VOICE_PROFILES.some(p=>p.id===value);}
export function voiceProfile(id:VoiceProfileId){const profile=VOICE_PROFILES.find(p=>p.id===id);if(!profile)throw Error('Voice profile is not installed.');return profile;}
