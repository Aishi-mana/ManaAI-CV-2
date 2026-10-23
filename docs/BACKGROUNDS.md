# Avatar backgrounds

Open Backgrounds beside the avatar view and Wardrobe controls. Pick Original (lavender), Cozy room, Garden, Sunset or Starlight; changes apply and save immediately. The scene stays fixed while the avatar zooms and animates. Full/half/bust and wardrobe changes retain it. Named saved looks continue to store clothing/accessories and retain the current background on apply.

Your own picture accepts local PNG/JPEG/WebP files up to10MB and25 megapixels. Mana saves a resized copy (max1600px side, bounded JPEG data); the original is untouched. Images fill the avatar area and may be cropped. The saved copy remains when the source file moves and is included in backup/restore. Remove saved picture deletes that copy and returns to Original if it was selected. Only one custom picture is kept.

No network, generated art, new model or automatic scene changes. Current backgrounds are static. Invalid/absent selections fall back to Original; old backups preserve their familiar default. Selection uses the existing mana.avatar.v1 key, with no database/backup key changes.

Validation:249 tests passed,2 optional skipped; frontend/native builds checked. Live acceptance: choose a scene, zoom/change outfit, close/reopen Mana, and optionally import/remove a local picture. User confirmed the background feature passed on 2026-10-19.
