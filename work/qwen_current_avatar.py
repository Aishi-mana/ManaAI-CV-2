from pathlib import Path
p=Path('src/core/imageGeneration.ts');s=p.read_text(encoding='utf-8')
s=s.replace('value.cpu||value.reference||value.referenceMask||','value.cpu||value.referenceMask||(value.reference&&value.characterReference)||',1)
s=s.replace('its character sheet reference','one character reference',1)
s=s.replace('clothingOnly?:boolean}',"clothingOnly?:boolean;qwenReferenceSource?:'sheet'|'avatar'}",1)
s=s.replace(' const referenceAvatar='," const qwenReferenceSource=backend==='qwen'&&/\\b(?:using|from|based on|as) (?:your |the )?current avatar\\b/i.test(prompt)?'avatar':undefined;\n if(qwenReferenceSource)prompt=prompt.replace(/\\b(?:using|from|based on|as) (?:your |the )?current avatar\\b/i,'').trim();\n const referenceAvatar=",1)
s=s.replace('...(referenceAvatar?{referenceAvatar:true}:{}),','...(referenceAvatar||qwenReferenceSource?{referenceAvatar:true}:{}),...(qwenReferenceSource?{qwenReferenceSource}:{}),',1)
a=s.index('export function qwenArtworkPrompt(');b=s.index('\nexport function pictureModelDimensions',a)
s=s[:a]+'''export function qwenArtworkPrompt(prompt:string,reference:boolean,source:'sheet'|'avatar'='sheet'){return reference?'Create a new polished anime artwork of the same single character shown in the reference '+(source==='sheet'?'turnaround sheet':'current avatar image')+'. Preserve the reference character\u2019s recognizable face, eye color, hair color, hairstyle and distinctive features, except for changes explicitly requested. Generate a coherent new pose, outfit and scene as requested, not a collage or character sheet. Reference backgrounds and labels are not part of the artwork. Requested artwork: '+prompt.replace(/\\byourself\\b/gi,'the reference character'):prompt;}
'''+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('src/components/ImageGenerationDrawer.tsx');s=p.read_text(encoding='utf-8')
s=s.replace(' const [keepSeed,setKeepSeed]'," const [qwenReferenceSource,setQwenReferenceSource]=useState<'sheet'|'avatar'>(initialRequest?.qwenReferenceSource??'sheet');\n const [keepSeed,setKeepSeed]",1)
a=s.index('    if(isQwenModel(clean.model))');b=s.index('\n    else if(clothingOnly)',a)
s=s[:a]+'''    if(isQwenModel(clean.model)){
      const referenced=referenceEnabled&&!clothingOnly;let reference:string|undefined;
      if(referenced&&qwenReferenceSource==='sheet'&&!discovery?.qwenReferenceReady)throw Error('Mana\u2019s turnaround sheet is missing. Choose her current avatar or restore the sheet.');
      if(referenced&&qwenReferenceSource==='avatar'){
        if(!prepareReference)throw Error('Mana\u2019s current avatar is unavailable. Open her avatar first or choose the turnaround sheet.');
        const controller=new AbortController();referenceController.current=controller;
        reference=await prepareReference(controller.signal,false,true);
        if(!alive.current||run!==token.current||controller.signal.aborted)return;
      }
      clean=imageGenerationRequest({...clean,characterReference:referenced&&qwenReferenceSource==='sheet',...(reference?{reference}:{}),prompt:clothingOnly?clothingOnlyPrompt(clean.prompt,clean.model):qwenArtworkPrompt(clean.prompt,referenced,qwenReferenceSource),negative:clothingOnly?clothingOnlyNegative(clean.negative):clean.negative});
    }
'''+s[b:]
s=s.replace("qwen?'Using Mana\u2019s turnaround sheet - new artwork'", "qwen?(qwenReferenceSource==='avatar'?'Using current avatar - new artwork':'Using turnaround sheet - new artwork')",1)
s=s.replace("qwen?'Use Mana\u2019s turnaround sheet as character reference'", "qwen?'Use a character reference'",1)
marker='{!clothingOnly&&referenceEnabled&&<p className="hint-soft">'
s=s.replace(marker,'''{qwen&&!clothingOnly&&referenceEnabled&&<label className="field">Character reference<select value={qwenReferenceSource} onChange={e=>setQwenReferenceSource(e.target.value as 'sheet'|'avatar')}><option value="sheet">Mana turnaround sheet</option><option value="avatar" disabled={!prepareReference}>Current avatar (selected outfit and accessories)</option></select></label>}'''+marker,1)
s=s.replace('Qwen draws a fresh artwork using her character sheet.','Qwen draws a fresh artwork using the selected reference. The current avatar follows her selected appearance.',1)
p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/image_generation.rs');s=p.read_text(encoding='utf-8')
s=s.replace('if r.reference.is_some()||r.reference_mask.is_some()', 'if (r.reference.is_some()&&r.character_reference)||r.reference_mask.is_some()',1)
s=s.replace('Qwen uses its character sheet reference, not the clothing edit mask.','Choose one Qwen reference: character sheet or current avatar, without a clothing mask.',1)
# The old test rejected any JPEG; preserve the simultaneous-reference rejection.
s=s.replace('r.reference=Some("data:image/jpeg;base64,/9j/AA==".into());assert!(validate(&r).is_err());r.reference=None;r.model=', 'r.reference=Some("data:image/jpeg;base64,/9j/AA==".into());assert!(validate(&r).is_err());r.character_reference=false;assert!(validate(&r).is_ok());r.reference=None;r.character_reference=true;r.model=',1)
p.write_text(s,encoding='utf-8')
