const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/generatedHair.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api,Uint8ClampedArray,Uint8Array,Int32Array,Error});
function picture(){const a=new Uint8ClampedArray(100*100*4);a.fill(255);return a;}
function fill(a,x0,y0,x1,y1,c=[165,155,180]){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)a.set([...c,255],(y*100+x)*4);}
test('hair cleanup keeps silver hair instead of treating it as neutral background',()=>{const a=picture();fill(a,20,20,80,60);fill(a,5,5,7,7,[30,30,30]);const c=api.cleanHairPanel(a,100,100,'front');assert.equal(c.bounds.width,60);assert.equal(c.data[(30*100+30)*4+3],255);assert.equal(c.data[(5*100+5)*4+3],0);assert.equal(a[(5*100+5)*4+3],255);});
test('front rejects a closed face ring, long face framing and skin rather than repairing them',()=>{const ring=picture();fill(ring,20,20,80,80);fill(ring,30,30,70,70,[255,255,255]);assert.throws(()=>api.cleanHairPanel(ring,100,100,'front'),/face-shaped/);const long=picture();fill(long,40,10,60,90);assert.throws(()=>api.cleanHairPanel(long,100,100,'front'),/too long/);const skin=picture();fill(skin,20,20,80,60,[240,180,140]);assert.throws(()=>api.cleanHairPanel(skin,100,100,'front'),/Skin/);});
test('hair cleanup rejects multiple objects, clipped output and blank output',()=>{const a=picture();fill(a,10,20,40,60);fill(a,60,20,90,60);assert.throws(()=>api.cleanHairPanel(a,100,100,'front'),/Extra/);const clipped=picture();fill(clipped,0,20,50,60);assert.throws(()=>api.cleanHairPanel(clipped,100,100,'front'),/cut off/);assert.throws(()=>api.cleanHairPanel(picture(),100,100,'front'),/No complete/);});
test('hair fitting preserves aspect ratio, crown alignment and independent front/back transforms',()=>{const source={width:1024,height:768},body={width:843,height:1264};const bounds=[{x:50,y:40,width:370,height:290},{x:550,y:38,width:435,height:531}];const pieces=bounds.map((b,i)=>api.hairPiece(i?'back':'front',b,source,body));const base=Math.max(body.width/source.width,body.height/source.height);for(let i=0;i<2;i++){const t=pieces[i].transform,b=bounds[i],s=base*t.scale;assert.equal(t.stretchX,undefined);assert.equal(t.stretchY,undefined);const x=(body.width-source.width*s)/2+t.x+b.x*s,y=(body.height-source.height*s)/2+t.y+b.y*s;assert.ok(Math.abs(y-46)<1e-8);assert.ok(Math.abs(x+b.width*s/2-body.width/2)<1e-8);assert.ok(Math.abs((b.width*s)/(b.height*s)-b.width/b.height)<1e-8);}assert.equal(pieces[0].depth,'front');assert.equal(pieces[1].depth,'back');assert.notEqual(pieces[0].transform,pieces[1].transform);});

test('enclosed pale strand highlights remain opaque',()=>{const a=picture();fill(a,20,20,80,60);fill(a,30,25,60,35,[245,245,250]);const c=api.cleanHairPanel(a,100,100,'front');assert.equal(c.data[(28*100+40)*4+3],255);});

test('hair rejects repeated crown-like top spikes instead of fitting headgear',()=>{const a=picture();fill(a,20,30,80,55);for(const x of [22,32,42,52,62,72])fill(a,x,10,x+3,31);assert.throws(()=>api.cleanHairPanel(a,100,100,'front'),/Crown-like/);});
test('long fringe is uniformly height-bounded rather than stretched across the face',()=>{const b={x:40,y:30,width:300,height:310},source={width:1024,height:768},body={width:843,height:1264},p=api.hairPiece('front',b,source,body),s=Math.max(body.width/source.width,body.height/source.height)*p.transform.scale;assert.ok(b.height*s<=body.height*.225+1e-6);assert.equal(p.transform.stretchY,undefined);assert.ok(Math.abs((body.width-source.width*s)/2+p.transform.x+(b.x+b.width/2)*s-body.width/2)<1e-6);});
test('back curl gaps become transparent while crown and tinted strand highlights stay intact',()=>{const a=picture();fill(a,10,10,90,90);fill(a,15,55,25,80,[255,255,255]);fill(a,75,55,85,80,[255,255,255]);fill(a,15,20,25,30,[255,255,255]);fill(a,15,40,25,50,[245,245,250]);fill(a,40,55,60,70,[255,255,255]);const c=api.cleanHairPanel(a,100,100,'back');assert.equal(c.data[(60*100+20)*4+3],0);assert.equal(c.data[(60*100+80)*4+3],0);assert.equal(c.data[(25*100+20)*4+3],255);assert.equal(c.data[(45*100+20)*4+3],255);assert.equal(c.data[(60*100+50)*4+3],255);assert.equal(c.enclosedBackgroundRemoved,500);assert.equal(a[(60*100+20)*4+3],255);});
test('hair matte edge is antialiased without blurring dark cores or interior highlights',()=>{const a=picture();fill(a,20,20,80,60,[100,100,115]);fill(a,20,22,21,58,[220,220,225]);fill(a,35,30,50,35,[245,245,250]);const c=api.cleanHairPanel(a,100,100,'front'),p=(30*100+20)*4;assert.ok(c.data[p+3]>0&&c.data[p+3]<255);assert.equal(c.data[(30*100+21)*4],100);assert.equal(c.data[(32*100+40)*4+3],255);assert.equal(a[p+3],255);assert.ok(c.edgePixelsRefined>0);});

test('scheduled hairstyle pool covers five groups with distinct bounded back prompts',()=>{
 const ids=api.BACK_HAIR_STYLE_IDS;
 assert.equal(ids.length,24);
 assert.equal(api.BACK_HAIR_GROUPS.length,5);
 assert.equal(new Set(ids.map(id=>api.hairstylePrompt(id))).size,ids.length);
 for(const id of ids){
  const prompt=api.hairstylePrompt(id);
  assert.ok(prompt.includes(api.BACK_HAIR_STYLES[id].shape));
  assert.ok(prompt.length<=1500);
 }
});

test('front presets pair independently with every back style and fit the prompt limit',()=>{
 assert.equal(api.FRONT_HAIR_STYLE_IDS.length,10);
 for(const back of api.BACK_HAIR_STYLE_IDS)for(const front of api.FRONT_HAIR_STYLE_IDS){
  const prompt=api.hairstylePrompt(back,front);
  assert.ok(prompt.includes(api.FRONT_HAIR_STYLES[front].shape));
  assert.ok(prompt.includes(api.BACK_HAIR_STYLES[back].shape));
  assert.ok(prompt.length<=1500);
 }
});
test('hair panel split finds a shifted white gutter and rejects overlapping layers',()=>{
 const a=picture();fill(a,8,10,39,50);fill(a,47,10,95,88);
 const split=api.hairPanelSplit(a,100,100);
 assert.ok(split>=41&&split<=45);
 fill(a,39,25,47,35);
 assert.throws(()=>api.hairPanelSplit(a,100,100),/overlap/);
});
