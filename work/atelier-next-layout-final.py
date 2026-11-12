from pathlib import Path
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8').replace('<div className="outfit-workspace-body"><div className="atelier-project-backup"><button', '<div className="outfit-workspace-body">{(stage===\'save\'||!embedded)&&<div className="atelier-project-backup"><button',1).replace('Export editable project</button></div>{draftStatus', 'Export editable project</button></div>}{draftStatus',1);p.write_text(s,encoding='utf-8')
p=Path('src/styles.css');s=p.read_text(encoding='utf-8')+'\n.atelier-backup-entry{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 24px}.atelier-project-backup{margin-bottom:12px}\n';p.write_text(s,encoding='utf-8')
p=Path('docs/WARDROBE_TEST_CHECKLIST.md');s=p.read_text(encoding='utf-8');s=s.replace('## Next: drafts and editing (no generation needed)','''## Comparison and precision controls (no generation needed)

- [ ] Open Inspect / compare in a wide window. Pick left/right stages, zoom, linked scrolling and View alone / return. Reduce window width: panels should stack at widths below1100px, stay large, and remain scrollable. Expand Close-ups and view controls when needed; Fit width resets magnification.
- [ ] Duplicate a pending review. Change the copy in Atelier and verify original pixels/notes/history remain unchanged. Initial fit and original generated preview should remain available if the original had them. Save or dismiss the copy independently.
- [ ] Lock a layer, then try dragging, resizing, arrows, numeric fitting and brush cleanup. Its pixels/position should stay unchanged. Unlock and repeat. Undo/redo should also restore the lock flag.
- [ ] Solo a selected layer and enable guides. Switch between layers to inspect them; guides and solo must not be baked into saved or exported images. Hidden layers still follow their normal export visibility.
- [ ] Try1/5/10pixel nudge buttons and arrow keys; Shift-arrows use10times the selected distance. Size/aspect/rotation should stay unchanged. Center layer horizontally should only move it sideways.
- [ ] Export editable project from Layers panel or Save step. The status gives its new file in exports/atelier-projects. Import that .mana-project.json from Atelier's Import editable project control. Verify source PNG, separate layers, lock flags, brush edits, depth and undo/redo. Imported backups are standalone working copies, not authority to overwrite the old review.

## Next: drafts and editing (no generation needed)''');p.write_text(s,encoding='utf-8')
