from pathlib import Path
p=Path('src/components/BuilderTimeline.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace('      {toolsTrack===t.id&&p.selected===t.id&&<div className="editor-track-tools-row">{p.renderTrackTools(t)}</div>}','')
s=s.replace('\n </section>;', '\n  {selected&&toolsTrack===selected.id&&<aside className="editor-tools-dock" aria-label="Selected track tools"><div className="editor-tools-dock-heading"><strong>Track tools <span>· {selected.name}</span></strong><button className="btn" onClick={()=>setToolsTrack(\'\')}>Close tools</button></div><div className="editor-tools-dock-content">{p.renderTrackTools(selected)}</div></aside>}\n </section>;')
p.write_text(s,encoding='utf-8')
p=Path('src/components/BuilderNoteEditor.tsx');s=p.read_text(encoding='utf-8').replace('useRef,useState','useEffect,useRef,useState')
s=s.replace(' const latest=useRef(p);', ''' const roll=useRef<HTMLDivElement>(null),[rollWidth,setRollWidth]=useState(644);
 useEffect(()=>{const node=roll.current;if(!node)return;const observer=new ResizeObserver(entries=>setRollWidth(entries[0].contentRect.width));observer.observe(node);return ()=>observer.disconnect();},[]);
 const latest=useRef(p);''')
s=s.replace('width=Math.max(600,edit.seconds*40)', 'width=Math.max(600,rollWidth-46,edit.seconds*40)')
s=s.replace('<div className="builder-piano-roll">','<div className="builder-piano-roll" ref={roll}>')
p.write_text(s,encoding='utf-8')
