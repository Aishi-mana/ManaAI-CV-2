const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('src/core/generatedOutfits.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObject={};vm.runInNewContext(source,{exports:exportsObject,Math,Error});
test('hidden fabric protection uses selected front hair above the outfit, excluding back hair and accessories',()=>{
 const back={key:'hairstyles/chosen/hair_back.png'},front={key:'hairstyles/chosen/hair_front.png'},ahoge={key:'hairstyles/chosen/hair_ahoge.png'};
 const layers=[back,{key:'base/body.png'},{key:'outfits/chosen/outfit.png'},front,ahoge,{key:'accessories/clip.png'}];
 const selected=exportsObject.outfitFrontHairLayers(layers);
 assert.equal(selected.length,2);assert.equal(selected[0],front);assert.equal(selected[1],ahoge);
 assert.equal(exportsObject.outfitFrontHairLayers([back,front]).length,0);
});
test('outfit creation preserves the referenced avatar geometry before extraction',()=>{const prompt=exportsObject.outfitCreationPrompt('Blue sailor outfit');assert.match(prompt,/complete clothing including both shoulders/);assert.match(prompt,/CLOTHING ONLY/);assert.match(prompt,/reference contains garments only/);assert.match(prompt,/no body/);assert.match(prompt,/Complete shoe|complete shoe/);assert.throws(()=>exportsObject.outfitCreationPrompt(' '));assert.throws(()=>exportsObject.outfitCreationPrompt('x'.repeat(1001)));});
test('review previews replace the outfit while preserving the body and front hair order',()=>{const layers=[{key:'base/body.png',url:'body'},{key:'outfits/old/outfit.png',url:'old'},{key:'hairstyles/default/hair_front.png',url:'hair'}];const result=exportsObject.designPreviewLayers(layers,'pending');assert.equal(result[0].url,'body');assert.equal(result[1].url,'pending');assert.equal(result[2].url,'hair');assert.equal(layers[1].url,'old');});
test('Mana can choose complete default outfit ideas without user text',()=>{for(const value of [0,.5,.999]){const idea=exportsObject.defaultOutfitIdea(()=>value);assert.ok(idea.name);assert.match(idea.description,/shoes/);}});

test('skirt requests exclude extra trousers while trouser requests do not force a skirt',()=>{assert.match(exportsObject.outfitCreationPrompt('blue sailor uniform'),/Single lower garment: a pleated knee-length skirt/);assert.match(exportsObject.outfitCreationPrompt('blue trousers and jacket'),/Use only the requested lower garment/);});

test('automatic ideas do not repeat recent combinations even after renaming',()=>{
 const first=exportsObject.defaultOutfitIdea(()=>0);
 const recent=[{name:'My renamed outfit',prompt:exportsObject.outfitCreationPrompt(first.description)}];
 const next=exportsObject.defaultOutfitIdea(()=>0,recent);
 assert.notEqual(next.description,first.description);assert.notEqual(next.name,first.name);
 assert.doesNotMatch(next.description,/sky blue/);assert.doesNotMatch(next.name,/sailor/);
});
test('idea rotation has variety and remains bounded with exhausted history',()=>{
 const history=[];const names=new Set();
 for(let i=0;i<30;i++){const idea=exportsObject.defaultOutfitIdea(()=>0,history);assert.ok(!history.slice(0,24).some(h=>h.name===idea.name));names.add(idea.name);history.unshift({name:idea.name,prompt:idea.description});}
 for(const value of [NaN,-1,1,Infinity])assert.ok(exportsObject.defaultOutfitIdea(()=>value,history).description);
});
test('custom ideas receive readable names while dress requests do not add a second bottom',()=>{
 assert.equal(exportsObject.outfitIdeaName('blue sailor uniform'),'Blue sailor uniform');
 const prompt=exportsObject.outfitCreationPrompt('mint flower dress');assert.match(prompt,/one complete dress/);assert.doesNotMatch(prompt,/Single lower garment: a pleated/);assert.doesNotMatch(prompt,/Keep bare legs/);
 assert.ok(exportsObject.outfitIdeaName('x '.repeat(100)).length<=80);
});

test('seasonal ideas change fabric and sleeves without changing user descriptions',()=>{
 const summer=exportsObject.defaultOutfitIdea(()=>0,[],'summer');assert.match(summer.description,/Summer choice.*short sleeves/);assert.doesNotMatch(summer.name,/cardigan/);
 const winter=exportsObject.defaultOutfitIdea(()=>.999,[],'winter');assert.match(winter.description,/Winter choice.*warm fabric and long sleeves/);assert.doesNotMatch(winter.name,/day dress/);
 assert.match(exportsObject.defaultOutfitIdea(()=>0,[],'spring').description,/Spring choice/);
 assert.match(exportsObject.defaultOutfitIdea(()=>0,[],'autumn').description,/Autumn choice/);
 assert.doesNotMatch(exportsObject.defaultOutfitIdea(()=>0).description,/choice:/);
});
test('creative outfit ideas are free-form validated descriptions with seasonal and recent-design context',()=>{const idea=exportsObject.readCreativeOutfit('<think>plan</think>\n```json\n{"name":"Maple daydream","description":"A rust cotton blouse with long sleeves and a deep teal skirt, cream socks and closed brown shoes"}\n```');assert.equal(idea.name,'Maple daydream');assert.match(idea.description,/rust cotton/);for(const text of ['hello','{}','{"name":"x","description":""}','{"name":"x","description":"'+ 'x'.repeat(1001)+'"}'])assert.throws(()=>exportsObject.readCreativeOutfit(text));const messages=exportsObject.creativeOutfitMessages('Mana','kind',[{name:'Old outfit',prompt:'blue sailor'}],'autumn');assert.match(messages[0].content,/not choosing from a preset/);assert.match(messages[1].content,/autumn/);assert.match(messages[1].content,/Old outfit/);});
test('generation preserves blank head margin and specifies intact comfortably fitted cuffs',()=>{const p=exportsObject.outfitCreationPrompt('a blue coat dress');assert.match(p,/top 29 percent/);assert.match(p,/do not move or center the clothing upward/);assert.match(p,/cuffs around 54 percent/);assert.match(p,/one intact, naturally angled piece/);});

test('outfit presets offer unique editable complete clothing ideas',()=>{const presets=exportsObject.OUTFIT_PRESETS;assert.equal(presets.length,16);assert.equal(new Set(presets.map(p=>p.id)).size,16);for(const p of presets){assert.ok(p.name&&p.description.length<=1000);assert.match(p.description,/socks/i);assert.match(p.description,/shoes|boots|sneakers|slippers|loafers/i);assert.ok(exportsObject.outfitCreationPrompt(p.description).includes(p.description));}});
test('outfit launch accepts clothing-only reference preparation instead of demanding an avatar composite',()=>{const native=fs.readFileSync('src-tauri/src/image_generation.rs','utf8').split('pub fn outfit_generation_start')[1].split('fn start_job')[0];assert.ok(native.includes('png_dimensions(&body)'));assert.ok(native.includes('request.model!=QWEN_MODEL'));assert.ok(!native.includes('reference.is_none()'));const job=fs.readFileSync('scripts/image_job.py','utf8');assert.ok(job.includes('clothing_position_guide'));});

test('automatic outfit pool spans 480 distinct combinations including new silhouettes',()=>{const names=new Set();for(let i=0;i<480;i++)names.add(exportsObject.defaultOutfitIdea(()=>(i+.5)/480).name);assert.equal(names.size,480);for(const style of ['knit set','hoodie set','wrap dress','pajama set','tunic set'])assert.ok([...names].some(n=>n.endsWith(style)));const messages=exportsObject.creativeOutfitMessages('Mana','',[]);assert.match(messages[0].content,/starting direction you may reinterpret freely/);});
