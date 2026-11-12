from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'scripts/singing_job.py'
s=p.read_text(encoding='utf-8-sig')
s=s.replace('def conversion_profile(p):\n',"def conversion_profile(p):\n    if p.get('trained_voice',False):\n        from trained_voice import trained_voice_profile\n        return trained_voice_profile(p.get('data_root',Path(__file__).resolve().parents[1]))\n",1)
start=s.index("    print('Converting guide vocal; pitch and timing conditioning enabled…'")
end=s.index('    if whole_song:\n        complete',start)
old=s[start:end]
new="""    pitch_extractor = None
    traces = []
    steps = None
    if p.get('trained_voice',False):
        print('Converting guide vocal with Mana’s trained voice…',flush=True)
        from trained_voice import TrainedVoice
        converter=TrainedVoice(root)
        converted, converted_sr=converter.convert(vocal.T,sr)
        target=out/'vc_mana-trained-v1.wav'
        sf.write(target,converted,converted_sr,subtype='PCM_16')
        generated=[target]
    else:
"""+''.join('    '+line if line.strip() else line for line in old.splitlines(keepends=True))
s=s[:start]+new+s[end:]
s=s.replace("'diffusionSteps':steps,'pitchSmoothing':bool(p.get('pitch_smoothing',False)),'voiceProfile':profile", "'diffusionSteps':steps,'pitchSmoothing':profile['pitchSmoothing'],'voiceProfile':profile")
p.write_text(s,encoding='utf-8')
# Existing reference opt-out still uses the earlier converter. New covers select
# the pinned model path, so saved-song metadata remains truthful.
p=root/'src/core/musicStudio.ts'
s=p.read_text(encoding='utf-8-sig')
s=s.replace("export const SINGING_REFERENCE=", "export const TRAINED_SINGING_VOICE='C:/AI/ManaAI-CV-2/data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth';\nexport const SINGING_REFERENCE=",1)
s=s.replace("return file==='singing-stable-v1.wav'?", "return file==='mana-current-trial-v1_50e_2800s.pth'?'Trained Mana voice v1 · 50 passes':file==='singing-stable-v1.wav'?")
p.write_text(s,encoding='utf-8')
p=root/'src/components/SingingDrawer.tsx'
s=p.read_text(encoding='utf-8-sig').replace('singingVoiceLabel,SINGING_REFERENCE,','singingVoiceLabel,TRAINED_SINGING_VOICE,')
s=s.replace('reference=singingReference?SINGING_REFERENCE:', 'reference=singingReference?TRAINED_SINGING_VOICE:')
s=s.replace('Use Mana’s stable voice (recommended)','Use Mana’s trained voice (recommended)')
s=s.replace('Uses the same approved voice reference for every cover, independent of her chat mood.', 'Uses the approved 50-pass Mana model for consistent singing, independent of her chat mood.')
s=s.replace('Voice: Zero-shot Seed-VC · 50 steps · gentle pitch smoothing. {singingReference?\'Mana singing reference.\':\'Selected chat reference; configure in Chat → Voice.\'}', "Voice: {singingReference?'Trained Mana v1 · original melody and timing.':'Reference conversion · selected chat reference; configure in Chat → Voice.'}")
p.write_text(s,encoding='utf-8')
p=root/'src/core/coverBuilder.ts'
s=p.read_text(encoding='utf-8-sig').replace('converted:boolean;replacement?', 'converted:boolean;voiceReference?:string;replacement?')
s=s.replace('converted:t.converted===true,replacement:', "converted:t.converted===true,voiceReference:typeof t.voiceReference==='string'?t.voiceReference.slice(0,1000):undefined,replacement:")
p.write_text(s,encoding='utf-8')
p=root/'src/components/CoverBuilder.tsx'
s=p.read_text(encoding='utf-8-sig').replace('StudioProject,SINGING_REFERENCE}', 'StudioProject,SINGING_REFERENCE,TRAINED_SINGING_VOICE}')
s=s.replace('reference:SINGING_REFERENCE,start:0', 'reference:TRAINED_SINGING_VOICE,start:0')
s=s.replace('converted:true,seconds:result.seconds', 'converted:true,voiceReference:TRAINED_SINGING_VOICE,seconds:result.seconds')
s=s.replace('vocalGain:1,reference:SINGING_REFERENCE', 'vocalGain:1,reference:v?.t.voiceReference??SINGING_REFERENCE')
p.write_text(s,encoding='utf-8')
p=root/'src-tauri/src/singing.rs'
s=p.read_text(encoding='utf-8-sig')
needle='    if !Path::new(&repo).join("inference.py").is_file() {'
replacement='''    let trained_voice = harmony_key.is_none() && reference.replace('\\\\', "/").eq_ignore_ascii_case(&format!("{}/data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth",root.to_string_lossy().replace('\\\\', "/")));

    if !trained_voice && !Path::new(&repo).join("inference.py").is_file() {'''
assert needle in s
s=s.replace(needle,replacement,1)
s=s.replace('json!({"harmony_key":harmony_key,"harmony_direction":harmony_direction,"data_root":root,"repo":repo,', 'json!({"trained_voice":trained_voice,"harmony_key":harmony_key,"harmony_direction":harmony_direction,"data_root":root,"repo":repo,',1)
p.write_text(s,encoding='utf-8')
p=root/'src-tauri/tauri.conf.json'
s=p.read_text(encoding='utf-8-sig').replace('"../scripts/singing_job.py": "scripts/singing_job.py",', '"../scripts/singing_job.py": "scripts/singing_job.py",\n      "../scripts/trained_voice.py": "scripts/trained_voice.py",')
p.write_text(s,encoding='utf-8')
print('Trained singing route wired; harmony and earlier saved metadata preserved.')
