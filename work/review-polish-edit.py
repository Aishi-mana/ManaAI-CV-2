from pathlib import Path
p=Path('src-tauri/src/generated_outfits.rs');s=p.read_text(encoding='utf-8');s=s.replace('fs::write(folder.join("outfit.png"),bytes).map_err(|e|e.to_string())?;write_record','fs::write(folder.join("outfit.png"),bytes).map_err(|e|e.to_string())?;fs::write(folder.join("initial-fit.png"),bytes).map_err(|e|e.to_string())?;write_record',1)
s+='''
#[tauri::command]
pub fn generated_outfits_preview(app:tauri::AppHandle,id:String,stage:String)->Result<tauri::ipc::Response,String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;
 let folder=checked_folder(&root(&app)?,&id)?;
 let file=match stage.as_str(){"current"=>folder.join("outfit.png"),"fitted"=>folder.join("initial-fit.png"),"generated"=>recovery_folder(&images_root(),&id)?.join("image.png"),_=>return Err("Unknown preview stage".into())};
 if fs::metadata(&file).map_err(|_|"This earlier preview is unavailable for this design.")?.len()>40_000_000{return Err("Preview is too large".into())}
 let bytes=fs::read(file).map_err(|e|e.to_string())?;crate::outfit_prototype::png_dimensions(&bytes)?;Ok(tauri::ipc::Response::new(bytes))
}
#[tauri::command]
pub fn generated_outfits_rename(app:tauri::AppHandle,id:String,name:String)->Result<(),String>{
 let _guard=QUEUE.lock().map_err(|e|e.to_string())?;let root=root(&app)?;let mut d=record(&root,&id)?;
 if d.status!="pending"||name.trim().is_empty()||name.chars().count()>80{return Err("Choose a name of 1–80 characters for a pending design.".into())}
 d.name=name.trim().into();write_record(&checked_folder(&root,&id)?,&d)
}
''';p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8').replace('generated_outfits::generated_outfits_image,','generated_outfits::generated_outfits_image,\n            generated_outfits::generated_outfits_preview,\n            generated_outfits::generated_outfits_rename,');p.write_text(s,encoding='utf-8')
