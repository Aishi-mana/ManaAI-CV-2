from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');a=s.index("test('Qwen chat launch uses character conditioning without avatar masks'");b=s.index('\n});',a)+4;t=s[a:b]
t=t.replace('Qwen chat launch uses character conditioning without avatar masks','Qwen outfit design generates separated clothing without attaching the character')
t=t.replace("prompt:'yourself in a blue summer dress',backend:'qwen',referenceAvatar:true","prompt:'a lavender cardigan, white skirt and pair of white shoes',backend:'qwen',referenceAvatar:true,clothingOnly:true")
t=t.replace('request.characterReference,true','request.characterReference,false').replace('/same single character/','/wardrobe design sheet/');p.write_text(s+'\n'+t+'''

test('outfit design defaults to a complete Qwen garment set and preserves requested items',()=>{
 const g=loader()('src/core/imageGeneration.ts'),r=g.outfitDesignRequest();assert.equal(r.backend,'qwen');assert.equal(r.clothingOnly,true);assert.match(r.prompt,/cardigan/);assert.match(r.prompt,/skirt/);assert.match(r.prompt,/pair/);
 const prompt=g.clothingOnlyPrompt(r.prompt,'Qwen-Rapid-AIO-SFW-v23.safetensors');assert.match(prompt,/separate complete pieces/);assert.match(prompt,/generous empty gaps/);assert.match(prompt,/no wearer/);assert.match(prompt,/uniform light-gray background/);
 const dress=g.clothingOnlyPrompt('a red summer dress','Qwen-Rapid-AIO-SFW-v23.safetensors');assert.match(dress,/red summer dress/);assert.ok(!dress.includes('lavender'));assert.ok(!dress.includes('cardigan'));assert.ok(!dress.includes('transparent'));
});
''',encoding='utf-8')
