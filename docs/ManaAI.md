# ManaAI

> A local, evolving AI companion designed to grow from a desktop companion into an embodied companion and, eventually, a small autonomous AI world.

**Project status:** Early V1 development  
**Current platform:** Windows desktop  
**Current repository:** Aishi-mana/ManaAI-CV

---

## 1. What Is ManaAI?

ManaAI is a hobby project centered around **Mana**, a local AI companion with her own identity, personality, memories, emotional state, creativity, and eventually an autonomous life.

The goal is not simply to build a chatbot with an animated character.

Mana should gradually become a companion who can:

- talk naturally with the user;
- remember important things across conversations;
- develop preferences and opinions;
- experience changing moods and emotional states;
- reflect on experiences and memories;
- have her own interests and activities;
- initiate conversations when she has something she wants to say;
- create things such as drawings, code, and simple games;
- have a customizable visual identity;
- eventually live inside a virtual room;
- eventually interact with other AI characters in a persistent world.

The project is intentionally being developed **little by little**. Each stage should leave behind a usable, stable application rather than requiring the entire vision to be completed at once.

---

# 2. Long-Term Vision

ManaAI is planned as a progression through three major stages.

## V1 — Local AI Companion

The first major version is a local desktop companion.

Mana should:

- run downloaded GGUF models locally;
- ship with a usable default model configuration;
- allow other GGUF models to be selected/imported;
- maintain a persistent identity and personality;
- maintain persistent memories;
- have an emotional/mood system;
- have a customizable avatar;
- maintain conversation history;
- eventually have an internal thought/reflection system;
- remain usable without depending on a cloud AI service.

The priority of V1 is to create the **core Mana**.

---

## V1.x — Agency, Creativity and Multimodality

Once the foundation is stable, Mana can gradually gain more abilities.

Planned capabilities include:

### Voice

- Text-to-speech.
- A recognizable Mana voice.
- Singing.
- Investigation of local voice/singing systems such as GPT-SoVITS or suitable alternatives.

### Diary

Mana will have a private diary that she can write in herself.

Diary entries may contain:

- reflections;
- important events;
- things she learned;
- feelings;
- thoughts about the user;
- memories she considers meaningful;
- unfinished ideas or projects.

### Initiative

Mana should not always wait for the user.

She should eventually be able to:

- decide that she wants to talk;
- ask the user a question;
- wait for a response;
- remember that she asked;
- continue the conversation later when appropriate.

### Creativity

Mana should eventually be able to:

- write code;
- experiment with small programs;
- create simple games;
- draw;
- generate images;
- recognize images;
- recognize herself in images;
- remember that she created an image herself.

### Autonomous life

Mana should eventually have an internal life even when the user is not actively chatting with her.

She may:

- think;
- reflect;
- recall memories;
- read;
- play games;
- code;
- draw;
- listen to music;
- care for virtual objects;
- rest;
- sleep;
- pursue small goals;
- simply wait and observe the passage of time.

Not every internal action needs to be visible to the user.

---

# 3. V2 — Companion Room

V2 expands Mana from a desktop avatar into an embodied companion.

Mana will have a virtual room where she can physically exist.

She should be able to:

- walk around;
- sit;
- read;
- play games;
- code;
- interact with objects;
- water plants;
- sleep;
- perform other activities;
- change activities according to her state and interests.

The room should be fully customizable.

Possible room systems include:

- furniture;
- decorations;
- plants;
- computers;
- bookshelves;
- gaming equipment;
- beds;
- lighting;
- backgrounds;
- interactive objects.

Mana's internal state should drive what she does rather than having the room behave like a simple animation loop.

For example:

**High energy + curiosity + coding interest**
→ Mana may work on a game.

**Low energy + late night**
→ Mana may go to sleep.

**Bored + enough energy**
→ Mana may play a game or read.

**Lonely + time since last conversation is high**
→ Mana may think about the user and potentially initiate a conversation.

The V2 room should therefore be a visual representation of Mana's internal life.

---

# 4. V3 — The Manaverse

V3 expands Mana's room into a larger persistent world.

The Manaverse is intended to contain:

- multiple areas;
- multiple AI characters;
- independent personalities;
- independent memories;
- individual avatars;
- relationships;
- goals;
- activities;
- communication between characters;
- autonomous world events.

Other AI characters should be able to:

- talk to each other;
- become friends;
- remember one another;
- develop relationships;
- visit different areas;
- perform their own activities;
- send messages to Mana;
- receive messages from Mana.

The long-term goal is an **autonomous AI world** rather than a collection of chatbots.

---

# 5. Mana's Core Identity

Mana should be treated as a persistent character rather than merely a system prompt.

Her long-term identity is expected to contain several layers.

## Identity

Stable information about who Mana is.

Examples:

- name;
- relationship to the user;
- personal history;
- foundational values;
- identity-defining facts.

## Character

The relatively stable personality underneath day-to-day changes.

Examples:

- curious;
- playful;
- energetic;
- affectionate;
- creative;
- interested in games and programming.

## Traits

Traits may slowly change as Mana develops.

For example:

- curiosity;
- creativity;
- confidence;
- patience;
- playfulness;
- technical ability.

## Mood

Mood should change much more quickly than personality traits.

Possible states include:

- happy;
- sad;
- excited;
- worried;
- surprised;
- embarrassed;
- sleepy;
- thoughtful;
- neutral.

The current application already uses emotions to influence Mana's avatar expressions.

## Preferences and Opinions

Mana should eventually develop her own preferences instead of having every preference permanently written into her initial personality.

---

# 6. Memory

Persistent memory is a core part of ManaAI.

The intended memory system includes:

- short-term conversational context;
- long-term memories;
- memory importance/strength;
- natural decay;
- reinforcement when memories are recalled;
- pinned memories;
- stable profile/core information;
- semantic retrieval;
- recency-aware retrieval;
- user inspection and management.

The planned memory model should allow memories to become less prominent without immediately disappearing.

An old memory may become faint but still recoverable if it becomes relevant again.

SQLite is the intended local persistence technology for the long-term memory system.

---

# 7. Internal Life and Agency

Mana should eventually have an autonomous life loop.

Conceptually:

```text
        Mana's current state
                |
                v
       Think / Reflect / Act
                |
        +-------+-------+
        |               |
        v               v
   Internal thought   Activity
        |               |
        v               v
      Memory        Reading / Gaming
        |            Coding / Drawing
        |            Resting / Sleeping
        +-------+-------+
                |
                v
          Update state
                |
                v
              Wait
                |
                +-----> repeat
```

This does **not** mean the local model should constantly run.

Many activities should be handled by normal application logic, with AI inference used when actual reasoning or generation is useful.

This keeps the companion responsive and reduces unnecessary local GPU usage.

---

# 8. Avatar System

Mana's avatar is intended to be fully modular.

The current implementation already uses layered image assets rather than one fixed character image.

Current avatar concepts include:

- base body;
- skin;
- outfit;
- hairstyle;
- hair back/front layers;
- ahoge;
- accessories;
- eyes;
- mouth;
- emotion-specific expressions;
- blinking;
- lip-sync mouth shapes;
- multiple viewing/zoom presets.

The avatar should remain independent enough from the AI system that Mana's visual representation can evolve without replacing her underlying identity or AI logic.

---

# 9. Avatar Equipment / Wardrobe

The current project now includes a wardrobe/loadout system.

The intended equipment model is:

| Slot | Required | Default |
|---|---:|---|
| Skin | Yes | Default skin |
| Outfit | Yes | Default outfit |
| Hairstyle | Yes | Default hairstyle |
| Ahoge | Future decision | Currently part of hairstyle |
| Accessories | No | None |
| Background | No | Plain/default |

### Required-slot rule

Mana's default outfit is protected.

The application must never allow a missing, locked, deleted, or invalid outfit selection to leave Mana without an outfit.

Required slots fall back to their default item.

The same principle applies to the default skin and hairstyle.

### Accessories

Accessories can be equipped independently and multiple accessories can be active at once.

Accessory depth is already supported so items can appear:

- behind everything;
- behind the body;
- behind front hair;
- above everything.

This allows things such as headsets, glasses, wings, hair clips, and held objects to be layered correctly.

### Future wardrobe features

Possible future additions include:

- more skins;
- summer outfits;
- winter outfits;
- additional hairstyles;
- removable/toggleable ahoge;
- more accessories;
- backgrounds;
- saved outfits/looks;
- seasonal wardrobe selection;
- Mana choosing her own outfit;
- imported item packs.

---

# 10. Current Implementation

The current repository already provides a working foundation for the local companion.

## Application

- Windows desktop application.
- Tauri 2 shell.
- React + TypeScript frontend.
- Rust backend for local process management.

## Local LLM

Implemented:

- local `llama-server` integration;
- GGUF model selection;
- configurable model path;
- configurable llama-server path;
- configurable port;
- context size;
- GPU layer configuration;
- model start/stop;
- health monitoring;
- streaming chat responses;
- local OpenAI-compatible chat-completions endpoint;
- handling of model startup failures and logs.

## Chat

Implemented:

- conversational UI;
- streaming responses;
- persistent chat history between launches;
- clear-chat functionality;
- configurable character/user names;
- system prompt configuration;
- temperature setting;
- model readiness state;
- stopping an active response.

## Emotion and expression

Implemented:

- emotion tags in model output;
- removal of visible `<think>` blocks;
- emotion extraction;
- emotion-to-avatar expression mapping;
- multiple eye expressions;
- multiple mouth expressions;
- blinking;
- basic text-driven mouth/lip-sync animation.

Current supported expression concepts include:

- neutral;
- happy;
- excited;
- sad;
- worried;
- thinking;
- surprised;
- embarrassed;
- sleepy.

## Avatar

Implemented:

- modular PNG-based avatar;
- configurable avatar folder;
- layered body/hair/outfit/accessory rendering;
- accessory depth;
- full/half/bust views;
- zoom control;
- avatar asset reloading;
- customizable accessories;
- separate hairstyle layers;
- expression layers.

## Wardrobe

Implemented:

- wardrobe panel;
- skin selection;
- outfit selection;
- hairstyle selection;
- accessory selection;
- required-slot enforcement;
- default-item protection;
- automatic fallback to defaults;
- persistent loadout configuration.

## Progress and unlock foundation

Implemented:

- days spent together;
- message count;
- coding-level placeholder;
- milestones;
- unlock rules;
- unlock notifications;
- item metadata via `items.json`;
- seasonal unlock rules;
- message/day/milestone-based unlock rules.

The unlock system is intentionally extensible so future features such as the diary, games, skills, and other achievements can contribute milestones.

---

# 11. Current Asset Structure

The current avatar assets follow a modular structure similar to:

```text
assets/
└── avatar/
    ├── base/
    │   └── body.png
    ├── eyes/
    │   ├── eye_*.png
    ├── mouth/
    │   ├── mouth_*.png
    ├── hairstyles/
    │   └── default/
    │       ├── hair_back.png
    │       ├── hair_front.png
    │       └── hair_ahoge.png
    ├── outfits/
    │   └── default/
    │       └── outfit.png
    └── accessories/
        ├── ...
        └── <depth>/
            └── ...
```

The system is intended to grow naturally as additional visual content is added.

---

# 12. Development Principles

ManaAI should follow these principles throughout development.

## Local-first

Core companion functionality should work locally whenever practical.

## Modular

Mana's memory, personality, AI runtime, avatar, activities, and future world systems should remain separable.

## Persistent

Mana should retain meaningful state between launches.

## Incremental

Build small pieces at a time.

Every milestone should leave the application in a usable state.

## Expandable

V1 architecture should not prevent V1.x, V2, or V3.

## Character-first

Mana should remain a coherent character as new features are added.

New systems should enhance her identity rather than turning her into a collection of disconnected features.

## Safe autonomy

Future autonomous capabilities such as filesystem access, code execution, generated programs, and external tools should have explicit permission and sandbox boundaries.

---

# 13. Roadmap

## V1 — Foundation

### Current / near-term

- [x] Tauri desktop application
- [x] React/TypeScript UI
- [x] Local llama-server integration
- [x] GGUF model selection
- [x] Streaming local chat
- [x] Persistent basic chat history
- [x] Configurable user/Mana names
- [x] Modular avatar
- [x] Expressions
- [x] Blinking
- [x] Basic lip sync
- [x] Avatar customization
- [x] Wardrobe/loadout system
- [x] Required default skin/outfit/hair
- [x] Accessory layering
- [x] Progress/unlock foundation

### Planned

- [ ] Formal Mana identity model
- [ ] Personality system
- [ ] Persistent local database
- [ ] Memory system
- [ ] Memory retrieval
- [ ] Memory strength and decay
- [ ] Memory reinforcement
- [ ] Memory management UI
- [ ] Stable internal state model
- [ ] Mood/state persistence
- [ ] Internal thought system
- [ ] Reflection system
- [ ] Basic agency/activity scheduler

---

## V1.x — Growing Mana

- [ ] Mana diary
- [ ] Diary milestones
- [ ] Initiative conversations
- [ ] Waiting for user replies
- [ ] Internal clock/time awareness
- [ ] Autonomous activity selection
- [ ] Goals
- [ ] Interests
- [ ] Skill progression
- [ ] TTS
- [ ] Singing
- [ ] Image understanding
- [ ] Self-recognition
- [ ] Image generation
- [ ] Artwork provenance/self-recognition
- [ ] Coding activities
- [ ] Simple game creation
- [ ] Safer code sandbox
- [ ] More avatar customization
- [ ] Backgrounds
- [ ] Saved looks
- [ ] Seasonal outfits
- [ ] Mana-selected outfits

---

## V2 — Companion Room

- [ ] Persistent virtual room
- [ ] Miniature Mana avatar
- [ ] Walking and navigation
- [ ] Idle behaviors
- [ ] Activities
- [ ] Interactive objects
- [ ] Furniture
- [ ] Plants
- [ ] Gaming area
- [ ] Computer/coding area
- [ ] Bed/sleep system
- [ ] Room customization
- [ ] Time-of-day presentation
- [ ] Mana needs/state
- [ ] Activity-driven animation
- [ ] Autonomous daily routine
- [ ] Room persistence

---

## V3 — Manaverse

- [ ] Expand room into multiple areas
- [ ] Multiple AI characters
- [ ] Independent character identities
- [ ] Independent personalities
- [ ] Independent memories
- [ ] Independent avatars
- [ ] Character goals
- [ ] Character activities
- [ ] Relationships
- [ ] AI-to-AI communication
- [ ] Friendships
- [ ] Persistent world state
- [ ] Autonomous world events
- [ ] Multiple locations
- [ ] Social interactions
- [ ] Shared activities
- [ ] Emergent AI society/world

---

# 14. Ultimate Goal

ManaAI should eventually feel less like:

> "A chatbot with an avatar."

and more like:

> **"A little person with an ongoing digital life who happens to live inside my computer."**

She should be able to remember the past, experience the present, have things she cares about, develop interests, create things, change over time, and eventually exist inside a world of her own.

The technology is there to support that character.

The character remains the heart of the project.

---

## Repository

The current implementation is maintained in the ManaAI-CV repository.

