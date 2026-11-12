from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(path,before,after):
 p=root/path;s=p.read_text(encoding='utf-8');assert before in s,(path,before);p.write_text(s.replace(before,after),encoding='utf-8')
edit('src/core/useWhisper.ts',"else if(decision==='silence'){void cancel();setError('No speech detected. Hands-free stopped; try again when ready.');}","else if(decision==='silence')void finish();")
edit('src/core/handsFree.ts','Math.max(0.012,','Math.max(0.003,')
edit('src/components/ChatPanel.tsx',"import GeneratedPictureView", "import {createPortal} from 'react-dom';\nimport GeneratedPictureView")
edit('src/components/ChatPanel.tsx','{voiceOpen&&<div className="voice-controls">','{voiceOpen&&createPortal(<div className="voice-menu-backdrop" onClick={()=>setVoiceOpen(false)}><section className="voice-menu" role="dialog" aria-modal="true" aria-label="Voice settings" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key===\'Escape\')setVoiceOpen(false);}}><header><h2>Voice settings</h2><button autoFocus className="btn" onClick={()=>setVoiceOpen(false)}>Back to chat</button></header><div className="voice-controls">')
edit('src/components/ChatPanel.tsx','<CustomVoiceSetup disabled={speech.speaking||handsOn}/>\n        </div>}','<CustomVoiceSetup disabled={speech.speaking||handsOn}/>\n        </div></section></div>,document.body)}')
edit('src/components/CustomVoiceSetup.tsx','Selected reference WAV','Speech guide WAV')
edit('src/components/CustomVoiceSetup.tsx','Matching reference transcript','Matching speech guide transcript')
edit('src/components/CustomVoiceSetup.tsx','Choose chat and singing voices separately. The trained chat voice stays ready between replies; reference voice uses your selected reference below.','Choose chat and singing voices separately. For trained voices, the speech guide below controls delivery, then the selected Mana or Mousey model supplies the final voice. Seeing a Mana guide while using Mousey is expected. Reference voice uses the guide directly.')
edit('src/components/SingingDrawer.tsx',"setStatus('Library is full (50 projects). Remove a library entry to make room; files will be kept.');return;","setLog('');setStatus('Library is full (50 projects). Open Song Player and remove a library entry to make room; audio files will be kept.');return;")
edit('src/components/SingingDrawer.tsx','<details><summary>Processing details</summary><pre className="studio-log">{log}</pre></details></div>', '<p role="status" className="cover-inline-status">{status}</p>{studio.projects.length>=50&&<button className="btn" onClick={()=>setTab(\'player\')}>Open Song Player to make room</button>}<details><summary>Processing details</summary><pre className="studio-log">{log}</pre></details></div>')
edit('src/components/SingingDrawer.tsx',"setWholeSong(true);setTab('create');","setWholeSong(true);setLog('');setStatus('Original song selected. Choose a singing voice, then make your cover.');setTab('create');")
with (root/'src/styles.css').open('a',encoding='utf-8') as f:f.write('''
.voice-menu-backdrop{position:fixed;inset:0;z-index:1000;background:#30253a88;display:flex;padding:24px;box-sizing:border-box}
.voice-menu{width:min(1100px,100%);margin:auto;max-height:100%;overflow:auto;background:#fff8ff;border:1px solid #d9ccf2;border-radius:20px;padding:24px;box-sizing:border-box}
.voice-menu>header{display:flex;align-items:center;justify-content:space-between;gap:16px}
.voice-menu .voice-controls{max-height:none;overflow:visible}
.voice-menu .custom-voice-setup{width:100%}
.cover-inline-status{white-space:pre-wrap;overflow-wrap:anywhere}
''')
