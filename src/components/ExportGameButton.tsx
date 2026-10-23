import {useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {inTauri} from '../core/useLlama';
import {exportPlayableGame} from '../core/gameExport';
export default function ExportGameButton({title,code,disabled=false,progressScope}:{title:string;code:string;disabled?:boolean;progressScope?:string}){
 const [working,setWorking]=useState(false),[path,setPath]=useState(''),[error,setError]=useState('');
 async function save(){setWorking(true);setError('');setPath('');try{setPath(await invoke<string>('export_game',{content:exportPlayableGame(title,code,progressScope)}));}catch(e){setError(String(e));}finally{setWorking(false);}}
 return <div className="playground-export"><button className="btn" disabled={disabled||working||!inTauri||!code.trim()} onClick={()=>void save()}>{working?'Exporting…':'Export playable game'}</button>{path&&<p role="status">Saved standalone game: <input aria-label="Exported game path" readOnly value={path} onFocus={e=>e.target.select()}/><span className="hint-soft">Open this HTML file in your browser to play. Run reports stay in Mana.</span></p>}{error&&<p role="alert">{error}</p>}</div>;
}
