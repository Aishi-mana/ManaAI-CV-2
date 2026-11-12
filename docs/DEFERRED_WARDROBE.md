## Current status — October 31 (supersedes historical notes below)

<!-- current-status-2026-11-06 -->
## Current status — 2026-11-06

See [CURRENT_STATUS.md](CURRENT_STATUS.md). Editable layers/history, recovery, creative clothing generation, bangs/back-hair generation, accessory creation and their schedules are implemented; earlier deferrals of these features are superseded. Automatic garment cleanup remains OFF by user choice. Manual behind-body occlusion and review are the accepted workflow. Complex accessories, broader style/fit consistency and unobserved live schedule tests remain open; do not resume saved-outfit edits or automatic cleanup experiments.

The accepted outfit flow is clothing-only generation → fitting/sizing → checks → review/save. Automatic collar/fabric cleanup is OFF; the user handles occlusion by selecting parts and placing them behind the body in Atelier. Do not restart automatic cleanup experiments or alter saved outfits.

Outfit, hairstyle and accessory schedules, independent review/editable layers, inspect/compare, notes, filtering, duplication and batch actions are implemented. Hair/accessory restore-initial-fit is available. This supersedes older scheduling/hairstyle deferrals below. Live scheduled runs and wider visual checks remain user validation; art-style consistency and unusual sleeve/hair fitting are still limitations. Complex accessories beyond small hair accessories remain deferred.

## Current status — 2026-10-27

The user reauthorized all five outfit improvements below. Broader checks, conservative opening cleanup, retained editable review projects/history, cached-job recovery controls and local-model creative outfit ideas are now implemented. See [GENERATED_OUTFITS.md](GENERATED_OUTFITS.md) and the latest handoff for limitations/validation. The historical deferral text below is superseded for those five items. Further complex hair/accessory expansion is not implied.

# Deferred wardrobe work

Status: **Deferred at the user's request on 2026-10-26. Do not resume these items unless requested.**

The accepted outfit pipeline remains in place: generate clothing-only, fit, resize, check coverage, clean openings, then review/save. Preserve clothing behind front hair. Review allows manual adjustments. Do not alter saved outfits or run more generation/cleanup experiments as part of this backlog.

Deferred items:
- Broader sleeve, cuff and shoulder fitting checks.
- Further collar and sock/shoe rim cleanup improvements.
- Full editable outfit project/history preservation; outfit reviews currently retain flattened output rather than the original editing history.
- Failed-job recovery controls that resume preparation without generating again.
- Free-form fashion invention beyond the current curated outfit idea combinations.
- Broader accessory generation beyond the simple colored bow/star-clip flow reauthorized below.
- Autonomous hairstyle generation, extraction, front/back separation and fitting, including handling extra face/attachment content.
- Further hairstyle generation and complex accessory expansion.

Existing Hair/Accessories creation shortcuts open the manual Atelier workflow. Their review storage is implemented; they are not autonomous wearable creation.

The existing once-weekly outfit setting is unchanged. A real scheduled generation has not yet been observed in validation. This deferral does not disable the user's schedule.

## Current UI work

Saved looks and Seasons now use visual inventory grids. Saved look cards preview the combined look and apply it; Rename/Delete remain separate controls. Season cards preview assignments, apply them manually, and provide a searchable visual saved-look picker. Calendar and generation-season preferences remain available in a collapsible settings section. This is UI work only, without image generation or wardrobe asset changes.

## Reauthorized simple accessories (2026-10-26)

User approved automatic accessories first. For review now includes a local Qwen generator for colored bows/star clips, edge-connected neutral background cleanup, disconnected-speck filtering, temple placement scaled from body head bounds, and durable editable accessory review submission. Depth starts at top; Atelier can adjust it. Always review, no immediate equip/save and no accessory schedule. White lace, jewelry, arbitrary accessories, semantic person removal and complex shadow matting are outside this first version. Outfit cleanup and automatic hair remain deferred.

User subsequently reauthorized free-text accessory descriptions and local-chat-model design ideas. Those are now implemented in the same hair-accessory fit/review flow. This does not reauthorize automatic hairstyle creation or further outfit cleanup.

## Hairstyle feasibility trial reauthorized (2026-10-27)

User approved one hairstyle trial. One image and two fitted transparent trial layers were prepared and previewed. No production hairstyle generator is wired yet; broader autonomous hairstyle creation remains pending visual acceptance and an explicit next step. See NEXT_CHAT_HANDOFF.md.

## Assisted bangs/back workflow reauthorized and wired (2026-10-27)

After accepting the trial fit, user approved wiring one style of bangs+back generation into editable review. This is now implemented. Independent layers use uniform sizing and crown alignment; manual review remains required. Broader styles, autonomous hairstyle choice/scheduling and general semantic extraction are still deferred. Current accepted color/shadow discrepancy does not authorize more style experiments. Outfit cleanup remains deferred.
