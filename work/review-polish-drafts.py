from pathlib import Path
p=Path('src/components/OutfitInspector.tsx');s=p.read_text(encoding='utf-8').replace("l.key==='@design'","l.key.startsWith('outfits/')");p.write_text(s,encoding='utf-8')
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8');s="import {saveEditorDraft} from '../core/editorDrafts';\n"+s
s=s.replace(" const pieceCounter=useRef(1);"," const draftKey=useRef(reviewTarget?category+':'+reviewTarget.id:category+':'+Date.now());\n const [draftStatus,setDraftStatus]=useState('');\n const pieceCounter=useRef(1);",1)
anchor=' const prepared=useMemo('
idx=s.index(anchor)
s=s[:idx]+''' useEffect(()=>{
  if(!source||!body||stroke||imageImporting)return;
  const timer=window.setTimeout(()=>{try{const original=document.createElement('canvas');original.width=source.naturalWidth;original.height=source.naturalHeight;original.getContext('2d')!.drawImage(source,0,0);const sourceDataUrl=original.toDataURL('image/png');const project={name,parts:snapshotOutfitPieces(pieces,activeId,regions,transform),activePartId:activeId,sourceSize:{width:source.naturalWidth,height:source.naturalHeight},sourceDataUrl,history:history.current?{...history.current,present:currentSnapshot()}:{past:[],present:currentSnapshot(),future:[]}};void saveEditorDraft({key:draftKey.current,name,category,updatedAt:Date.now(),sourceDataUrl,project,reviewTarget,depth:accessoryDepth}).then(()=>setDraftStatus('Draft saved on this computer.')).catch(()=>setDraftStatus('Draft could not be saved. Save your edits before closing.'));}catch{setDraftStatus('Draft could not be saved. Save your edits before closing.');}},1200);
  return()=>window.clearTimeout(timer);
 },[source,body,name,pieces,activeId,regions,transform,historyTick,accessoryDepth,stroke,imageImporting]);
'''+s[idx:]
s=s.replace('<div className="outfit-workspace-body">','<div className="outfit-workspace-body">{draftStatus&&<p className="hint-soft" role="status">{draftStatus}</p>}',1);p.write_text(s,encoding='utf-8')
p=Path('src/components/Atelier.tsx');s=p.read_text(encoding='utf-8').replace("import {useRef,useState}","import {useEffect,useRef,useState}");s="import {latestEditorDraft,deleteEditorDraft,type EditorDraft} from '../core/editorDrafts';\n"+s
s=s.replace(' const designRequest=', ''' const [draft,setDraft]=useState<EditorDraft>();
 useEffect(()=>{let alive=true;void latestEditorDraft(category).then(d=>{if(alive)setDraft(d);}).catch(()=>{});return()=>{alive=false;};},[category]);
 const designRequest=''',1)
s=s.replace('initialProject={picture===initial?initial?.project:undefined}', 'initialProject={picture?.project}')
s=s.replace("reviewTarget={category===(initial?.category??'outfit')&&picture===initial&&initial?.reviewId?{id:initial.reviewId,revision:initial.reviewRevision??0,wearable:initial.wearableReview}:undefined}","reviewTarget={picture?.reviewId?{id:picture.reviewId,revision:picture.reviewRevision??0,wearable:picture.wearableReview}:undefined}")
s=s.replace('initialPrepared={initial?.prepared&&picture===initial}', 'initialPrepared={picture?.prepared}')
s=s.replace('<div className="atelier-upload-entry">','''{draft&&<aside className="atelier-draft-banner"><span>Saved draft: {draft.name} · {new Date(draft.updatedAt).toLocaleString()}</span><button className="btn" onClick={()=>{setPicture({filename:draft.name+'.png',dataUrl:draft.sourceDataUrl,category:category,prepared:true,project:draft.project,reviewId:draft.reviewTarget?.id,reviewRevision:draft.reviewTarget?.revision,wearableReview:draft.reviewTarget?.wearable,accessoryDepth:draft.depth});setVersion(v=>v+1);setStage('edit');setDraft(undefined);}}>Resume draft</button><button className="btn" onClick={()=>{void deleteEditorDraft(draft.key).then(()=>setDraft(undefined));}}>Discard draft</button></aside>}<div className="atelier-upload-entry">''',1)
p.write_text(s,encoding='utf-8')
