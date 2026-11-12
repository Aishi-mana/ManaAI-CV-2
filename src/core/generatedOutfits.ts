export type OutfitSaveMode='review'|'immediate';
export interface GeneratedDesign{id:string;name:string;createdAt:number;status:'pending'|'saved'|'dismissed';prompt:string;width:number;height:number;outfitId:string|null;fitVersion?:number;revision?:number;fitWarnings?:string[];reviewNotes?:string;needsEdits?:boolean}
/** Only hair actually rendered above the outfit can protect hidden fabric. */
export function outfitFrontHairLayers<T extends {key:string}>(layers:T[]):T[]{
 let lastOutfit=-1;layers.forEach((layer,index)=>{if(/^outfits\//i.test(layer.key))lastOutfit=index;});
 if(lastOutfit<0)return [];
 return layers.filter((layer,index)=>index>lastOutfit&&/^hairstyles\//i.test(layer.key));
}
export function outfitCreationPrompt(description:string):string{
 const request=description.trim();if(!request||request.length>1000)throw Error('Describe an outfit in 1–1000 characters.');
 const lower=/\b(?:dress|pinafore)\b/i.test(request)?'Use one complete dress; do not add a separate skirt or trousers. Leave white empty space between the hem and socks.':/\b(?:trousers|pants|leggings|shorts)\b/i.test(request)?'Use only the requested lower garment; do not add a second bottom.':'Single lower garment: a pleated knee-length skirt. Leave white empty space between the skirt hem and the socks. No additional bottom layers.';
 return 'Redesign this CLOTHING ONLY game sprite layer. '+request+'. '+lower+' The reference contains garments only, already positioned on the correct canvas. Replace the hoodie, shorts, socks and shoes with the requested new design; do not copy their design unless requested. Keep the same overall garment scale, shoulder span, sloping sleeve pose and footwear positions. The empty areas are background and must remain empty. Keep the top 29 percent empty; do not move or center the clothing upward. Collar around 30 percent canvas height, cuffs around 54 percent, shoes around 94 percent. Draw complete clothing including both shoulders, intact sleeves, socks and complete shoe silhouettes and soles. Each cuff is one intact, naturally angled piece with a little wrist ease. Keep white channels between sleeves and waist/skirt. Use modest torso ease, natural folds, clean thin anime outlines and flat fabric shading. Hollow collar, cuffs and sock openings show pure white background. Preserve complete shoulder fabric. Output an unworn equipment layer only: no person, no body, no head, no face, no hair, no neck, no hands, no skin, no legs, no mannequin, no anatomy inside any opening. Plain pure white background with no shadows, text, labels or scenery.';
}
export interface OutfitIdeaHistory{name:string;prompt:string}
export function outfitIdeaName(description:string):string{
 const words=description.trim().replace(/[^\p{L}\p{N}\s-]/gu,' ').split(/\s+/).filter(Boolean).slice(0,8).join(' ').slice(0,80);
 return words?words[0].toUpperCase()+words.slice(1):'Mana’s outfit';
}
export function defaultOutfitIdea(random=Math.random,history:readonly OutfitIdeaHistory[]=[],season?:'spring'|'summer'|'autumn'|'winter'):{name:string;description:string}{
 const colors=[{name:'Sky',color:'sky blue',match:/sky.blue|cloud sailor/i},{name:'Rose',color:'dusty rose pink',match:/rose|pink/i},{name:'Lavender',color:'soft lavender',match:/lavender/i},{name:'Mint',color:'mint green',match:/mint|garden afternoon/i},{name:'Cream',color:'warm cream',match:/cream/i},{name:'Peach',color:'soft peach',match:/peach/i},{name:'Teal',color:'muted teal',match:/teal/i},{name:'Burgundy',color:'deep burgundy',match:/burgundy/i}];
 const styles=[
  {name:'sailor',match:/sailor/i,describe:(c:string)=>`A ${c} sailor blouse with navy collar and white piping, matching pleated knee-length skirt`},
  {name:'cardigan',match:/cardigan/i,describe:(c:string)=>`A ${c} cardigan over a white blouse, navy pleated knee-length skirt`},
  {name:'pinafore',match:/pinafore/i,describe:(c:string)=>`A ${c} knee-length pinafore dress over a white puff-sleeved blouse`},
  {name:'day dress',match:/day dress|short-sleeved.*dress|garden afternoon/i,describe:(c:string)=>`A ${c} knee-length day dress with a gently flared hem`},
  {name:'blouse',match:/blouse/i,describe:(c:string)=>`A ${c} blouse with a rounded collar, matching A-line knee-length skirt`},
 ];
 const extraStyles=[
  {name:'knit set',match:/knit set/i,describe:(c:string)=>`A ${c} long-sleeved knitted sweater with a cream A-line knee-length skirt`},
  {name:'hoodie set',match:/hoodie set/i,describe:(c:string)=>`A ${c} long-sleeved zip hoodie worn closed with a navy knee-length skirt`},
  {name:'wrap dress',match:/wrap dress/i,describe:(c:string)=>`A ${c} knee-length wrap dress with intact long sleeves and a matching waist sash`},
  {name:'pajama set',match:/pajama set/i,describe:(c:string)=>`A ${c} long-sleeved pajama shirt and matching full-length pajama trousers`},
  {name:'tunic set',match:/tunic set/i,describe:(c:string)=>`A ${c} long-sleeved tunic with navy straight-leg trousers`},
 ];
 styles.push(...extraStyles);
 const details=[{name:'ribbon',text:'a small matching waist ribbon'},{name:'flower',text:'small white flower embroidery at the hem'},{name:'scallop',text:'subtle scalloped trim at cuffs and hem'},{name:'gingham',text:'a subtle small gingham pattern on the fabric'},{name:'stars',text:'tiny star embroidery at the hem'},{name:'piping',text:'neat contrasting piping on cuffs and collar'}];
 const seasonalStyle=styles.filter(s=>season==='summer'?!['cardigan','knit set','hoodie set'].includes(s.name):season==='winter'?s.name!=='day dress':true);
 const seasonalNote=season?{spring:'Spring choice: light layers and soft floral accents.',summer:'Summer choice: lightweight cotton and short sleeves.',autumn:'Autumn choice: soft knit fabric and long sleeves.',winter:'Winter choice: warm fabric and long sleeves; keep the same complete socks and shoes.'}[season]:'';
 const candidates=colors.flatMap(color=>seasonalStyle.flatMap(style=>details.map(detail=>({name:`${color.name} ${detail.name} ${style.name}`,description:`${style.describe(color.color)}, ${detail.text}, white ankle socks and navy Mary Jane shoes with complete soles${seasonalNote?'. '+seasonalNote:''}`,style,color}))));
 const recent=history.slice(0,24);
 let pool=candidates.filter(c=>!recent.some(h=>h.name.toLowerCase()===c.name.toLowerCase()||h.prompt.includes(c.description)));
 if(!pool.length)pool=candidates;
 const latest=recent[0];
 if(latest){
  // Prefer a different silhouette and primary color, even when the earlier
  // design was manually renamed. Exact prompts still prevent combination repeats.
  const fresh=pool.filter(c=>!c.style.match.test(latest.name+' '+latest.prompt)&&!c.color.match.test(latest.name+' '+latest.prompt));
  if(fresh.length)pool=fresh;
 }
 const value=random();const sample=Number.isFinite(value)?Math.max(0,Math.min(.999999,value)):0;
 const chosen=pool[Math.floor(sample*pool.length)];return {name:chosen.name,description:chosen.description};
}
export function designPreviewLayers<T extends {key:string;url:string}>(layers:T[],url:string):T[]{let inserted=false;return layers.flatMap(layer=>{if(!layer.key.startsWith('outfits/'))return [layer];if(inserted)return [];inserted=true;return [{...layer,url}];});}
export interface CreativeOutfitIdea{name:string;description:string}
export function readCreativeOutfit(text:string):CreativeOutfitIdea{
 const cleaned=text.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');let v:CreativeOutfitIdea;
 try{v=JSON.parse(cleaned);}catch{throw Error('Mana did not return a complete outfit idea. No image was generated.');}
 if(!v||typeof v.name!=='string'||!v.name.trim()||v.name.length>80||typeof v.description!=='string'||!v.description.trim()||v.description.length>1000)throw Error('The outfit idea needs a short name and complete description. No image was generated.');
 return {name:v.name.trim(),description:v.description.trim()};
}
export function creativeOutfitMessages(character:string,personality:string,history:readonly OutfitIdeaHistory[],season?:string){return [{role:'system' as const,content:`You are ${character}. ${personality.slice(0,2000)} Invent a new complete, practical anime outfit you would like to wear. A varied starting direction you may reinterpret freely: ${defaultOutfitIdea(Math.random,history,season as 'spring'|'summer'|'autumn'|'winter'|undefined).description}. You are not choosing from a preset catalogue. Invent colors, fabric, motif, garment shapes and details. Use one coherent front-view outfit with complete shoulders, exactly one skirt/dress/trouser bottom, socks and closed shoes with full soles. Specify short or long sleeves explicitly. No face, hair, skin, gloves, shoulder cutouts, transparent fabric or extra loose pieces. Keep the pose unchanged. Return JSON only: {"name":"short distinct outfit name","description":"visual outfit description under1000 characters"}.`},{role:'user' as const,content:`Design a new outfit for yourself${season?' suitable for '+season:''}. Recent designs to avoid repeating: ${history.slice(0,12).map(h=>h.name+' — '+h.prompt.slice(0,220)).join('\n').slice(0,3500)||'none yet'}. Describe the garments and shoes only.`}];}




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
