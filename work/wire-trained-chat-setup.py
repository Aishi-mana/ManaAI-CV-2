from pathlib import Path
p=Path(__file__).resolve().parents[1]/'src/components/CustomVoiceSetup.tsx'
s=p.read_text(encoding='utf-8-sig')
s=s.replace(' function updateReference('," function trained(enabled:boolean){const next={...config,trainedChat:enabled};setConfig(next);saveCustomVoice(next);}\n function updateReference(",1)
needle='<summary>Custom voice and singing setup</summary>'
assert needle in s
s=s.replace(needle,needle+"<label style={{display:'block'}}><input type=\"checkbox\" checked={config.trainedChat} disabled={disabled||starting} onChange={e=>trained(e.target.checked)}/> Use trained Mana voice for English chat</label><p className=\"hint-soft\">Keeps the approved voice converter ready between replies. Adds a few seconds of processing. Turn this off to return to the reference voice. Japanese replies use the reference voice.</p>",1)
p.write_text(s,encoding='utf-8')
