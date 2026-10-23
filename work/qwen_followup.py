from pathlib import Path
p=Path('src/components/ImageGenerationDrawer.tsx');s=p.read_text().replace('\ufffd','-')
a=s.index('<p className="hint-soft">Using Mana');b=s.index('</p>',a)
s=s[:a]+'''<p className="hint-soft">{qwen?'Using Mana\u2019s turnaround sheet - new artwork':<>Using Mana\u2019s current avatar {clothingEdit?' - clothing-only edit ':''} - variation {request.referenceStrength??.45}</>}</p>'''+s[b+4:]
a=s.index('/>Use Mana');b=s.index('</label>',a)
s=s[:a]+'''/>{qwen?'Use Mana\u2019s turnaround sheet as character reference':'Use Mana\u2019s current avatar as a starting image'}'''+s[b:]
s=s.replace('!clothingOnly&&prepareReference&&<label','!clothingOnly&&(qwen||prepareReference)&&<label',1)
p.write_text(s)
p=Path('src-tauri/src/image_generation.rs');s=p.read_text().replace('dimensions 128–1024 in multiples of64','valid image dimensions (SD/Neta: 128–1024, multiples of64; Qwen: up to1280, multiples of16, at most1.3MP)');p.write_text(s)
# Reuse the existing asynchronous component harness to verify actual Qwen launch.
p=Path('tests/foundation.test.cjs');s=p.read_text();a=s.index("test('chat picture launch selects NetaYume");b=s.index("\n});",a)+4;t=s[a:b]
t=t.replace('chat picture launch selects NetaYume starts once and reports only the completed result','Qwen chat launch uses character conditioning without avatar masks')
t=t.replace("[{name:'photon_v1.safetensors',kind:'sd1'},{name:'NetaYume.safetensors',kind:'neta'}]","[{name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'}]")
t=t.replace('engineReady:true,netaReady:true','engineReady:false,netaReady:false,qwenReady:true,qwenReferenceReady:true')
t=t.replace("prompt:'a moonlit garden',backend:'neta'","prompt:'yourself in a blue summer dress',backend:'qwen'")
t=t.replace("prepareReference:async()=> 'data:image/jpeg;base64,/9j/AA=='","prepareReference:async()=>assert.fail('Qwen must not prepare an avatar'),prepareClothingMask:async()=>assert.fail('Qwen must not prepare a clothing mask')")
t=t.replace("'NetaYume.safetensors'","'Qwen-Rapid-AIO-SFW-v23.safetensors'").replace('request.width,768','request.width,1280').replace('request.height,1024','request.height,720').replace('request.cfg,4','request.cfg,1')
t=t.replace("assert.equal(starts[0].args.request.reference,'data:image/jpeg;base64,/9j/AA==');","assert.equal(starts[0].args.request.reference,undefined);assert.equal(starts[0].args.request.referenceMask,undefined);assert.equal(starts[0].args.request.characterReference,true);assert.equal(starts[0].args.request.steps,4);")
p.write_text(s+'\n'+t+'\n')
