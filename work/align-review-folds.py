from pathlib import Path
p=Path('src/styles.css');s=p.read_text(encoding='utf-8-sig').replace('.generated-outfits{max-width:1200px;margin:1.5rem auto}', '.generated-outfits{max-width:none;margin:12px 0}');p.write_text(s,encoding='utf-8')
p=Path('docs/DEFERRED_WARDROBE.md');s=p.read_text(encoding='utf-8-sig');s='''## Current status — October 31 (supersedes historical notes below)
The accepted outfit flow is clothing-only generation → fitting/sizing → checks → review/save. Automatic collar/fabric cleanup is OFF; the user handles occlusion by selecting parts and placing them behind the body in Atelier. Do not restart automatic cleanup experiments or alter saved outfits.

Outfit, hairstyle and accessory schedules, independent review/editable layers, inspect/compare, notes, filtering, duplication and batch actions are implemented. Hair/accessory restore-initial-fit is available. This supersedes older scheduling/hairstyle deferrals below. Live scheduled runs and wider visual checks remain user validation; art-style consistency and unusual sleeve/hair fitting are still limitations. Complex accessories beyond small hair accessories remain deferred.

'''+s;p.write_text(s,encoding='utf-8')
p=Path('docs/DEVLOG.md');p.write_text(p.read_text(encoding='utf-8-sig')+'\nOctober 31: aligned all collapsible review panels by removing the outfit-only centered/max-width wrapper styling. Refreshed the deferred-work document to distinguish the accepted manual cleanup flow from obsolete historical plans.\n',encoding='utf-8')
