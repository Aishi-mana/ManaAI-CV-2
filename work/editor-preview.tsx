import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import CoverBuilder from '../src/components/CoverBuilder';
import '../src/styles.css';
const names=['Mana · lead vocal','Piano · Whereabouts','Guitar · bright room','Drums · rock kit','Bass · finger'];
const base='exports/singing/sax-phrasing-elvis-2026-10-16/';
const long=new URLSearchParams(location.search).has('long');
const longPath='exports/singing/1792197095600/vc_guide-vocals_singing_1.0_50_0.7.wav';
(window as any).__TAURI_INTERNALS__={invoke:async(cmd:string,args:any)=>{if(cmd==='singing_audio')return fetch('/'+args.path).then(r=>r.arrayBuffer());throw Error('Preview harness: '+cmd);}};
function Demo(){const [draft,setDraft]=useState<any>({title:'Whereabouts of Light',tracks:names.map((name,i)=>({id:'track-demo-'+i,name,role:['vocal','piano','guitar','drums','bass'][i],path:long?longPath:base+(i===0?'original-extracted-sax.wav':'previous-sax.wav'),originalPath:base+'original-extracted-sax.wav',seconds:long?288.04:15,offset:i===2?1:0,gain:.7,converted:false,muted:false}))});return <main className="music-studio" style={{height:"100vh"}}><header className="studio-header"><h1>Music Studio</h1><p>Cover Builder</p></header><div className="studio-layout is-builder"><aside className="studio-library">Your library</aside><section className="studio-builder-area"><CoverBuilder draft={draft} onChange={setDraft} busy={false} active onBusy={()=>{}} onSave={()=>{}} canSave/></section></div></main>;}
createRoot(document.getElementById('root')!).render(<Demo/>);
