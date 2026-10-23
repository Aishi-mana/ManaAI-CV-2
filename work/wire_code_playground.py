from pathlib import Path
p=Path('src/components/GoalsDrawer.tsx');s=p.read_text(encoding='utf-8');s="import ArtifactCodePlayground from './ArtifactCodePlayground';\n"+s;s=s.replace('    <ExportWorkButton artifact={artifact}/>', '    <ExportWorkButton artifact={artifact}/>\n    {artifact.kind===\'code\'&&<details><summary>Run JavaScript game</summary><ArtifactCodePlayground source={artifact.content}/></details>}');p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8');s="import CodePlayground from './components/CodePlayground';\nimport {SANDBOX_EXAMPLE,SANDBOX_INSTRUCTIONS,sandboxCode} from './core/codeSandbox';\n"+s;s=s.replace('  const [showSkills,setShowSkills]=useState(false);','  const [showSkills,setShowSkills]=useState(false);\n  const [showCode,setShowCode]=useState(false),[playgroundCode,setPlaygroundCode]=useState(SANDBOX_EXAMPLE),[codeGenerating,setCodeGenerating]=useState(false),[codeError,setCodeError]=useState(\'\');')
s=s.replace(' || showSkills ||', ' || showCode || showSkills ||').replace('showEvents,showSkills,', 'showEvents,showCode,showSkills,')
s=s.replace('<button className="btn" onClick={()=>setShowSkills(true)}>Skills</button>', '<button className="btn" onClick={()=>setShowSkills(true)}>Skills</button>\n          <button className="btn" onClick={()=>setShowCode(true)}>Code playground</button>')
idx=s.index('  async function startConversation(')
s=s[:idx]+'''  async function draftPlayground(request:string){
    if(abortRef.current||busy||reflecting||storage.error||llama.status!=='ready')return;
    const ctrl=new AbortController();abortRef.current=ctrl;setCodeGenerating(true);setReflecting(true);setCodeError('');
    let text='';
    try{await streamChat({port:llama.port,temperature:.4,signal:ctrl.signal,messages:[{role:'system',content:SANDBOX_INSTRUCTIONS},{role:'user',content:request.slice(0,1000)}],onToken:token=>{text+=token;if(text.length>24000)ctrl.abort();}});
      if(ctrl.signal.aborted)throw Error('Draft stopped. Previous source kept.');
      setPlaygroundCode(sandboxCode(text.replace(/^(?:\\s*<think>[\\s\\S]*?<\\/think>\\s*)+/,'')));
    }catch(e){setCodeError(ctrl.signal.aborted?'Draft stopped. Previous source kept.':String(e));}
    finally{if(abortRef.current===ctrl)abortRef.current=null;setCodeGenerating(false);setReflecting(false);}
  }

'''+s[idx:]
anchor='      {showSkills&&<SkillsDrawer'
idx=s.index(anchor);s=s[:idx]+'''      {showCode&&<><div className="scrim" onClick={()=>{if(codeGenerating)abortRef.current?.abort();setShowCode(false);}}/><section className="drawer code-drawer" role="dialog" aria-label="Code playground"><header className="drawer-head"><h2>Code playground</h2><button className="btn" onClick={()=>{if(codeGenerating)abortRef.current?.abort();setShowCode(false);}}>Close</button></header><div className="drawer-body">{codeError&&<p role="alert">{codeError}</p>}<CodePlayground code={playgroundCode} onCode={setPlaygroundCode} generating={codeGenerating} canGenerate={!busy&&!reflecting&&!storage.error&&llama.status==='ready'} onGenerate={request=>void draftPlayground(request)} onStopGeneration={()=>abortRef.current?.abort()}/></div></section></>}
'''+s[idx:];p.write_text(s,encoding='utf-8')
