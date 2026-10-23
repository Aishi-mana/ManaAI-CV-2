from pathlib import Path
p=Path('src/core/imageGeneration.ts');s=p.read_text().replace('referenceMask?:string}','referenceMask?:string;characterReference?:boolean}',1)
s=s.replace("n<=1024&&n%64===0", "n<=(isQwenModel(value.model)?1280:1024)&&n%(isQwenModel(value.model)?16:64)===0",1)
s=s.replace(" if(!value.model", " if(value.characterReference!==undefined&&typeof value.characterReference!=='boolean')throw Error('Choose a valid character reference.');if(isQwenModel(value.model)&&(value.cpu||value.reference||value.referenceMask||value.width*value.height>1_310_720))throw Error('Qwen needs GPU mode, its character sheet reference and an image up to 1.3 megapixels.');if(value.characterReference&&!isQwenModel(value.model))throw Error('Character sheet references require Qwen.');\n if(!value.model",1)
s=s.replace("'animagine'|'photon';", "'animagine'|'photon'|'qwen';",1)
s=s.replace('netayume|animagine|stable diffusion|photon','netayume|animagine|stable diffusion|photon|qwen',1)
s=s.replace("netayume:'neta',", "qwen:'qwen',netayume:'neta',",1).replace("as 'netayume'|", "as 'qwen'|'netayume'|",1)
s=s.replace(" if(choice==='neta')", " if(choice==='qwen')return models.find(m=>m.kind==='qwen');\n if(choice==='neta')",1)
s=s.replace('export function outfitQualityDefaults(model:string,enabled:boolean,prompt=""){return ', 'export function outfitQualityDefaults(model:string,enabled:boolean,prompt=""){if(isQwenModel(model))return {steps:4,cfg:1,referenceStrength:.45};return ',1)
s+='''
export function isQwenModel(model:string){return model==='Qwen-Rapid-AIO-SFW-v23.safetensors';}
export function qwenArtworkPrompt(prompt:string,reference:boolean){return reference?'Create a new polished anime artwork of the same single character Mana shown in the reference turnaround sheet. Preserve her recognizable face, blue eyes, long silver-white hair and X-shaped hair clip, except for changes explicitly requested. Generate a coherent new pose, outfit and scene as requested, not a collage or character sheet. The green backdrop and labels are not part of the artwork. Requested artwork: '+prompt.replace(/\\byourself\\b/gi,'Mana'):prompt;}
export function pictureModelDimensions(kind:string,reference=false){return kind==='qwen'?{width:1280,height:720}:kind==='sd1'?{width:512,height:reference?768:512}:{width:reference?768:1024,height:1024};}
export function pictureModelReady(kind:string,discovery:{engineReady:boolean;netaReady:boolean;qwenReady?:boolean}){return kind==='qwen'?!!discovery.qwenReady:kind==='neta'?discovery.netaReady:kind!=='unsupported'&&discovery.engineReady;}
'''
p.write_text(s)
p=Path('src/components/ImageGenerationDrawer.tsx');s=p.read_text().replace('imageGenerationRequest,freshPictureSeed','imageGenerationRequest,isQwenModel,qwenArtworkPrompt,pictureModelDimensions,pictureModelReady,freshPictureSeed',1)
s=s.replace('netaReady:boolean;folder','netaReady:boolean;qwenReady?:boolean;qwenReferenceReady?:boolean;folder',1)
s=s.replace("width:referenceEnabled?(chosen?.kind==='sd1'?512:768):(chosen?.kind==='sd1'?512:1024),height:referenceEnabled?(chosen?.kind==='sd1'?768:1024):(chosen?.kind==='sd1'?512:1024),", "...pictureModelDimensions(chosen?.kind??'',referenceEnabled),",1)
s=s.replace("(chosen.kind==='neta'?!d.netaReady:!d.engineReady)","!pictureModelReady(chosen.kind,d)",1)
s=s.replace('    if(clothingOnly){',"    if(isQwenModel(clean.model)){if(referenceEnabled&&!clothingOnly&&!discovery?.qwenReferenceReady)throw Error('Mana’s turnaround sheet is missing. Turn off the character reference or restore the sheet.');clean=imageGenerationRequest({...clean,characterReference:referenceEnabled&&!clothingOnly,prompt:clothingOnly?clothingOnlyPrompt(clean.prompt,clean.model):qwenArtworkPrompt(clean.prompt,referenceEnabled),negative:clothingOnly?clothingOnlyNegative(clean.negative):clean.negative});}\n    else if(clothingOnly){",1)
s=s.replace("selected.kind!=='unsupported'&&(selected.kind==='neta'?discovery?.netaReady:discovery?.engineReady)","pictureModelReady(selected.kind,discovery!),qwen=isQwenModel(request.model)",1)
s=s.replace("Using Mana’s current avatar {clothingEdit?'· clothing-only edit ':''}· variation {request.referenceStrength??.45}","{qwen?'Using Mana’s turnaround sheet · new artwork':<>Using Mana’s current avatar {clothingEdit?'· clothing-only edit ':''}· variation {request.referenceStrength??.45}</>}",1)
s=s.replace('Local Stable Diffusion and standalone NetaYume.','Local Stable Diffusion, NetaYume and Qwen artwork.',1)
s=s.replace("width:m?.kind==='sd1'?512:1024,height:m?.kind==='sd1'?512:1024,", "...pictureModelDimensions(m?.kind??'',referenceEnabled),cpu:m?.kind==='qwen'?false:r.cpu,",1)
old="{discovery?.models.map(m=><option key={m.name} value={m.name} disabled={m.kind==='unsupported'}>{m.name} · {m.kind==='neta'?'NetaYume standalone':m.kind==='sdxl'?'SDXL':m.kind==='sd1'?'Stable Diffusion':'not supported here'}</option>)}"
new="{(['qwen','neta','sdxl','sd1','unsupported'] as const).map(kind=><optgroup key={kind} label={({qwen:'Qwen · reference artwork',neta:'NetaYume',sdxl:'SDXL · Animagine',sd1:'Stable Diffusion · Photon',unsupported:'Other checkpoints'})[kind]}>{discovery?.models.filter(m=>m.kind===kind).map(m=><option key={m.name} value={m.name} disabled={!pictureModelReady(m.kind,discovery!)}>{m.name}{pictureModelReady(m.kind,discovery!)?'':' · unavailable'}</option>)}</optgroup>)}"
assert old in s;s=s.replace(old,new,1)
s=s.replace('Use Mana’s current avatar as a starting image',"{qwen?'Use Mana’s turnaround sheet as character reference':'Use Mana’s current avatar as a starting image'}",1)
s=s.replace('Uses a detailed portrait reference and preserves her features where possible. Results may still change her features. Outfit designs are concept pictures; they are not wearable avatar layers.',"{qwen?'Qwen draws a fresh artwork using her character sheet. You can request a different pose, outfit and background. Four steps and guidance 1 match the tested workflow.':'Uses a detailed portrait reference and preserves her features where possible. Results may still change her features. Outfit designs are concept pictures; they are not wearable avatar layers.'}",1)
s=s.replace('!clothingOnly&&referenceEnabled&&prepareClothingMask','!qwen&&!clothingOnly&&referenceEnabled&&prepareClothingMask',1)
s=s.replace('!clothingOnly&&referenceEnabled&&clothingEdit','!qwen&&!clothingOnly&&referenceEnabled&&clothingEdit')
s=s.replace('!clothingOnly&&referenceEnabled&&<label className="field">Reference variation','!qwen&&!clothingOnly&&referenceEnabled&&<label className="field">Reference variation',1)
s=s.replace("key==='cfg'?15:1024", "key==='cfg'?15:qwen?1280:1024",1).replace("key==='height'?64:key==='cfg'", "key==='height'?(qwen?16:64):key==='cfg'",1)
s=s.replace('<label className="check"><input type="checkbox" checked={request.cpu}', '<label className="check"><input type="checkbox" disabled={qwen} checked={request.cpu}',1)
s=s.replace("p.stage==='encoding'?'Reading picture description…'", "(p.stage==='encoding'||p.stage==='encoding_reference')?'Reading picture description and reference…'",1)
p.write_text(s)
