from pathlib import Path
p=Path('src/components/ArtifactCodePlayground.tsx');p.write_text('''import {useState} from 'react';
import CodePlayground from './CodePlayground';
export default function ArtifactCodePlayground({source}:{source:string}){
 const [code,setCode]=useState(source),[open,setOpen]=useState(false);
 return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary>Run JavaScript game</summary>{open&&<CodePlayground code={code} onCode={setCode}/>}</details>;
}
''',encoding='utf-8')
p=Path('src/components/GoalsDrawer.tsx');s=p.read_text(encoding='utf-8').replace("{artifact.kind==='code'&&<details><summary>Run JavaScript game</summary><ArtifactCodePlayground source={artifact.content}/></details>}","{artifact.kind==='code'&&<ArtifactCodePlayground source={artifact.content}/>}");p.write_text(s,encoding='utf-8')
p=Path('src/core/codeSandbox.ts');s=p.read_text(encoding='utf-8').replace("else if(m.type==='tick'&&worker)worker.postMessage(m);", "else if(m.type==='stop'&&worker){worker.terminate();worker=null;}else if(m.type==='tick'&&worker)worker.postMessage(m);");p.write_text(s,encoding='utf-8')
p=Path('src/components/CodePlayground.tsx');s=p.read_text(encoding='utf-8').replace('frame.current?.remove();', "frame.current?.contentWindow?.postMessage({type:'stop'},'*');frame.current?.remove();");s=s.replace("else if(message?.type==='ready'){", "else if(message?.type==='ready'&&waiting){").replace("else if(message?.type==='frame'){", "else if(message?.type==='frame'&&waiting){");p.write_text(s,encoding='utf-8')
