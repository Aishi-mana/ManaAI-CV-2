from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8').replace(" const draftFlush=useRef", " draftKey.current=reviewTarget?category+':'+reviewTarget.id:category+':workspace';\n const draftFlush=useRef",1);p.write_text(s,encoding='utf-8')
p=Path('src/components/Atelier.tsx');s=p.read_text(encoding='utf-8').replace('reviewTarget={picture?.reviewId?',"reviewTarget={category===(picture?.category??'outfit')&&picture?.reviewId?");p.write_text(s,encoding='utf-8')
note='''## 2026-10-27 - Review inspection, organization and local editor drafts

User approved all four review-experience improvements. Pending outfit cards now offer Inspect / compare: generated cached image, immutable initial-fit PNG for new review records, and current edited PNG; fixed whole/collar/shoulder/cuff/shoe views, checkerboard, zoom and on-Mana toggle. Generated stage is object-only, fitted/current can composite on current avatar with existing layer order. Initial-fit snapshots are retained at enqueue; older records missing that stage show unavailable, never substitute current edits as a fake before image. Uses cached files only; no image generation or fitting changes.

Pending outfit rename updates only pending design metadata; search by names/ideas and newest/oldest/name sorting organize queue. Rename refreshes list and editable project opens with current review name. Saved wardrobe records untouched.

Atelier autosaves source PNG, layers, brush regions, transformations, bounded undo/redo history, depth and review ID/revision to IndexedDB after1.2sec idle; attempts flush on editor unmount/pagehide. One general workspace draft per category plus per-review drafts. Atelier offers latest category draft with explicit Resume/Discard. Resume restores source/project and review revision; native stale revision protections still apply. Drafts are separate from approval or Wardrobe saves. IndexedDB quota/permission errors display a save-before-closing message. Abrupt process termination before storage completes cannot be guaranteed; no claim of crash-proof writes. Existing drafts are retained after explicit save for recovery. Full list of older drafts is not exposed, latest per category is offered.

Validation:363 frontend tests pass,2 optional skipped; new draft persistence/revision/history/discard test, existing preview-opacity/resize-undo tests retained.8 generated-outfit native tests pass; verifies initial-fit remains original after edits. Debug desktop build passed. No live UI/manual close-reopen test or new image generation performed. No existing wardrobe/appdata files edited during implementation. User will test UI later.

'''
for f in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md']:
 p=Path(f);p.write_text(note+p.read_text(encoding='utf-8'),encoding='utf-8')
p=Path('docs/GENERATED_OUTFITS.md');p.write_text(p.read_text(encoding='utf-8')+'\n'+note,encoding='utf-8')
