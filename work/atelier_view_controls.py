from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8');s=s.replace(' const pieceCounter=useRef(1);',' const pieceCounter=useRef(1);\n const [previewOpacity,setPreviewOpacity]=useState(1),[previewZoom,setPreviewZoom]=useState(1);',1)
s=s.replace('if(/^base\\//i.test(layer.key))p.drawImage(out,0,0);','if(/^base\\//i.test(layer.key)){p.globalAlpha=previewOpacity;p.drawImage(out,0,0);p.globalAlpha=1;}',1)
s=s.replace('p.drawImage(body,0,0);p.drawImage(out,0,0);','p.drawImage(body,0,0);p.globalAlpha=previewOpacity;p.drawImage(out,0,0);p.globalAlpha=1;',1)
s=s.replace('combined,stage]);','combined,stage,previewOpacity,previewZoom]);',1)
a=s.index(' {!source&&<p>');s=s[:a]+''' {source&&<div className="outfit-view-controls" aria-label="Outfit view controls"><label>Outfit visibility on body · {Math.round(previewOpacity*100)}%<input aria-label="Outfit preview opacity" type="range" min={0} max={100} value={Math.round(previewOpacity*100)} onChange={e=>setPreviewOpacity(Number(e.target.value)/100)}/></label><button className="btn" onClick={()=>setPreviewOpacity(v=>v===1?.5:1)}>{previewOpacity===1?'See through outfit':'Full visibility'}</button><label>Zoom · {Math.round(previewZoom*100)}%<input aria-label="Editor zoom" type="range" min={50} max={300} step={10} value={Math.round(previewZoom*100)} onChange={e=>setPreviewZoom(Number(e.target.value)/100)}/></label><button className="btn" aria-label="Zoom out" disabled={previewZoom<=.5} onClick={()=>setPreviewZoom(v=>Math.max(.5,Math.round((v-.1)*10)/10))}>−</button><button className="btn" aria-label="Zoom in" disabled={previewZoom>=3} onClick={()=>setPreviewZoom(v=>Math.min(3,Math.round((v+.1)*10)/10))}>+</button><button className="btn" onClick={()=>{setPreviewZoom(1);setPreviewOpacity(1);}}>Reset view</button><span className="hint-soft">View controls only. Saved outfits keep their original opacity and size. Scroll inside a zoomed picture to move around.</span></div>}
'''+s[a:]
s=s.replace('<h3>1 · Clean clothing</h3><canvas','<h3>1 · Clean clothing</h3><div className="outfit-canvas-viewport"><canvas style={{width:`${previewZoom*100}%`,maxWidth:"none"}}',1)
s=s.replace('onPointerLeave={()=>setCursor(null)}/></section>', 'onPointerLeave={()=>setCursor(null)}/></div></section>',1)
s=s.replace('<canvas className="checkerboard" ref={transparent}/>', '<div className="outfit-canvas-viewport"><canvas className="checkerboard" ref={transparent} style={{width:`${previewZoom*100}%`,maxWidth:"none"}}/></div>',1)
s=s.replace('<canvas className="checkerboard outfit-drag-preview"', '<div className="outfit-canvas-viewport"><canvas style={{width:`${previewZoom*100}%`,maxWidth:"none"}} className="checkerboard outfit-drag-preview"',1)
s=s.replace('}}/></section></div>','}}/></div></section></div>',1)
p.write_text(s,encoding='utf-8')
p=Path('src/core/imageGeneration.ts');s=p.read_text(encoding='utf-8').replace('Generate a coherent new pose, outfit and scene as requested, not a collage or character sheet.','Generate exactly one character in one coherent scene, even if the reference shows several views of that same character. Do not duplicate her, draw twins, add reflections or repeat the reference views. Generate a coherent new pose and outfit as requested, not a collage or character sheet.',1);p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8').replace('        .invoke_handler(tauri::generate_handler![','''        .setup(|app| {
            if let (Some(window),Some(icon))=(app.get_webview_window("main"),app.default_window_icon()) {window.set_icon(icon.clone())?;}
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![''',1);p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/main.rs');s=p.read_text(encoding='utf-8');s=s.replace('#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]','#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]',1)
s=s.replace('fn main() {','''#[cfg(target_os="windows")]
fn set_taskbar_identity(){
    #[link(name="shell32")]extern "system" {fn SetCurrentProcessExplicitAppUserModelID(id:*const u16)->i32;}
    let id:Vec<u16>="com.mana.companion".encode_utf16().chain(std::iter::once(0)).collect();
    // Stable identity keeps the GUI separate from a launching terminal's group.
    unsafe {let _=SetCurrentProcessExplicitAppUserModelID(id.as_ptr());}
}
fn main() {
    #[cfg(target_os="windows")]set_taskbar_identity();''',1).replace('// Hides the extra console window in release builds on Windows.','// Mana is a GUI application in both debug and release Windows builds.',1);p.write_text(s,encoding='utf-8')
