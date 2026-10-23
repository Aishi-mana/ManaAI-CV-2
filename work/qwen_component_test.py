from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text();a=s.index("test('chat picture launch selects NetaYume");b=s.index("\n});",a)+4;t=s[a:b]
t=t.replace('chat picture launch selects NetaYume starts once and reports only the completed result','Qwen chat launch uses character conditioning without avatar masks')
t=t.replace("[{name:'photon_v1.safetensors',kind:'sd1'},{name:'NetaYume.safetensors',kind:'neta'}]","[{name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'}]")
t=t.replace('engineReady:true,netaReady:true','engineReady:false,netaReady:false,qwenReady:true,qwenReferenceReady:true')
t=t.replace("prompt:'a moonlit garden',backend:'neta'","prompt:'yourself in a blue summer dress',backend:'qwen'")
t=t.replace("prepareReference:async()=> 'data:image/jpeg;base64,/9j/AA=='","prepareReference:async()=>assert.fail('Qwen must not prepare an avatar'),prepareClothingMask:async()=>assert.fail('Qwen must not prepare a clothing mask')")
t=t.replace("'NetaYume.safetensors'","'Qwen-Rapid-AIO-SFW-v23.safetensors'").replace('request.width,768','request.width,1280').replace('request.height,1024','request.height,720').replace('request.cfg,4','request.cfg,1')
t=t.replace("assert.equal(starts[0].args.request.reference,'data:image/jpeg;base64,/9j/AA==');","assert.equal(starts[0].args.request.reference,undefined);assert.equal(starts[0].args.request.referenceMask,undefined);assert.equal(starts[0].args.request.characterReference,true);assert.equal(starts[0].args.request.steps,4);")
p.write_text(s+'\n'+t+'\n')
