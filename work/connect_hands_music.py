from pathlib import Path
p=Path('src/core/songPool.ts');s=p.read_text(encoding="utf-8");s+='''
/** Strip an explicit character address and command punctuation, without guessing titles. */
export function musicCommandText(text:string,name:string):string{
 let command=text.trim();
 if(name&&command.slice(0,name.length).toLowerCase()===name.toLowerCase()&&/^[\\s,:]/.test(command.slice(name.length)))command=command.slice(name.length).replace(/^[\\s,:]+/,'');
 return command.replace(/^(sing|hum)\\s*,\\s*/i,'$1 ');
}
''';p.write_text(s,encoding="utf-8")
p=Path('src/components/ChatPanel.tsx');s=p.read_text(encoding="utf-8");s=s.replace('requestedSongTitle}', 'requestedSongTitle,musicCommandText,findSong}');s=s.replace('requestedMusic,musicalNoteClip','chooseMusic,planMusicAttempt,requestedMusic,musicalNoteClip');s=s.replace("'playing'|'cooldown'", "'playing'|'music-launch'|'music-playing'|'cooldown'")
s=s.replace('  const handsActive=useRef(false),','  const handsSession=useRef(0);\n  const handsActive=useRef(false),')
s=s.replace('if(speech.musicPlaying&&(busy||!ready||micActive||handsOn||', "if(speech.musicPlaying&&(busy||!ready||micActive||(handsOn&&handsStage!=='music-launch'&&handsStage!=='music-playing')||")
s=s.replace('speech.musicPlaying]);','speech.musicPlaying,handsStage]);',1)
s=s.replace("function stopHandsFree(reason=''){handsActive", "function stopHandsFree(reason=''){handsSession.current++;handsActive")
s=s.replace('handsActive.current=true;setHandsOn(true);','handsSession.current++;handsActive.current=true;setHandsOn(true);')
needle='  handsTranscript.current=review=>'
idx=s.index(needle)
s=s[:idx]+'''  async function playHandsMusic(text:string,kind:'hum'|'song',title:string|null){
    const session=handsSession.current;
    setHandsStage('music-launch');
    const state=validateMusicalState(initiative.music);
    const id=title?findSong(state.songs,title)?.id:chooseMusic(state,musicMood,kind);
    if(!id){onMusicUnavailable(text,state.songs.filter(s=>s.enabled).map(s=>s.title));stopHandsFree('Song not found. Check its title or alias in Chat clips.');return;}
    if(!ready||busy||speech.volume===0||document.visibilityState!=='visible'){stopHandsFree('Song playback is unavailable right now.');return;}
    const next=planMusicAttempt(state,id);
    onInitiativeState({...initiative,music:next});
    try{
      const started=await speech.playMusic(musicPath(id,next.songs));
      if(!handsActive.current||handsSession.current!==session)return;
      if(!started){stopHandsFree('Song playback did not start.');return;}
      const song=next.songs.find(s=>s.id===id);
      onMusicPlayed(song?.title??(kind==='hum'?'Humming':'Song'),kind,text);
      setHandsStage('music-playing');
    }catch(e){if(handsActive.current&&handsSession.current===session)stopHandsFree(String(e));}
  }
'''+s[idx:]
s=s.replace("handsBaseline.current=new Set(messages.filter", "const command=musicCommandText(review.text,charName),kind=requestedMusic(command),title=kind?null:requestedSongTitle(command);if(kind||title){void playHandsMusic(review.text,kind??'song',title);return;}handsBaseline.current=new Set(messages.filter",1)
s=s.replace("else if(handsStage==='playing'&&!speech.speaking)", "else if((handsStage==='playing'||handsStage==='music-playing')&&!speech.speaking)")
s=s.replace("handsStage==='launching'||handsStage==='playing'?'Hands-free: speaking…'", "handsStage==='music-launch'?'Hands-free: loading song…':handsStage==='music-playing'?'Hands-free: playing song…':handsStage==='launching'||handsStage==='playing'?'Hands-free: speaking…'")
p.write_text(s,encoding="utf-8")
