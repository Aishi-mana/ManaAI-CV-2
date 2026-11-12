from pathlib import Path
p=Path('src/core/generatedOutfits.ts');s=p.read_text(encoding='utf-8-sig');s=s.replace("{name:'Peach',color:'soft peach',match:/peach/i}","{name:'Peach',color:'soft peach',match:/peach/i},{name:'Teal',color:'muted teal',match:/teal/i},{name:'Burgundy',color:'deep burgundy',match:/burgundy/i}")
s=s.replace(" const details=[", """ const extraStyles=[
  {name:'knit set',match:/knit set/i,describe:(c:string)=>`A ${c} long-sleeved knitted sweater with a cream A-line knee-length skirt`},
  {name:'hoodie set',match:/hoodie set/i,describe:(c:string)=>`A ${c} long-sleeved zip hoodie worn closed with a navy knee-length skirt`},
  {name:'wrap dress',match:/wrap dress/i,describe:(c:string)=>`A ${c} knee-length wrap dress with intact long sleeves and a matching waist sash`},
  {name:'pajama set',match:/pajama set/i,describe:(c:string)=>`A ${c} long-sleeved pajama shirt and matching full-length pajama trousers`},
  {name:'tunic set',match:/tunic set/i,describe:(c:string)=>`A ${c} long-sleeved tunic with navy straight-leg trousers`},
 ];
 styles.push(...extraStyles);
 const details=[""")
s=s.replace("{name:'gingham',text:'a subtle small gingham pattern on the skirt'}", "{name:'gingham',text:'a subtle small gingham pattern on the fabric'},{name:'stars',text:'tiny star embroidery at the hem'},{name:'piping',text:'neat contrasting piping on cuffs and collar'}")
s=s.replace("s.name!=='cardigan':season==='winter'?s.name!=='day dress'", "!['cardigan','knit set','hoodie set'].includes(s.name):season==='winter'?s.name!=='day dress'")
s=s.replace("Invent a new complete, practical anime outfit you would like to wear.","Invent a new complete, practical anime outfit you would like to wear. A varied starting direction you may reinterpret freely: ${defaultOutfitIdea(Math.random,history,season as 'spring'|'summer'|'autumn'|'winter'|undefined).description}.")
p.write_text(s,encoding='utf-8')
p=Path('src/components/GeneratedOutfits.tsx');s=p.read_text(encoding='utf-8-sig');a=s.index('<label className="field">Outfit starting idea');b=s.index('<label className="field">Design idea (optional)',a);s=s[:a]+'''<details className="outfit-preset-picker"><summary>Optional outfit starting ideas</summary><p className="hint-soft">Mana chooses her own ideas automatically. These are optional editable shortcuts.</p><div className="outfit-preset-options">{OUTFIT_PRESETS.map(p=><button type="button" className="btn" key={p.id} disabled={running} onClick={e=>{setName(p.name);setDescription(p.description);e.currentTarget.closest('details')?.removeAttribute('open');}}>{p.name}</button>)}</div></details>'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src/styles.css');s=p.read_text(encoding='utf-8-sig');s+='\n.outfit-preset-picker{max-width:38rem;margin:1rem 0}.outfit-preset-picker summary{cursor:pointer;font-weight:600}.outfit-preset-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.5rem;max-height:240px;overflow-y:auto;padding:.5rem}.outfit-preset-options .btn{white-space:normal}\n';p.write_text(s,encoding='utf-8')
p=Path('tests/generated-outfits.test.cjs');s=p.read_text(encoding='utf-8-sig');s+='''
test('automatic outfit pool spans 480 distinct combinations including new silhouettes',()=>{const names=new Set();for(let i=0;i<480;i++)names.add(exportsObject.defaultOutfitIdea(()=>(i+.5)/480).name);assert.equal(names.size,480);for(const style of ['knit set','hoodie set','wrap dress','pajama set','tunic set'])assert.ok([...names].some(n=>n.endsWith(style)));const messages=exportsObject.creativeOutfitMessages('Mana','',[]);assert.match(messages[0].content,/starting direction you may reinterpret freely/);});
''';p.write_text(s,encoding='utf-8')
