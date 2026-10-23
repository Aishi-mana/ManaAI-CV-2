from pathlib import Path
entry='''## Hands-free song requests connected — 2026-10-18

User passed ordinary hands-free conversation, then screenshots confirmed song requests went to ordinary chat and were repeated instead of played. ChatPanel now intercepts recognized musical commands before onSend, resolves enabled saved Chat clips by exact normalized title/alias and plays existing audio through shared voice playback. Accepts character address and dictation commas (e.g. Mana, sing Trails / Sing, Reach Out to the Truth). No fuzzy guesses for misrecognized titles such as Sting trails; add aliases in Chat clips for short names. Generic sing/hum requests use existing selection. Unknown songs report available titles and stop hands-free with visible feedback instead of inventing a rendition.

Dedicated loading/playing song phases keep microphone closed and bypass only the hands-free music-stop guard; spontaneous music remains blocked. Playback completion uses existing cooldown before capture resumes. Stop/hidden app/error handling preserved; session counter suppresses obsolete completion callbacks. Successful requests use existing user-message/music-note history and replay path. No song generation or transcription model changes.

Validation: production frontend and native debug builds passed; 206 frontend tests passed, 2 optional skipped. New command parsing tests cover named address, punctuation, aliases, ordinary sentences and rejected misheard titles; existing cancellation/noise tests pass. Live song request/playback/resume and Stop during song await user check; browser verification remains unavailable under prior usage gate.

'''
for name in ['NEXT_CHAT_HANDOFF.md','DEVLOG.md','CHANGELOG.md','SONGS.md','MUSICAL_MOMENTS.md']:
 p=Path('docs')/name;s=p.read_text(encoding='utf-8');head,body=s.split('\n',1);s=head+'\n\n'+entry+body.lstrip('\n');s=s.replace('Named requests through the hands-free speech loop remain future work.','Named requests through the hands-free speech loop are now connected; see latest status above.').replace('Hands-free suppresses musical initiative; musical requests through its speech-to-chat loop are not intercepted yet.','Hands-free suppresses spontaneous musical initiative; explicit spoken song/hum requests use saved audio and resume listening afterward.')
 p.write_text(s,encoding='utf-8')
