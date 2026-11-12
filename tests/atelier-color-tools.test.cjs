const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const core={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/outfitPrototype.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText,{exports:core,Math,Error,TextEncoder,Uint8Array,Uint8ClampedArray,Int32Array});
test('background brush protects different colors and stays within its stroke',()=>{
 const pixels=new Uint8ClampedArray([255,255,255,255,20,60,120,255,255,255,255,255,245,245,245,255]);
 const before=pixels.slice(),selected=core.backgroundBrushPixels(pixels,4,1,{x:0,y:0},15,new Uint8ClampedArray([255,255,0,128]));
 assert.deepEqual(Array.from(selected),[255,0,0,128]);assert.deepEqual(pixels,before);
});
test('transparent fill regions ignore invisible RGB but remain connected',()=>{
 const pixels=new Uint8ClampedArray([200,10,100,0,0,255,0,0,20,20,20,255,0,0,0,0]);
 assert.deepEqual(Array.from(core.backgroundPixels(pixels,4,1,{x:0,y:0},0)),[255,255,0,0]);
});
test('fill and sampled eraser survive project selection round trip with validation',()=>{
 const fill={kind:'fill',erase:false,color:'#90bade',points:[{x:5,y:5}],tolerance:12},brush={kind:'background-brush',erase:true,points:[{x:4,y:4},{x:8,y:9}],brushSize:5,tolerance:20};
 const project={name:'Collar cleanup',sourceSize:{width:16,height:16},regions:[fill,brush],transform:{x:0,y:0,scale:1,frame:1}};
 const restored=core.readOutfitSelection(JSON.parse(JSON.stringify(project)),16,16);
 assert.equal(restored.regions[0].color,fill.color);assert.equal(restored.regions[1].kind,brush.kind);
 assert.equal(core.validCut({...fill,color:'red'},16,16),false);assert.equal(core.validCut({...brush,erase:false},16,16),false);
});
