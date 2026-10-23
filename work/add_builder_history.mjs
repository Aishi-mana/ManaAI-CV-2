import fs from 'node:fs';const path='src/components/CoverBuilder.tsx';let s=fs.readFileSync(path,'utf8');s="import {createBuilderHistory,recordBuilderEdit,undoBuilderEdit,redoBuilderEdit,describeBuilderEdit,type BuilderSnapshot} from '../core/builderHistory';\n"+s;
s=s.replace('p.onChange(', 'editDraft(').replace('onChange={p.onChange}', 'onChange={editDraft}');
const anchor=' const selectedInstrument=';
const history=` const history=useRef(createBuilderHistory({draft:p.draft,choices:{},customs:{}}));
 const [,refreshHistory]=useState(0);
 function applySnapshot(snapshot:BuilderSnapshot){setChoices(snapshot.choices);setCustoms(snapshot.customs);if(snapshot.draft!==p.draft)p.onChange(snapshot.draft);}
 function commitSnapshot(snapshot:BuilderSnapshot,label:string,group?:string){const next=recordBuilderEdit(history.current,snapshot,label,group);if(next===history.current)return;history.current=next;applySnapshot(next.present);refreshHistory(n=>n+1);}
 function editDraft(draft:BuilderDraft){const {label,group}=describeBuilderEdit(history.current.present.draft,draft);commitSnapshot({...history.current.present,draft},label,group);}
 function chooseInstrument(t:BuilderTrack,instrument:string){commitSnapshot({...history.current.present,choices:{...choices,[t.id]:instrument},customs:{...customs,[t.id]:defaultInstrumentCustom(instrument)}},'Choose instrument');setCandidate(undefined);}
 function restoreHistory(direction:'undo'|'redo'){
  if(blocked)return;
  const label=direction==='undo'?history.current.past.at(-1)?.label:history.current.future[0]?.label;
  const next=direction==='undo'?undoBuilderEdit(history.current):redoBuilderEdit(history.current);
  if(next===history.current)return;
  history.current=next;clear();setCandidate(undefined);setHarmonyCandidate(undefined);applySnapshot(next.present);refreshHistory(n=>n+1);setMessage((direction==='undo'?'Undid: ':'Redid: ')+label+'. Prepare a mix preview to hear it.');
 }
 useEffect(()=>{if(history.current.present.draft!==p.draft){history.current=createBuilderHistory({draft:p.draft,choices:{},customs:{}});setChoices({});setCustoms({});setCandidate(undefined);setHarmonyCandidate(undefined);clear();refreshHistory(n=>n+1);}},[p.draft]);
`;
s=s.replace(anchor,history+anchor);
s=s.replace("history.current.past.at(-1)?.label","history.current.past[history.current.past.length-1]?.label");
s=s.replace('setCustoms({...customs,[t.id]:{...tuning(t),...patch}});',"commitSnapshot({...history.current.present,customs:{...customs,[t.id]:{...tuning(t),...patch}}},'Pitch / note hold',t.id+':tuning');");
s=s.replaceAll('setChoices({...choices,[t.id]:e.target.value});setCustoms({...customs,[t.id]:defaultInstrumentCustom(e.target.value)});setCandidate(undefined);','chooseInstrument(t,e.target.value);');
s=s.replace('setCustoms({...customs,[t.id]:defaultInstrumentCustom(selectedInstrument(t))});setCandidate(undefined);','chooseInstrument(t,selectedInstrument(t));');
s=s.replace("change(t.id,{role:e.target.value as BuilderTrack['role']});setChoices({...choices,[t.id]:''});setCandidate(undefined);", "commitSnapshot({...history.current.present,draft:{...p.draft,tracks:p.draft.tracks.map(q=>q.id===t.id?{...q,role:e.target.value as BuilderTrack['role']}:q)},choices:{...choices,[t.id]:''}},'Source instrument');setCandidate(undefined);");
s=s.replace("clear();editDraft({title:'',tracks:[]});setCandidate(undefined);setChoices({});", "clear();commitSnapshot({draft:{title:'',tracks:[]},choices:{},customs:{}},'New draft');setCandidate(undefined);");
s=s.replace('<section className="cover-builder">',`<section className="cover-builder" onPointerDownCapture={()=>{history.current.group=undefined;}} onBlurCapture={()=>{history.current.group=undefined;}} onKeyDownCapture={e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const target=e.target as HTMLElement;if(target.closest('input:not([type="range"]),textarea,select,[contenteditable="true"]'))return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();restoreHistory(key==='y'||e.shiftKey?'redo':'undo');}}>`);
s=s.replace('<div className="builder-actions builder-save">',`<div className="builder-actions builder-save"><button className="btn" disabled={blocked||!history.current.past.length} title={'Undo'+(history.current.past.length?' · '+history.current.past[history.current.past.length-1].label:'')+' (Ctrl+Z)'} onClick={()=>restoreHistory('undo')}>↶ Undo</button><button className="btn" disabled={blocked||!history.current.future.length} title={'Redo'+(history.current.future.length?' · '+history.current.future[0].label:'')+' (Ctrl+Shift+Z / Ctrl+Y)'} onClick={()=>restoreHistory('redo')}>↷ Redo</button>`);
fs.writeFileSync(path,s);
