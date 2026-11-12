from pathlib import Path
p=Path('src-tauri/src/wearable_reviews.rs');s=p.read_text(encoding='utf-8-sig');s=s.replace('pub fit_warnings:Vec<String>}', 'pub fit_warnings:Vec<String>,#[serde(default)]pub review_notes:String,#[serde(default)]pub needs_edits:bool}')
s=s.replace('fit_warnings:vec![]}};', 'fit_warnings:vec![],review_notes:String::new(),needs_edits:false}};')
s=s.replace('slot:String)->Result<tauri::ipc::Response,String>', 'slot:String,revision:Option<u32>)->Result<tauri::ipc::Response,String>')
s=s.replace('let r=read(&root,&id)?;Ok(tauri::ipc::Response::new', 'let mut r=read(&root,&id)?;if let Some(revision)=revision{if revision>r.revision{return Err("Unknown review revision".into())}r.revision=revision;}Ok(tauri::ipc::Response::new')
s=s.replace('let project:serde_json::Value=serde_json::from_slice(&fs::read(version(&root,&r)?.join("project.json"))', 'let mut project:serde_json::Value=serde_json::from_slice(&fs::read(version(&root,&r)?.join("project.json"))');s=s.replace('Ok(serde_json::json!({"review":r,"project":project}))', 'project["name"]=serde_json::json!(r.name);Ok(serde_json::json!({"review":r,"project":project}))')
s+='''
fn manage(root:&Path,id:&str,expected:u32,action:&str,name:&str,notes:&str,needs_edits:bool)->Result<Review,String>{
 let mut r=read(root,id)?;if r.status!="pending"||r.revision!=expected{return Err("Review changed; reopen it first".into())}
 match action{
 "rename"=>{if name.trim().is_empty()||name.chars().count()>80{return Err("Name must contain 1-80 characters".into())}r.name=name.trim().into();},
 "notes"=>{if notes.chars().count()>2000{return Err("Notes exceed 2000 characters".into())}r.review_notes=notes.into();r.needs_edits=needs_edits;},
 "duplicate"=>{let dir=version(root,&r)?;let mut project:serde_json::Value=serde_json::from_slice(&fs::read(dir.join("project.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;let title=format!("{} copy",r.name.chars().take(74).collect::<String>());project["name"]=serde_json::json!(title);let mut layers=vec![AtelierLayer{slot:"front".into(),bytes:fs::read(dir.join("front.png")).map_err(|e|e.to_string())?}];if r.category=="hair"{layers.push(AtelierLayer{slot:"back".into(),bytes:fs::read(dir.join("back.png")).map_err(|e|e.to_string())?});}let mut copy=save(root,None,None,r.category.clone(),r.depth.clone(),title,layers,project)?;copy.review_notes=r.review_notes;copy.needs_edits=r.needs_edits;write(&folder(root,&copy.id)?,&copy)?;return Ok(copy);},
 _=>return Err("Unknown review action".into())
 }write(&folder(root,id)?,&r)?;Ok(r)
}
#[tauri::command]pub fn wearable_reviews_manage(app:tauri::AppHandle,id:String,expected_revision:u32,action:String,name:String,notes:String,needs_edits:bool)->Result<Review,String>{let _g=LOCK.lock().map_err(|e|e.to_string())?;manage(&root(&app)?,&id,expected_revision,&action,&name,&notes,needs_edits)}
''';p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8-sig').replace('wearable_reviews::wearable_reviews_list,','wearable_reviews::wearable_reviews_list,\n            wearable_reviews::wearable_reviews_manage,');p.write_text(s,encoding='utf-8')
p=Path('src/core/wearableReview.ts');s=p.read_text(encoding='utf-8-sig').replace('fitWarnings?:string[]}', 'fitWarnings?:string[];reviewNotes?:string;needsEdits?:boolean}');p.write_text(s,encoding='utf-8')
# Inspector reuses the roomy comparison UI, with category-aware fitted layers.
p=Path('src/components/OutfitInspector.tsx');s=p.read_text(encoding='utf-8-sig');s="import {atelierPreviewPlan} from '../core/outfitPrototype';\nimport type {WearableReview} from '../core/wearableReview';\n"+s
s=s.replace('Whole:[0,0,1,1],', 'Whole:[0,0,1,1],Hair:[.05,0,.9,.57],Face:[.16,.02,.68,.3],')
s=s.replace('register}:{id:string;', 'register,wearable}:{wearable?:WearableReview;id:string;')
a=s.index('const bytes=await invoke<ArrayBuffer>');b=s.index('if(!alive||!canvas.current)return;',a)
old=s[a:b]
new='''const owned:string[]=[];const imageUrl=(bytes:ArrayBuffer)=>{const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'image/png'}));owned.push(url);return url;};let images:HTMLImageElement[];try{if(wearable){if(stage==='generated'){const data=await invoke<{project:{sourceDataUrl:string;generation?:{rawSourceDataUrl?:string}}}>('wearable_reviews_open',{id});images=[await loadOutfitImage(data.project.generation?.rawSourceDataUrl??data.project.sourceDataUrl)];}else{const load=async(slot:string)=>imageUrl(await invoke<ArrayBuffer>('wearable_reviews_image',{id,slot,revision:stage==='fitted'?0:null}));const front=await load('front'),back=wearable.category==='hair'?await load('back'):'';const plan=atelierPreviewPlan(layers.map(l=>l.key),wearable.category,wearable.depth);const urls=onBody?plan.flatMap(k=>k==='@front'?[front]:k==='@back'?(back?[back]:[]):layers.filter(l=>l.key===k).map(l=>l.url)):[...(back?[back]:[]),front];images=await Promise.all(urls.map(loadOutfitImage));}}else{const bytes=await invoke<ArrayBuffer>('generated_outfits_preview',{id,stage});const url=imageUrl(bytes),garment=await loadOutfitImage(url);images=stage==='generated'||!onBody?[garment]:await Promise.all(inspectionLayers(layers,showHair).map(l=>loadOutfitImage(l.key.startsWith('outfits/')?url:l.url)));}'''
s=s[:a]+new+s[b:];s=s.replace('URL.revokeObjectURL(url);}})()', 'owned.forEach(URL.revokeObjectURL);}})()')
s=s.replace('onClose}:{id:string;', 'onClose,wearable}:{wearable?:WearableReview;id:string;')
s=s.replace('aria-label="Inspect outfit"><header><h2>Inspect outfit</h2>', 'aria-label={wearable?"Inspect wearable":"Inspect outfit"}><header><h2>{wearable?wearable.name:"Inspect outfit"}</h2>')
s=s.replace('id={id} stage={value}', 'id={id} wearable={wearable} stage={value}')
p.write_text(s,encoding='utf-8')
# Keep original accessory generation available in inspector.
p=Path('src/components/GeneratedAccessories.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('  const clean=cleanAccessory(', "  const rawSourceDataUrl=source.toDataURL('image/png');const clean=cleanAccessory(");s=s.replace('generation:{jobId:id,mode:', 'generation:{rawSourceDataUrl,jobId:id,mode:');p.write_text(s,encoding='utf-8')
