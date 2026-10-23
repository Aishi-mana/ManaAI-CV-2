# Daily outfit pools

Open Wardrobe → Daily looks. Add current look or named saved looks to Morning pool and Night pool, set times (default08:00/20:00), then enable Let Mana choose her daily outfits. Close wardrobe for the current period to be checked immediately. Pools are independent; add the same look to both if desired. No new artwork is necessary, though one available combination produces the same appearance.

The scheduler uses the journal timezone, checks once/minute while visible, and catches up once on startup/resume. It does not run while Mana is closed, and does not replay every missed change. The latest due morning/night period determines the pool; before morning, the current period is the previous night's. Date/period/time/last choice persist in normal avatar backups, preventing rerolls on reopen. Manual outfit changes remain until the next due period. Disabling then re-enabling within a completed period does not reroll it.

Only user-added pool snapshots are eligible. Up to20 distinct combinations per pool; duplicate combinations with different names count once. A different current combination is preferred when possible. Missing/locked skin, hair, outfit or accessories exclude a candidate; an empty/ineligible pool leaves her look alone. Pool edits do not modify saved looks. Removing/deleting a saved look later does not remove its approved snapshot from a pool. Remove it from the pool to revoke that choice.

Changes pause while Wardrobe/Backgrounds is open so the scheduler cannot overwrite your edits, and while persistence reports an error. Selection preserves body view/background, seasonal assignments and wardrobe look library. Seasonal assignments still apply manually. Random selection is local and uses no model inference or image generation. Future preference-based choice is separate.

Validation:255 tests passed,2 optional skipped; frontend/native builds checked. Live check: add eligible looks, enable, close wardrobe, reopen to inspect Last choice, and restart Mana to confirm it does not choose again in the same period. The scheduled morning/night transitions remain live acceptance checks.
