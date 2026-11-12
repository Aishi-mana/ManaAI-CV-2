const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/core/outfitPrototype.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObject={};vm.runInNewContext(code,{exports:exportsObject,Uint8ClampedArray,Uint8Array,Int32Array,TextEncoder,Math,Error});
function sample(){const a=new Uint8ClampedArray(100*100*4);function rect(x0,y0,x1,y1){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)a[(y*100+x)*4+3]=255;}rect(20,20,80,55);rect(25,80,35,98);rect(65,80,75,98);return {a,rect};}
test('prepared clothing and footwear open as independent layers in their existing body positions',()=>{
 const {a}=sample(),parts=exportsObject.preparedOutfitPieces(a,100,100);assert.equal(parts.length,3);assert.equal(parts[0].name,'Main clothing');assert.equal(parts[1].name,'Left footwear');assert.equal(parts[2].name,'Right footwear');
 for(const p of parts){assert.equal(p.transform.x,0);assert.equal(p.transform.y,0);assert.equal(p.transform.scale,1);assert.equal(p.transform.frame,1);}
 for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(a[(y*100+x)*4+3]){const count=parts.filter(p=>{const r=p.regions[0].points;return x>=r[0].x&&x<r[2].x&&y>=r[0].y&&y<r[2].y;}).length;assert.equal(count,1);}
});
test('small detached buckle belongs to nearest footwear without losing pixels',()=>{
 const {a,rect}=sample();rect(21,88,23,90);const parts=exportsObject.preparedOutfitPieces(a,100,100);assert.equal(parts.length,3);assert.equal(parts[1].regions[0].points[0].x,21);
});
test('invalid prepared canvas rejected and empty image yields no layers',()=>{
 assert.throws(()=>exportsObject.preparedOutfitPieces(new Uint8ClampedArray(4),100,100));assert.equal(exportsObject.preparedOutfitPieces(new Uint8ClampedArray(400),10,10).length,0);
});
test('many detached edge specks do not flatten clothing and footwear into one layer',()=>{const {a}=sample();for(let y=1;y<19;y+=2)for(let x=1;x<99;x+=4)a[(y*100+x)*4+3]=40;const parts=exportsObject.preparedOutfitPieces(a,100,100);assert.equal(parts.length,3);assert.deepEqual(Array.from(parts,p=>p.name),['Main clothing','Left footwear','Right footwear']);});
test('high sock layers are identified as footwear rather than more clothing',()=>{const {a,rect}=sample();rect(25,72,35,81);rect(65,72,75,81);const parts=exportsObject.preparedOutfitPieces(a,100,100);assert.equal(parts[1].name,'Left footwear');assert.equal(parts[2].name,'Right footwear');});
