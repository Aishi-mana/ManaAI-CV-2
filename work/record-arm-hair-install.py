from pathlib import Path
old='Desktop replacement currently blocked: Windows tasklist confirms mana.exe PID151384 running (sandboxed Get-Process could not see it); close request sent to user. Compilation/tests completed; packaged clothing_fit hash checked, but new frontend executable is NOT installed yet. Finish rebuild after closure.'
new='Installed successfully on 2026-10-30 after user confirmed Mana closed. Debug desktop rebuild passed (work/arm-hair-build-installed.txt), replacing src-tauri/target/debug/mana.exe. Packaged clothing_fit SHA256 matches source. Prior 377 frontend +33 fitting tests passed; no further code changes during installation.'
for name in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md','docs/GENERATED_OUTFITS.md']:
 p=Path(name);s=p.read_text(encoding='utf-8');p.write_text(s.replace(old,new),encoding='utf-8')
