# Diary illustrations

New saved daily journals and manual reflections now queue one illustration by default. In Diary, uncheck **Illustrate new diary entries with my current avatar** to turn this off for future entries. Existing entries are not backfilled automatically.

The text saves first. When chat and other media work are clear, the existing Qwen pipeline receives a bounded excerpt and mood, plus a freshly prepared current dressed avatar. Qwen chooses an imagined scene/action inspired by the writing; the illustration is not evidence of a real event. There is no separate scene-planning language-model call. Existing identity/proportion instructions apply. Avatar/Qwen must be installed; missing dependencies leave the text intact and report an error.

The image job uses the normal GPU chat lease, status, cancellation and release. A small progress card remains visible even if Diary is closed. Stop cancels image work and leaves text saved. The queue is session-only; unfinished pictures do not auto-resume on restart. Use **Add illustration** on the saved entry to retry or illustrate an older entry. **Draw another illustration** retains the old image until replacement succeeds. Deleting the active entry cancels its picture. Chat/reflection are blocked during the image job through existing media gating.

Click the diary picture to enlarge it; **Close image** returns to the diary. **Remove illustration** keeps the text. Images remain with entries moved to Recently deleted and restored. Permanent entry deletion removes its retained picture from diary storage, but raw generated job files in exports/images and older backups remain under existing behavior.

A compact JPEG up to350000 data-URL characters and the image request are retained directly on the diary entry. New attachments enforce a12million-character aggregate image budget, with a clear error instead of discarding old entries. Malformed optional artwork is ignored while preserving entry text. Standard backups include these images through diary validation; text exports exclude illustrations. Raw generated originals remain in the usual image job folder.

Validation:333 tests passed,2 optional skipped, including diary roundtrip/backup/deletion preservation, malformed images, image budget, bounded/escaped excerpts, toggle/enlarge UI handlers and mocked generation startup failure releasing the GPU lease. Frontend and Tauri debug desktop builds passed. No live diary UI/native GPU generation was performed for this feature; illustration quality and live layout await user check. No existing diary entries or images were changed by tests.

## Full-page diary — 2026-10-25

Diary is now its own full-page menu with Back to chat. Entries has a searchable thumbnail list and one selected entry, with text and picture in a wide reading area. Write contains daily journal/rewrite and manual draft controls. Settings contains writing schedule and illustration preference. Recently deleted has its own list and restore/permanent deletion controls. Images can still be enlarged (Escape or Close image). On narrow windows the list becomes a horizontal strip and text/picture stack. Search covers text, journal date and mood; selection falls back to the newest matching entry after deletion or filtering. Existing storage, backups, excerpts and generation lifecycle are unchanged.

The image request now describes a full-bleed standalone scene and explicitly excludes diary/notebook/page layouts, writing, captions and gibberish. The diary is supplied as bounded inspiration, not text to render. This affects future drawings only; use Draw another illustration to replace an older notebook-style picture. Model adherence is not guaranteed. No existing illustrations are altered automatically.

Component handler tests cover switching sections, search empty state, selection, settings toggle, draft save, restore, illustration action and enlarged viewer. Visual desktop layout and a fresh no-text GPU output still require a live check.
