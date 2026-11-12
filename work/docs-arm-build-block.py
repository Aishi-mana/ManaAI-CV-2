from pathlib import Path
for name in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md','docs/GENERATED_OUTFITS.md']:
 p=Path(name);s=p.read_text(encoding='utf-8').replace('Final desktop rebuild completed; packaged clothing_fit hash checked.','Desktop replacement currently blocked: Windows tasklist confirms mana.exe PID151384 running (sandboxed Get-Process could not see it); close request sent to user. Compilation/tests completed; packaged clothing_fit hash checked, but new frontend executable is NOT installed yet. Finish rebuild after closure.');p.write_text(s,encoding='utf-8')
