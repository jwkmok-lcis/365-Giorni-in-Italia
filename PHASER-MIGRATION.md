# Phaser Migration Contract

This repository is migrating to a Phaser-only runtime.

The non-negotiable rules for the cutover are:

- The live bootstrap must use Phaser scenes, not the custom `SceneManager` runtime.
- Content remains data-driven through the existing source-of-truth modules:
  - `src/content/map.js`
  - `src/content/dialogues.js`
  - `src/content/quests.js`
  - `src/content/lessons.js`
- Story, quest order, NPC identities, and the Bologna chapter structure must stay intact.
- Movement remains available on the map once the player is in exploration mode. Interaction is gated by quest/day state, not hard map locks.
- Save/load continues to persist the same day, player, and quest state.

## Gameplay Principles

- The player starts in Bologna and investigates the Ferrante ragù mystery across 30 in-game days.
- Each day has a lesson phase and an exploration phase.
- The exploration loop is: move through the overworld, approach NPCs or interiors, talk, unlock clues, and advance the active quest.
- Dialogue choices are the learning mechanic. Grammar-tagged choices award XP through the existing skill systems.
- The map should feel like Bologna, with clear destinations and readable quest routing, but story interactions must stay primary.

## Phaser Runtime Shape

- `BootScene`: shared setup, registry wiring, and first scene routing.
- `IntroScene`: title flow, onboarding pages, continue/settings.
- `LessonScene`: daily lesson intro, quiz, and result flow.
- `OverworldScene`: Bologna overworld, camera, collision, map navigation, quest markers, and NPC triggers.
- `DialogueScene`: full-screen conversation scene driven by `DialogueSystem` and `dialogues.js`.
- `LocationScene`: simplified interior scene per location, with NPCs, exits, and shop/dialogue triggers.

## Data Contract

- `map.js` remains the source for location positions, NPC assignments, and labels.
- `dialogues.js` remains the source for node graphs, day entry points, and choice metadata.
- `quests.js` remains the source for quest order, objective completion, and clue rewards.
- `lessons.js` remains the source for daily teaching and quiz content.

## Cutover Checklist

- Build Phaser runtime context with save/load, voice unlock, quests, dialogue, lessons, and skill systems.
- Port the intro, lesson, overworld, dialogue, and interior flows to Phaser scenes.
- Rewire `src/main.js` to create a Phaser game directly.
- Update the service worker asset manifest to cache the Phaser runtime files.
- Validate browser startup and scene flow with no dependency on the custom engine runtime.