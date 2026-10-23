from pathlib import Path
p=Path('src/components/ChatPanel.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('>Voice</button>','>Voice settings</button>',1).replace('{speech.speaking&&<button className="btn" onClick={()=>handsOn?stopHandsFree():void speech.stop()}>Stop voice</button>}', '{speech.speaking&&!handsOn&&<button className="btn" onClick={()=>void speech.stop()}>{speech.musicPlaying?\'Stop song\':\'Stop voice\'}</button>}')
start=s.index('        <span className="hint-soft" role="status">{handsOn?handsStage')
end=s.index('</span>',start)+len('</span>')
old=s[start:end]; expr=old[old.index('{handsOn?')+1:old.rindex('}')]
# Idle state reflects actual playback, rather than showing a recognizer label while singing.
expr=expr.replace(":whisper.phase==='transcribing'?'Transcribing locally…'", ":speech.musicPlaying?'Playing song…':speech.generating?'Preparing voice…':speech.speaking?'Speaking…':whisper.phase==='transcribing'?'Transcribing locally…'",1)
s=s[:start]+'        <span className={`voice-session-status is-${voiceState}`} role="status"><span className="voice-state-dot" aria-hidden="true"/>{voiceStatus}</span>'+s[end:]
idx=s.index('  return (\n    <>')
s=s[:idx]+f'''  const voiceStatus={expr};
  const voiceState=handsError||whisper.error||dictation.error?'error':speech.musicPlaying?'music':speech.speaking||speech.generating?'speaking':whisper.phase==='recording'||dictation.listening?'listening':handsOn||micActive||busy?'working':'idle';
'''+s[idx:]
s=s.replace('<div className="input-toolbar">','<div className="input-toolbar" aria-label="Voice and microphone controls">\n        <div className="voice-session-actions" role="group" aria-label="Hands-free conversation">')
s=s.replace('<button className="btn" disabled={!handsOn&&', '<button className={`btn hands-free-toggle ${handsOn?\'is-active\':\'\'}`} aria-pressed={handsOn} title={handsOn?\'Stop listening and playback\':\'Talk, hear replies and request saved songs\'} disabled={!handsOn&&',1)
s=s.replace("{handsOn?'Stop hands-free':'Start hands-free'}</button>","{handsOn?'■ Stop hands-free':'Start hands-free'}</button></div>",1)
s=s.replace('        <button className="btn" aria-expanded={inputOpen}', '        <div className="voice-record-actions" role="group" aria-label="Record a message">\n        {!handsOn&&<button className="btn" aria-expanded={inputOpen}',1)
s=s.replace('>Voice input</button>',' title="Choose recognition engine and microphone settings">Input settings</button>}',1)
s=s.replace("        {microphoneEngine==='windows'?<button", "        {!handsOn&&(microphoneEngine==='windows'?<button",1)
s=s.replace("onClick={()=>void whisper.cancel()}>Cancel</button>}</>}","onClick={()=>void whisper.cancel()}>Cancel</button>}</>)}\n        </div>",1)
s=s.replace('        <span className={`voice-session-status', '        <span className={`voice-session-status',1)
p.write_text(s,encoding='utf-8')
