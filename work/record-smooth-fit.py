from pathlib import Path
note='''## 2026-10-30 — Smooth sleeve mapping and rigid cuffs; softened collar interior

User rejected rough edits and poorly fitted sleeve ends. Replaced separate per-row raster resampling with ONE premultiplied two-dimensional coordinate remap, smoothed along arm (not blur of artwork). Edge-band shaft adjustment remains bounded; cuff translates as one rigid unit (scale1), aligns its center to measured wrist and end to bounded wrist allowance. Smooth coordinate transition joins cuff to shaft. Cuff flowers, folds and slanted end are not row-stretched/tapered. Diagnostics include cuff_transforms (scale1) and resampling=single-smooth-map. Existing shoulder/footwear zones remain outside sleeve edits.

Collar interior removal now has subpixel alpha on removed-side edge only, surrounding decorated fabric/back rim remain unchanged. Does not claim to redraw inherently rough generated linework. New source-image/cached replay artifacts exports/images/smooth-fit-20261030; minted collar-arms-preview.jpg inspected, whole-body previews for4samples. Mint sleeve target miss2/3pixels per side, cuff miss0, hand coverage0. Collar opening still triggers conservative shoulder diagnostics; review required. Original user saved items untouched, no new generation. Existing raw collar illustrated outlines may still need human refinement; do not claim perfect result solely because coverage passes.

35 focused Python tests pass (23 clothing+6quality+6garment), logs work/smooth-*-tests.txt. Tests assert rigid cuff scale, source/shoulder/beyond-cuff preservation, first-row arm coverage, subpixel collar alpha, preserved upper/back rim/lower collar/negative dark garment. Installed both scripts in src-tauri/target/debug/scripts and verified hashes. No executable/UI change or app closure required. Future generation / Retry fitting uses new path.\n\n'''
for name in ['docs/NEXT_CHAT_HANDOFF.md','docs/DEVLOG.md']:
 p=Path(name);p.write_text(note+p.read_text(encoding='utf-8'),encoding='utf-8')
p=Path('docs/GENERATED_OUTFITS.md');p.write_text(p.read_text(encoding='utf-8')+'\n\n'+note,encoding='utf-8')
