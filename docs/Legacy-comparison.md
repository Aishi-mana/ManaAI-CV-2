# Legacy Python Mana and current Mana

Compared on 2026-10-09 against the legacy `MANA_PROJECT_MANIFEST.md`,
`LIVING_MANA_VISION.md` and `ROADMAP.md` in `C:/AI/ManaAI/docs`, and the current
README and ManaAI roadmap. Legacy files were read without modification.

This is a documentation comparison, not a runtime audit of the Python app.
Legacy completion labels describe what those documents claim. Their v3.3/v3.7
labels do not map to this project's V1/V2/V3 milestones.

## Main finding

The scoped current V1 foundation remains implemented. It does not imply parity
with every legacy feature. The most valuable missing thread is the legacy loop:
experience → memory → reflection → meaning → identity → behavior.

Current Mana has persistence, reviewed memory suggestions, grounded reflections,
diaries, goals and manual simulated thoughts. It does not yet derive persistent
beliefs, life themes, lessons, values or identity changes from recorded experiences.

## Feature comparison

| Legacy feature or plan | Current coverage | Remaining distinction |
| --- | --- | --- |
| Contextual chat; Gemini and local providers | Local streaming llama-server chat, identity, state and retrieved notes | Cloud providers are outside the current local-first implementation |
| Memory V2: importance, recall, tags, links, emotion and belief references | Importance, pinning, timestamps, strength/decay, recall reinforcement, keyword retrieval and reviewed suggestions | Tags, linked episodes, emotional associations, belief references and semantic retrieval remain future work |
| Bond, trust, comfort, admiration and affinity | Persistent fictional bond/affection and shared context | Separate relationship dimensions and a relationship timeline are not implemented |
| Mood history and emotional continuity | Persistent mood/intensity and needs, elapsed-time updates, expression integration | Experience-linked emotional history and richer emotional interpretation remain gaps |
| Reflections and daily journals | Reviewed reflection drafts, daily diary scheduling/catch-up, source records, deletion recovery and exports | Growth milestones and long-term journal synthesis remain future work |
| Background internal thoughts | Optional manual simulated character reflections with recorded sources and review before saving | No automatic thought scheduler or activity while the app is closed |
| Emerging preferences, beliefs, traits, values and narrative identity | Editable identity/voice traits, interest enthusiasm and reviewed goals | These controls are not an experience-derived identity evolution system |
| Autonomous questions and follow-ups | Opt-in initiative, persisted waiting state, quiet hours, cooldown and reviewed follow-ups | Self-directed projects and broader daily routines remain future work |
| Home, furniture, remembered objects and room progression | Avatar, expressions, layered wardrobe, unlock foundation and saved looks | Persistent room, navigation, furniture preferences and home stories belong to V2 |
| Reading, studying, coding, music and relaxation routines | Simulated idle/rest/sleep; saved word-chain, shared-story and creative-challenge sessions | Activities do not establish autonomous reading, coding, music playback or project execution |
| Knowledge/gaming/coding/creativity XP and achievements | Progress/unlock foundation and diary milestone | General skill progression is still planned |
| Expressive desktop presence and voice | Modular avatar, blinking, expressions and basic lip sync | Walking desktop presence, activity animations, TTS and singing remain planned |
| Runtime coordinator, services, event bus and repositories | Rust/TypeScript desktop structure and persistent storage | Legacy architecture plans are design references, not a reason to transplant Python modules or add an event bus prematurely |
| Manaverse residents, locations and social events | Explicit V3 roadmap | Persistent world simulation, AI-to-AI relationships and cross-device continuity remain future ambitions |

## Current preservation and review features

Current Mana also documents searchable read-only chat archives, categorized text
exports for conversations/diary/activities/work/playtests, versioned reviewed work,
version-specific deterministic battle reports, and validated backup/restore with
a safety backup and count preview. These details are not established by the three
legacy documents; that does not prove the Python app lacked them.

Draft code/design exports are not runnable game exports. Simulated thoughts are
character text, not hidden model reasoning. Elapsed-time state updates are not
evidence that Mana performed activities while closed.

## Recommended sequence

1. Record meaningful completed events with time, source and outcome. Keep generated
   interpretations distinct from user-confirmed facts and actual activity results.
2. Add reviewed episodic memories and special moments, with tags and source links.
   Use those records for a visible relationship/growth timeline.
3. Draft reviewable life themes, lessons and belief interpretations from those
   records. Preserve evidence, uncertainty and revision history; do not silently
   rewrite identity or assume another person's feelings.
4. Let approved narrative summaries inform future replies, then evaluate consistency
   across sessions before considering broader automatic growth.
5. Connect V2 room objects and activities to this history, so the home represents
   recorded experiences instead of decorative counters alone.

Optional automatic reflections can be considered later with explicit enablement,
quiet hours, bounded generation and accurate app-open behavior. Cross-device sync,
cloud providers and offline world simulation need separate designs.

## Scope and identity decisions

The legacy manifest describes Mana as daughter-like but also lists a relationship
stage called “Life Partner.” That ambiguity should be resolved deliberately through
the configured identity; do not automatically import that progression.

No legacy JSON data, profiles, memories or settings were imported in this review.
Any future migration should preview field mappings, preserve originals and let the
user select what to bring over. The old documents are inspiration and historical
evidence, not instructions to execute their embedded implementation directives.
