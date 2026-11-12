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

Saved outfit labels can be changed with Rename equipped outfit. Display-name overrides are stored in validated avatar outfitNames settings (up to200 entries/80 characters per label) and leave item IDs and files unchanged.

Atelier now saves Hairstyle and Accessory items into their own inventory categories. Hair uses front/back PNG layers; accessories retain the selected depth. Equip explicitly after saving. Outfit display-name overrides now survive resolveLoadout, fixing the apparent rename reset.

## Rename any category

Outfits, Hair, Skin and Accessories now have **Rename** beneath each item card, including unequipped items. Saved looks have **Rename look**. Enter a name in the form above the collection and Save name; switching categories cancels the form. Custom item names appear on cards, in searches and in Current look, without changing asset IDs/files or equipment. Outfit names keep their existing outfitNames storage; the other categories use validated itemNames entries and survive loadout resolution/restart/backups.

Saved-look names must be unique (ignoring case) and at most60 characters. Renaming also updates matching snapshots assigned to Daily looks and Seasons, preserving the clothes/accessories and schedules. Unrelated snapshots are left unchanged. Item names allow80 characters.

## Occasional appearance comments

Ordinary chat can occasionally include one brief aside about equipped outfit, hairstyle or accessories. The application uses unlocked equipped item labels and renamed aliases, not image analysis, and tells the model not to invent visual details. Eligibility requires at least8completedreplies since the previous invitation and10minutes, with18percentchance pereligibleturn; the model may omit the optional remark. Initialstartupalso waits8replies. Focusedlessons,imagequestions,initiativehandling,unlockcelebrations and commonsensitive/busytopics skip it. Cooldown is session-only and commits after successful replies; no extra model call or separate unsolicited message.


## Mana-generated outfits and review queue

Wardrobe → For review now supports local outfit-only creation, remembered review/immediate save modes, durable pending PNGs, previews on Mana, approval, Atelier editing and dismissal. See docs/GENERATED_OUTFITS.md. Initial fit remains editable; periodic weekly creation is not enabled.

## Saved looks and Seasons visual inventory (2026-10-26)

Saved looks use combined thumbnail cards, with search and a Current look badge. Select a card to wear it; Rename and Delete are separate actions. Seasons use four preview cards and a searchable visual picker to assign saved looks. Calendar and generation-season preferences are under Seasonal settings. Remaining creation improvements are explicitly deferred in [DEFERRED_WARDROBE.md](DEFERRED_WARDROBE.md). No images were generated for this update. Desktop debug build passed; live UI has not been verified.

## Daily and seasonal categories

Daily looks has separate Morning and Night preview inventories and a visual Add saved look picker. Existing schedule and pool rules are unchanged. Seasons separates Spring, Summer, Autumn and Winter into category buttons, retaining one assigned look per season. Saved looks grid changes are retained.

## Mana-created simple accessories

In For review, choose Hair bow or Star hair clip, a color and left/right picture placement, then Let Mana create an accessory. Mana generates the image, removes connected light background and prepares an initial fit above her hair. It enters the durable review queue. Inspect the preview, use Edit in Atelier for edges/placement/depth if needed, then Save to Wardrobe. It never equips automatically. This initial version supports colored outlined accessories; complex shadows, white lace and arbitrary accessory types are not guaranteed. No automatic accessory schedule.

## Accessory design choices

For review → Let Mana create an accessory now offers Let Mana choose (default), Describe an accessory, and Quick choices. Let Mana choose uses her running chat model to invent a small connected hair accessory before image generation; start the chat model first. It does not select a preset. Describe accepts up to700 characters. Both retain the same initial temple placement, light-background cleanup and editable review. Complex designs can still need Atelier adjustments. Invalid idea output stops before image generation.

## Generated bangs and back hair

Wardrobe → For review → Let Mana create a hairstyle → Create bangs and back hair. Uses her original hair for style, generates two pieces, cleans the plain background, sizes each uniformly and aligns crowns. Both enter review as separate editable layers. Edit in Atelier to move or resize Bangs and Back hair individually, save edits to review, then approve. Current hair stays unchanged until you equip the saved item. This first version uses soft silver waves, not a free hairstyle designer. New shapes/colors can still need cleanup and fitting; no automatic hairstyle schedule.

October 31: For review creation, recovery and pending-review sections are now independent collapsed panels. Headers retain pending counts, schedule frequency and running status. Collapsing keeps mounted controls, drafts and jobs alive; it does not cancel work or reset form values.
