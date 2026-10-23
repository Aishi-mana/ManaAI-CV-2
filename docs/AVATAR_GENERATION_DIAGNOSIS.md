# Avatar generation diagnosis — 2026-10-22

The outfit PNG editor is paused at the user's request. These are local diagnostic jobs, not accepted production improvements.

Baseline: `exports/images/image-1792616476092891700`, Animagine, seed 4156193457, 768x1024, 28 steps, CFG 5.5, denoise 0.8. Floating background/fabric fragments are already present in raw `output.png`, before final compositing.

## Controlled comparisons

- `exports/images/sampler-quality-check-1792616874213249700`: identical request, only Euler changed to Euler Ancestral in a temporary worker. Completed successfully. Visual inspection: stray fabric persists and larger cloth-like shapes appeared at the sides. Rejected as a standalone fix. Production sampler unchanged.
- `exports/images/mask-quality-check-1792617767165032500`: original Euler and settings; intersect edit mask with body alpha expanded by 40 reference pixels in each direction. Completed successfully. Visual inspection: some outer fragments removed, but artifacts persist near hands/hair and the skirt edge is constrained. Rejected as a standalone fix. Production mask unchanged.
- Full-frame redraw comparison is being checked separately; same framed reference, no clothing mask, all other settings retained. This tests whether preserving the original head/hair via masked diffusion is preventing a coherent drawing.

The engine's internal SDXL VAE Conv2D scale warning is intentional in local source and is not evidence of decoder corruption. Do not replace the VAE based on that warning alone.

Do not label generation quality as passed based on successful execution or automated checks. Keep diagnostic images separate from the user's gallery and wardrobe.

## Full-frame redraw result

`exports/images/unmasked-quality-check-1792617855404745200`: completed successfully. The reference was the baseline's already-framed reference JPEG, with the clothing mask removed. Euler, seed, dimensions, prompt, guidance and denoise remained the same. The body/head drawing is more stylistically consistent, but hair became brown and the character lost Mana's face. Decorative marks persist in the background, suggesting they are generated decoration rather than solely compositing residue. This is also rejected as a production fix.

Conclusion: these three comparisons do not establish an acceptable generation fix. The current high-denoise image-to-image approach offers weak identity retention without a mask; preserving the head with a mask retains identity but creates style/transition mismatches. A dedicated identity-conditioning approach should be evaluated separately before another default change. No production worker, mask, prompt or executable was changed in this diagnostic session. No additional model downloads were performed.
