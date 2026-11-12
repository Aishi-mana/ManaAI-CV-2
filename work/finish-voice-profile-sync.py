from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'src/components/CoverBuilder.tsx'
s=p.read_text(encoding='utf-8-sig')
needle=" const [singingProfile,setSingingProfile]=useState<VoiceProfileId>(()=>loadCustomVoice().singingVoiceProfile);"
s=s.replace(needle,needle+"\n useEffect(()=>{if(p.active)setSingingProfile(loadCustomVoice().singingVoiceProfile);},[p.active]);")
s=s.replace('converted:false})}>Use original voice','converted:false,voiceReference:undefined})}>Use original voice')
s=s.replace('Convert to Mana','Convert to selected voice').replace("setMessage('Mana vocal ready. Preview it, then add your instruments.');","setMessage('Vocal ready. Preview it, then add your instruments.');")
p.write_text(s,encoding='utf-8')
p=root/'src/components/SingingDrawer.tsx'
s=p.read_text(encoding='utf-8-sig')
s=s.replace(' useEffect(()=>{if(p.active)setSingingProfile(loadCustomVoice().singingVoiceProfile);},[p.active]);\n','')
needle=" const track=selected?(mode==='mix'?selected.mix||selected.vocal:mode==='vocal'?selected.vocal:selected.instrumental):'';"
s=s.replace(needle," useEffect(()=>{if(p.active&&tab==='create')setSingingProfile(loadCustomVoice().singingVoiceProfile);},[p.active,tab]);\n"+needle)
p.write_text(s,encoding='utf-8')
p=root/'src/components/CustomVoiceSetup.tsx'
s=p.read_text(encoding='utf-8-sig').replace('const next={...config,[key]:id,', 'const next={...loadCustomVoice(),[key]:id,')
s=s.replace('const next={...config,[key]:key===', 'const next={...loadCustomVoice(),[key]:key===')
s=s.replace('<details className="custom-voice-setup">', '<details className="custom-voice-setup" onToggle={e=>{if(e.currentTarget.open)setConfig(loadCustomVoice());}}>')
p.write_text(s,encoding='utf-8')
