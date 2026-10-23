from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');a=s.index("test('Qwen chat launch uses character conditioning without avatar masks'");b=s.index('\n});',a)+4;t=s[a:b]
t=t.replace('Qwen chat launch uses character conditioning without avatar masks','Qwen current-avatar chat reference snapshots dressed layers without requiring the sheet')
t=t.replace('qwenReferenceReady:true','qwenReferenceReady:false')
t=t.replace("backend:'qwen',referenceAvatar:true","backend:'qwen',referenceAvatar:true,qwenReferenceSource:'avatar'")
t=t.replace("prepareReference:async()=>assert.fail('Qwen must not prepare an avatar')","prepareReference:async(signal,clothing,accessories)=>{assert.equal(clothing,false);assert.equal(accessories,true);return 'data:image/jpeg;base64,/9j/AA==';}")
t=t.replace('request.reference,undefined',"request.reference,'data:image/jpeg;base64,/9j/AA=='").replace('request.characterReference,true','request.characterReference,false')
p.write_text(s+'\n'+t+'''

test('Qwen current avatar routing follows reference features rather than fixed colors',()=>{
 const g=loader()('src/core/imageGeneration.ts');const r=g.requestedPicture('Draw yourself reading using your current avatar using Qwen');assert.equal(r.backend,'qwen');assert.equal(r.qwenReferenceSource,'avatar');assert.equal(r.referenceAvatar,true);assert.equal(r.prompt,'yourself reading');
 const p=g.qwenArtworkPrompt(r.prompt,true,'avatar');assert.match(p,/current avatar image/);assert.ok(!p.includes('silver'));assert.ok(!p.includes('blue eyes'));assert.ok(!p.includes('green backdrop'));
 const req={model:'Qwen-Rapid-AIO-SFW-v23.safetensors',prompt:'artwork',negative:'',width:1280,height:720,steps:4,cfg:1,seed:42,cpu:false,characterReference:false,reference:'data:image/jpeg;base64,/9j/AA=='};assert.equal(g.imageGenerationRequest(req).reference,req.reference);assert.throws(()=>g.imageGenerationRequest({...req,characterReference:true}));
});
''',encoding='utf-8')
