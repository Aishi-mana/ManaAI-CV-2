from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');start=s.index("test('code playground executes its example");end=s.index("test('code sandbox blocks",start)
s=s[:start]+'''test('star collector fixes the actual generated frame-reset bug and preserves movement, score and restart',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');
 function runner(source){let latest,calls=0;const math=Object.create(Math);math.random=()=>{calls++;return .5;};const self={postMessage:m=>latest=m};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self,Math:math});self.onmessage({data:{type:'start',code:source}});assert.equal(latest.type,'ready');return {tick(keys={},dt=.1){self.onmessage({data:{type:'tick',dt,keys}});return sandbox.validateSandboxFrame(latest);},calls:()=>calls};}
 const player=result=>result.commands.filter(c=>c.type==='circle').at(-1).args;
 const original=runner(fs.readFileSync('tests/fixtures/game-reset-every-frame.js','utf8'));
 assert.equal(player(original.tick({ArrowRight:true}))[0],125);assert.equal(player(original.tick({ArrowRight:true}))[0],125);assert.equal(player(original.tick())[0],120);
 const fixed=runner(sandbox.SANDBOX_EXAMPLE);
 assert.equal(player(fixed.tick({ArrowRight:true}))[0],135);assert.equal(player(fixed.tick({ArrowRight:true}))[0],150);assert.equal(player(fixed.tick())[0],150);assert.equal(fixed.calls(),40,'twenty stars initialize once, not per frame');
 for(let i=0;i<6;i++)fixed.tick({ArrowRight:true});let result;
 for(let i=0;i<3;i++)result=fixed.tick({ArrowDown:true});
 const score=r=>Number(r.commands.filter(c=>c.type==='text').at(-1).args[0].split('Score: ')[1]);assert.ok(score(result)>0);assert.ok(score(fixed.tick())>0);
 result=fixed.tick({Space:true});assert.equal(score(result),0);assert.equal(player(result)[0],120);
 assert.equal(player(fixed.tick({Space:true,ArrowRight:true}))[0],135);assert.equal(player(fixed.tick({Space:true,ArrowRight:true}))[0],150,'holding reset must not reinitialize each frame');
 for(let i=0;i<50;i++)result=fixed.tick({ArrowRight:true,ArrowDown:true});assert.equal(player(result)[0],470);assert.equal(player(result)[1],270);
 assert.equal(sandbox.sandboxCode('```js\\napi.onFrame=()=>{};\\n```'),'api.onFrame=()=>{};');assert.throws(()=>sandbox.sandboxCode('x'.repeat(16001)),/16,000/);
 assert.match(sandbox.sandboxDraftInstructions(),/OUTSIDE the callback/);assert.ok(sandbox.sandboxDraftInstructions().includes(sandbox.SANDBOX_EXAMPLE));
});
'''+s[end:];p.write_text(s,encoding='utf-8')
