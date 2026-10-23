import {useState} from 'react';
import CodePlayground from './CodePlayground';
export default function ArtifactCodePlayground({source}:{source:string}){
 const [code,setCode]=useState(source),[open,setOpen]=useState(false);
 return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary>Run JavaScript game</summary>{open&&<CodePlayground code={code} onCode={setCode}/>}</details>;
}
