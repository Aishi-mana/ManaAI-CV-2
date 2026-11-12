from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'src/core/customVoice.ts'
s=p.read_text(encoding='utf-8-sig').replace('export interface CustomVoiceSettings{','export interface CustomVoiceSettings{trainedChat:boolean;',1).replace('export const DEFAULT_CUSTOM:CustomVoiceSettings={','export const DEFAULT_CUSTOM:CustomVoiceSettings={trainedChat:true,',1)
needle=' const result=JSON.parse(JSON.stringify(DEFAULT_CUSTOM)) as CustomVoiceSettings;'
assert needle in s
s=s.replace(needle,needle+"\n if(typeof v.trainedChat==='boolean')result.trainedChat=v.trainedChat;")
p.write_text(s,encoding='utf-8')
p=root/'src/core/useSpeech.ts'
s=p.read_text(encoding='utf-8-sig').replace("invoke('custom_voice_generate',{port:config.port,","invoke('custom_voice_generate',{trainedVoice:config.trainedChat,port:config.port,").replace('const deadline=Date.now()+190000;','const deadline=Date.now()+(config.trainedChat?300000:190000);')
p.write_text(s,encoding='utf-8')
p=root/'src/components/CustomVoiceSetup.tsx'
s=p.read_text(encoding='utf-8-sig')
s=s.replace(' function updateReference('," function trained(enabled:boolean){const next={...config,trainedChat:enabled};setConfig(next);saveCustomVoice(next);}\n function updateReference(",1)
needle='<label style={{display:\'block\'}}>Voice style'
assert needle in s
s=s.replace(needle,"<label style={{display:'block'}}><input type=\"checkbox\" checked={config.trainedChat} disabled={disabled||starting} onChange={e=>trained(e.target.checked)}/> Use trained Mana voice for English chat</label><p className=\"hint-soft\">Keeps the approved voice converter ready between replies. Adds a few seconds of processing. Turn this off to return to the reference voice. Japanese replies use the reference voice.</p>"+needle,1)
p.write_text(s,encoding='utf-8')
print('Enabled trained English chat with a persisted reference-voice opt-out.')
