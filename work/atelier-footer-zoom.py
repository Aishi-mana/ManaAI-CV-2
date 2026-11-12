from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8-sig');s="import {createPortal} from 'react-dom';\n"+s;s=s.replace("type Tool='rectangle'", "type Tool='zoom'|'rectangle'");s=s.replace('interface Props{','interface Props{footerTarget?:RefObject<HTMLDivElement|null>;',1);s=s.replace("initialDraftKey}:Props)","initialDraftKey,footerTarget}:Props)");s=s.replace("if(e.button!==0)return;if(tool!=='select'", "if(e.button!==0||tool==='zoom')return;if(tool!=='select'",1)
s=s.replace("['hand','Pan view'", "['zoom','Zoom view','M10 3a7 7 0 110 14 7 7 0 010-14M15 15l6 6M7 10h6M10 7v6'],\n ['hand','Pan view'")
s=s.replace("value==='fill'||value==='hand'?'view'", "value==='fill'||value==='hand'||value==='zoom'?'view'")
s=s.replace("onZoom={stage==='make'?setPreviewZoom:undefined}","onZoom={stage==='make'&&tool==='zoom'&&editOnBody&&!handTool?setPreviewZoom:undefined}")
s=s.replace("onZoom={stage==='edit'?setPreviewZoom:undefined}","onZoom={stage==='edit'&&tool==='zoom'&&editOnBody&&!handTool?setPreviewZoom:undefined}")
s=s.replace("Wheel: zoom · Space: pan", "Wheel: scroll · Zoom tool + wheel: zoom · Space: pan")
s=s.replace("{(reviewTarget||category!=='outfit')&&<button", "{(!footerTarget||stage!=='edit')&&(reviewTarget||category!=='outfit')&&<button")
s=s.replace('<div ref={brushPointer}', "{footerTarget?.current&&stage==='edit'&&(reviewTarget||category!=='outfit')&&createPortal(<button className=\"btn primary\" disabled={saving||!hasOutfit||points.length>0||!!stroke} onClick={()=>void save(false,true)}>{saving?'Saving…':reviewTarget?'Save edits to review':'Save for review'}</button>,footerTarget.current)}<div ref={brushPointer}")
p.write_text(s,encoding='utf-8')
p=Path('src/components/Atelier.tsx');s=p.read_text(encoding='utf-8-sig').replace(' const uploadInput=',' const footerTarget=useRef<HTMLDivElement|null>(null);\n const uploadInput=',1);s=s.replace('className="atelier-workspace" role=', 'className="atelier-workspace" data-stage={stage} role=');s=s.replace('<OutfitPrototype initialDraftKey=', '<OutfitPrototype footerTarget={footerTarget} initialDraftKey=');s=s.replace("{stage!=='save'&&<button", "<div className=\"atelier-footer-review\" ref={footerTarget}/>{stage!=='save'&&<button");p.write_text(s,encoding='utf-8')
p=Path('src/styles.css');s=p.read_text(encoding='utf-8-sig');s+='''
.atelier-footer-review{margin-left:auto;display:flex;gap:10px}.atelier-footer-review:empty{margin-left:auto}.atelier-footer-review+.btn{margin-left:0}
.atelier-workspace[data-stage="edit"] .atelier-body{overflow:hidden;padding-bottom:0;display:flex;flex-direction:column}
.atelier-workspace[data-stage="edit"] .atelier-body>div:not([hidden]){flex:1;min-height:0;display:flex;flex-direction:column}
.atelier-workspace[data-stage="edit"] .atelier-body>div>p.hint-soft{display:none}
.atelier-workspace[data-stage="edit"] .atelier-editor{flex:1;min-height:0;display:flex;flex-direction:column}
.atelier-workspace[data-stage="edit"] .outfit-workspace-body{flex:1;min-height:0;position:relative;grid-template-rows:minmax(0,1fr);padding-bottom:0}
.atelier-workspace[data-stage="edit"] .outfit-tool-panel{height:100%;max-height:100%;grid-row:1;position:static}
.atelier-workspace[data-stage="edit"] .outfit-editor-grid,.atelier-workspace[data-stage="edit"] .outfit-body-stage,.atelier-workspace[data-stage="edit"] .outfit-pan-shell{height:100%;min-height:0}
.atelier-workspace[data-stage="edit"] .outfit-canvas-viewport{height:100%;max-height:none;min-height:0;box-sizing:border-box}
.atelier-workspace[data-stage="edit"] .outfit-workspace-body>[role="status"],.atelier-workspace[data-stage="edit"] .outfit-workspace-body>[role="alert"]{position:absolute;bottom:4px;right:12px;z-index:4;max-width:65%;background:#fff8fc;padding:4px 8px;border-radius:6px;pointer-events:none}
''';p.write_text(s,encoding='utf-8')
