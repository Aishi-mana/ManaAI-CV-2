from pathlib import Path
root=Path(__file__).resolve().parents[1]
for name in ['docs/CURRENT_STATUS.md','docs/NEXT_CHAT_HANDOFF.md','docs/ROADMAP.md','docs/MUSIC_STUDIO.md','docs/CHANGELOG.md']:
 p=root/name;s=p.read_text(encoding='utf-8').replace('4shared piano unit tests','5shared piano unit tests')
 if name=='docs/CURRENT_STATUS.md':s=s.replace('The preview/player fix was installed successfully on 2026-11-06. No installation, download, generation or model-training job is pending.','The preview/player fix was installed on 2026-11-06; the shared piano update was installed on 2026-11-08. No installation, download, generation or model-training job is pending.')
 p.write_text(s,encoding='utf-8')
p=root/'docs/NEXT_CHAT_HANDOFF.md'
p.write_text(p.read_text(encoding='utf-8')+'\nFinal install verified: work/piano-shared-install-final.log, target/debug/mana.exe built successfully; seven packaged helper hashes match sources. Five piano tests include real sample-render percussion on/off equality;394JS tests pass/2optional skipped;2genre tests;Builder direct-track regression and native/frontend checks passed. App restart/user feature test is next. No close/permission prompt required; Windows allowed replacement.\n',encoding='utf-8')
