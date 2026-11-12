from pathlib import Path
p=Path('src-tauri/src/image_generation.rs');s=p.read_text(encoding='utf-8-sig').replace(' if request.reference.is_none(){return Err("Outfit creation needs Mana’s current avatar reference.".into());}\n','');p.write_text(s,encoding='utf-8')
p=Path('src/core/generatedOutfits.ts');s=p.read_text(encoding='utf-8-sig');s+='''
/** Optional editable starting ideas; free descriptions and Mana's own ideas remain available. */
export const OUTFIT_PRESETS=[
 ['cloud-sailor','Cloud sailor','Sky blue long-sleeved sailor blouse, navy collar with white piping, navy pleated knee-length skirt, white ankle socks and navy Mary Jane shoes'],
 ['garden','Garden dress','Mint green short-sleeved knee-length cotton dress with small daisy embroidery, white ankle socks and brown Mary Jane shoes'],
 ['cardigan','Cozy cardigan','Dusty rose long-sleeved knit cardigan over a cream blouse, navy A-line knee-length skirt, cream socks and brown loafers'],
 ['pinafore','Library pinafore','Cocoa brown knee-length pinafore dress over an ivory long-sleeved blouse, cream socks and brown lace-up shoes'],
 ['tea','Tea party','Lavender knee-length dress with long sleeves, rounded collar and subtle lace trim, white socks and plum Mary Jane shoes'],
 ['rain','Rainy afternoon','Muted teal long-sleeved rain jacket worn closed, navy knee-length skirt, thick cream socks and navy closed rain boots'],
 ['winter','Winter knit','Cream long-sleeved cable knit sweater, burgundy knee-length skirt, warm grey socks and brown ankle boots'],
 ['spring','Spring picnic','Peach short-sleeved blouse, sage gingham knee-length skirt, white ankle socks and tan Mary Jane shoes'],
 ['summer','Summer linen','Pale yellow short-sleeved linen blouse, sky blue knee-length skirt, white ankle socks and tan closed canvas shoes'],
 ['autumn','Autumn walk','Rust long-sleeved blouse, dark brown knee-length corduroy skirt, cream socks and brown ankle boots'],
 ['star','Starlight dress','Midnight blue long-sleeved knee-length dress with tiny gold star embroidery, navy socks and navy Mary Jane shoes'],
 ['casual','Everyday casual','Lilac long-sleeved sweatshirt, navy knee-length skirt, white crew socks and grey sneakers'],
 ['sport','Sporty day','Blue long-sleeved zip jacket worn closed, navy jogger trousers, white socks and blue sneakers'],
 ['sleep','Sleepy clouds','Pale blue long-sleeved pajama shirt and full-length pajama trousers with tiny cloud pattern, white socks and soft closed slippers'],
 ['kimono','Blossom kimono','Pale pink knee-length kimono-inspired wrap dress with intact long sleeves and blue waist sash, white socks and matching closed flat shoes'],
 ['festive','Festive velvet','Burgundy long-sleeved knee-length velvet dress with cream collar and small gold waist ribbon, cream socks and black Mary Jane shoes']
].map(([id,name,description])=>({id,name,description}));
''';p.write_text(s,encoding='utf-8')
p=Path('src/components/GeneratedOutfits.tsx');s=p.read_text(encoding='utf-8-sig').replace('import {defaultOutfitIdea,','import {OUTFIT_PRESETS,defaultOutfitIdea,');s=s.replace('fit it to her body, and clean its openings.','fit it to her body, and keep its fabric intact for your review.');needle='<label className="field">Design idea (optional)';insert='''<label className="field">Outfit starting idea<select aria-label="Outfit starting idea" defaultValue="" disabled={running} onChange={e=>{const preset=OUTFIT_PRESETS.find(p=>p.id===e.target.value);if(preset){setName(preset.name);setDescription(preset.description);}e.target.value='';}}><option value="">Choose an optional preset…</option>{OUTFIT_PRESETS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p className="hint-soft">Presets fill in an editable description. Leave the description blank for Mana to invent her own.</p>''';assert needle in s;s=s.replace(needle,insert+needle);p.write_text(s,encoding='utf-8')
