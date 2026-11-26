const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);

test('converted bundled WebP images match the verified migration manifest',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/bundled-webp-manifest.json'),'utf8'));
 assert.equal(manifest.pixel_verification,'exact-rgba');
 assert.ok(manifest.images.length>100);
 let before=0,after=0;
 for(const image of manifest.images){
  assert.ok(/^(public\/|assets\/avatar\/)/.test(image.target));
  const file=fs.readFileSync(path.join(root,image.target));
  assert.equal(file.toString('ascii',0,4),'RIFF',image.target);
  assert.equal(file.toString('ascii',8,12),'WEBP',image.target);
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'),image.webp_sha256,image.target);
  assert.equal(file.length,image.converted_bytes);
  assert.equal(fs.existsSync(path.join(root,image.source)),false,image.source);
  before+=image.original_bytes;after+=file.length;
 }
 assert.ok(after<before,'bundled artwork must use less space');
});

test('bundled artwork and source URLs have no missing literal files or leftover PNG copies',()=>{
 for(const dir of ['public','assets/avatar'])for(const file of walk(path.join(root,dir))){
  assert.ok(!/\.(png|jpe?g)$/i.test(file),file);
 }
 for(const file of walk(path.join(root,'src')).filter(file=>/\.(tsx?|css|json)$/.test(file))){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/\.\/companion-room\/[A-Za-z0-9_/-]+\.(?:png|webp)/g)){
   assert.ok(fs.existsSync(path.join(root,'public',match[0].slice(2))),`${file}: ${match[0]}`);
  }
 }
});

test('all bundled animation frames and avatar layer names remain available after conversion',()=>{
 const room=path.join(root,'public/companion-room');
 const counts={idle:8,drag:6,walk:3,water:3,read:3,play:3,sleep:3,think:3,window:3};
 for(const [motion,count] of Object.entries(counts))for(let frame=1;frame<=count;frame++)assert.ok(fs.existsSync(path.join(room,`mana_${motion}_${frame}.webp`)));
 for(const file of ['base/body.webp','outfits/default/outfit.webp','hairstyles/default/hair_front.webp','eyes/eye_neutral.webp','mouth/mouth_neutral.webp'])assert.ok(fs.existsSync(path.join(root,'assets/avatar',file)));
 // Native application icons and PNG-based editor fixture contracts are intentional exceptions.
 assert.ok(fs.existsSync(path.join(root,'src-tauri/icons/32x32.png')));
 assert.ok(fs.existsSync(path.join(root,'tests/fixtures/outfit-alpha.png')));
});
