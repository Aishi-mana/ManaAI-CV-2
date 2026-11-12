from pathlib import Path
for name in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md','docs/GENERATED_OUTFITS.md']:
 p=Path(name);s=p.read_text(encoding='utf-8').replace('mint-dress/{composite.jpg,collar-preview.jpg}','mint-dress/composite.jpg and exports/images/collar-cleanup-20261030/collar-preview.jpg');p.write_text(s,encoding='utf-8')
