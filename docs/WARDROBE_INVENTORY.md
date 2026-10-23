# Wardrobe inventory

Open the existing **Wardrobe** button. It now opens a full-page workspace, with **Back to chat** and an **Atelier** shortcut in its header.

- **Outfits, Hair, Skin, Accessories** show a grid of the loaded avatar's wearable items. Thumbnails are made locally from the actual item layers, cropped around visible pixels. Skin thumbnails show the body wearing its current outfit. The side panel previews the current combined look.
- Select a radio card to equip an outfit, hair or skin. Accessory checkboxes can be switched on and off independently. Equipped/default/locked badges identify each item; locked items retain their unlock explanations and cannot be equipped.
- **Find an item** searches the current category by name. **Show** filters all, available, equipped or locked items. Switching category resets search/filter.
- **Saved looks** stores the current outfit, hair, skin and accessories together, up to the existing30-look limit. Apply/Delete behavior and missing/locked-item fallback are retained. The current body view stays unchanged.
- **Daily looks** and **Seasons** retain their existing schedules, pools and saved-look assignments.

The inventory uses existing avatar assets and settings. It does not move/delete item files, change unlock rules or add new saved-data formats. Thumbnails are rendered for display rather than saved into backups. Failed previews show a placeholder; the item label and unlock state remain available. Missing-item errors from the avatar loader are still shown.

Atelier offers both a separate PNG/selection file export and Save to Wardrobe for adding a wearable inventory item. See the wearable upload section below.

Validation:299 foundation tests passed,2 optional skipped. New tests cover actual item-layer isolation, dressed neutral skin previews, unchanged source configuration, full-page rendering, equip/locked enforcement, accessory toggles, search, saved look creation and category navigation. Frontend and Tauri debug builds passed. Live layout/thumbnail appearance and daily/seasonal interactions remain user checks. No image generations or existing saved settings were modified during validation.

## Wearable uploads from Atelier

Atelier → Save → **Save to Wardrobe** now installs a fitted edited PNG into Mana's durable user-outfit library, then refreshes inventory discovery. Select the new item in Outfits to equip it. This also works for generated designs edited in Atelier. Existing items are never replaced by this action; each save creates a new version. Save outfit files remains a separate export choice.

The library lives in Mana's app-data wardrobe folder, and the save message gives its full location. Include that folder in backups/transfers: the normal settings backup contains outfit selections, not the wearable PNG files. The library is shared across avatar configurations; fitting still depends on the body used in Atelier. Removing an installed version is not yet an inventory action.
