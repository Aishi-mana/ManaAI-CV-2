from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'src/core/customVoice.ts'
s=p.read_text(encoding='utf-8-sig')
s="import {validVoiceProfile,voiceProfile,type VoiceProfileId} from './voiceProfiles';\n"+s
s=s.replace('export interface CustomVoiceSettings{trainedChat:boolean;', 'export interface CustomVoiceSettings{chatVoiceProfile:VoiceProfileId;singingVoiceProfile:VoiceProfileId;trainedChat:boolean;')
s=s.replace('export const DEFAULT_CUSTOM:CustomVoiceSettings={trainedChat:true,',"export const DEFAULT_CUSTOM:CustomVoiceSettings={chatVoiceProfile:'mana-trained-v1',singingVoiceProfile:'mana-trained-v1',trainedChat:true,")
s=s.replace(" if(typeof v.trainedChat==='boolean')result.trainedChat=v.trainedChat;", " if(validVoiceProfile(v.chatVoiceProfile))result.chatVoiceProfile=v.chatVoiceProfile;\n else if(v.trainedChat===false)result.chatVoiceProfile='mana-reference';\n if(validVoiceProfile(v.singingVoiceProfile))result.singingVoiceProfile=v.singingVoiceProfile;\n result.trainedChat=voiceProfile(result.chatVoiceProfile).engine==='trained';")
s+="\nexport function singingVoiceReference(config:CustomVoiceSettings):string{const profile=voiceProfile(config.singingVoiceProfile);return profile.engine==='trained'?profile.reference:voiceReference(config).path;}\n"
p.write_text(s,encoding='utf-8')
p=root/'src/components/CustomVoiceSetup.tsx'
s=p.read_text(encoding='utf-8-sig')
s="import VoiceProfileSelect from './VoiceProfileSelect';\nimport {type VoiceProfileId,voiceProfile} from '../core/voiceProfiles';\n"+s
s=s.replace(' function trained(enabled:boolean){const next={...config,trainedChat:enabled};setConfig(next);saveCustomVoice(next);}'," function chooseProfile(key:'chatVoiceProfile'|'singingVoiceProfile',id:VoiceProfileId){const next={...config,[key]:id,...(key==='chatVoiceProfile'?{trainedChat:voiceProfile(id).engine==='trained'}:{})};setConfig(next);saveCustomVoice(next);}")
start=s.index('<label style={{display:\'block\'}}><input type="checkbox" checked={config.trainedChat}')
end=s.index('<p className="hint-soft">Local GPT-SoVITS',start)
s=s[:start]+'''<VoiceProfileSelect label="Chat voice" value={config.chatVoiceProfile} disabled={disabled||starting} onChange={id=>chooseProfile('chatVoiceProfile',id)}/><VoiceProfileSelect label="Singing voice" value={config.singingVoiceProfile} disabled={disabled||starting} onChange={id=>chooseProfile('singingVoiceProfile',id)}/><p className="hint-soft">Choose chat and singing voices separately. The trained chat voice stays ready between replies; reference voice uses your selected reference below. Japanese chat uses the reference voice. Singing choices affect new conversions.</p>'''+s[end:]
p.write_text(s,encoding='utf-8')
p=root/'src/core/useSpeech.ts'
s=p.read_text(encoding='utf-8-sig').replace('trainedVoice:config.trainedChat,','voiceProfile:config.chatVoiceProfile,trainedVoice:config.trainedChat,')
p.write_text(s,encoding='utf-8')
p=root/'src/core/musicStudio.ts'
s=p.read_text(encoding='utf-8-sig')
s="import {TRAINED_MANA_MODEL} from './voiceProfiles';\n"+s
start=s.index('export const TRAINED_SINGING_VOICE=')
end=s.index('\n',start)
s=s[:start]+'export const TRAINED_SINGING_VOICE=TRAINED_MANA_MODEL;'+s[end:]
p.write_text(s,encoding='utf-8')
p=root/'src/components/SingingDrawer.tsx'
s=p.read_text(encoding='utf-8-sig')
s="import VoiceProfileSelect from './VoiceProfileSelect';\nimport {type VoiceProfileId,voiceProfile} from '../core/voiceProfiles';\n"+s
s=s.replace('loadCustomVoice,voiceReference','loadCustomVoice,saveCustomVoice,singingVoiceReference')
s=s.replace('singingVoiceLabel,TRAINED_SINGING_VOICE,','singingVoiceLabel,')
s=s.replace('[singingReference,setSingingReference]=useState(true)',"[singingProfile,setSingingProfile]=useState<VoiceProfileId>(()=>loadCustomVoice().singingVoiceProfile)")
s=s.replace('reference=singingReference?TRAINED_SINGING_VOICE:voiceReference(config).path', 'reference=singingVoiceReference({...config,singingVoiceProfile:singingProfile})')
s=s.replace("invoke('singing_start',{python:config.singingPython,repo:config.singingRepo,source,reference,", "invoke('singing_start',{voiceProfile:singingProfile,python:config.singingPython,repo:config.singingRepo,source,reference,")
start=s.index('<label className="studio-check"><input type="checkbox" checked={singingReference}')
end=s.index('<label className="field">Original backing',start)
s=s[:start]+'''<VoiceProfileSelect label="Singing voice" value={singingProfile} disabled={blocked} onChange={id=>{setSingingProfile(id);saveCustomVoice({...loadCustomVoice(),singingVoiceProfile:id});}}/><p className="hint-soft">This choice is separate from chat and applies to new covers.</p>'''+s[end:]
s=s.replace("{singingReference?'Trained Mana v1 · original melody and timing.':'Reference conversion · selected chat reference; configure in Chat → Voice.'}","{voiceProfile(singingProfile).name}")
# Refresh the persisted selection when returning from Chat -> Voice setup.
s=s.replace(' const [busy,setBusy]='," useEffect(()=>{if(p.active)setSingingProfile(loadCustomVoice().singingVoiceProfile);},[p.active]);\n const [busy,setBusy]=",1)
p.write_text(s,encoding='utf-8')
p=root/'src/components/CoverBuilder.tsx'
s=p.read_text(encoding='utf-8-sig')
s="import VoiceProfileSelect from './VoiceProfileSelect';\nimport {type VoiceProfileId} from '../core/voiceProfiles';\n"+s
s=s.replace('StudioProject,SINGING_REFERENCE,TRAINED_SINGING_VOICE','StudioProject,SINGING_REFERENCE')
s=s.replace("import {loadCustomVoice} from '../core/customVoice';","import {loadCustomVoice,saveCustomVoice,singingVoiceReference} from '../core/customVoice';")
s=s.replace(' const [harmonySections,'," const [singingProfile,setSingingProfile]=useState<VoiceProfileId>(()=>loadCustomVoice().singingVoiceProfile);\n const [harmonySections,",1)
s=s.replace("const config=loadCustomVoice();setMessage('Converting your clean vocal to Mana…');", "const config={...loadCustomVoice(),singingVoiceProfile:singingProfile};const reference=singingVoiceReference(config);setMessage('Converting your clean vocal…');")
s=s.replace('source:t.originalPath,reference:TRAINED_SINGING_VOICE', 'source:t.originalPath,reference,voiceProfile:singingProfile')
s=s.replace('voiceReference:TRAINED_SINGING_VOICE','voiceReference:reference')
s=s.replace('<div className="builder-workbench">', '''<VoiceProfileSelect label="Singing voice for new conversions" value={singingProfile} disabled={blocked} onChange={id=>{setSingingProfile(id);saveCustomVoice({...loadCustomVoice(),singingVoiceProfile:id});}}/><div className="builder-workbench">''',1)
p.write_text(s,encoding='utf-8')
print('Named chat and singing voice selectors added.')
