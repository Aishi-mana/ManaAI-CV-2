from pathlib import Path
entry='''## Compact editor tools dock — 2026-10-18

UI refinement after user screenshots: selected track tools now open in a bounded dark bottom dock inside the music editor, outside the scrolling track grid. Timeline retains at least 140px; tools have an explicit Close tools button and their own bounded scroll. Compact trim/fade, track and note controls use matching dark fields and buttons. Piano-roll width follows its container using ResizeObserver, removing the large unused area on wide windows while retaining horizontal scrolling for longer sections. Audio/render behavior unchanged. Production frontend build passed. Visual verification remains pending because the earlier browser usage approval gate is unresolved. Final native rebuild still requires Mana to be closed.

'''
for name in ['NEXT_CHAT_HANDOFF.md','MUSIC_STUDIO.md','MUSIC_STUDIO_PLAN.md','DEVLOG.md','CHANGELOG.md']:
 p=Path('docs')/name;s=p.read_text(encoding='utf-8');head,body=s.split('\n',1);p.write_text(head+'\n\n'+entry+body.lstrip('\n'),encoding='utf-8')
