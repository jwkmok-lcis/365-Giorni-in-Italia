# Phaser Migration Reference

This document is the rebuild reference for the Phaser migration.

## Source Of Truth

- Storyline master draft: `storyline-script.txt`
- Dialogue content: `src/content/dialogues.js`
- Quest and clue progression: `src/content/quests.js`
- Quest follow-up hints: `src/content/questHints.js`
- Overworld layout data: `src/content/map.js`
- Idle NPC lines: `src/content/idleDialogues.js`
- Shop inventory and greetings: `src/content/shops.js`

These files should stay data-first and should not be rewritten to fit a scene implementation.

## Core Gameplay Principles

1. Story comes first.
The player advances by talking to the correct NPCs in the correct order. Practice and support interactions can enrich the experience, but they must not replace the story loop.

2. The map is a navigable story space, not a menu.
Buildings represent places in Bologna. The player moves through the piazza, enters interiors, and meets NPCs in context.

3. Quest progression is objective-driven.
The active quest defines which NPC interaction matters next. Non-objective NPCs should still feel alive through idle dialogue or support interactions.

4. Dialogue choices are the learning engine.
Grammar progression, XP gain, and trust all happen primarily through dialogue choices.

5. Shops are support systems.
Food and drink restore energy and provide soft language practice, but they are not the main progression path.

6. The migration must not mix runtimes.
Phaser owns scene flow, input, camera, and rendering after cutover. The old custom engine remains only as historical reference.

## Scene Responsibilities After Migration

### `IntroScene`

- Entry point into the game
- Explains the current day and starts exploration
- Unlocks exploration for the current session if required

### `MapScene`

- Main Bologna overworld
- Player movement, camera follow, collision against buildings
- Piazza NPC interaction
- Transition into interiors
- Quest summary and clue visibility

### `LocationScene`

- Interior location for non-piazza places
- Player movement inside the room
- NPC interaction and shop interaction
- Exit back to the map

### `DialogueScene`

- Dialogue presentation only
- Uses dialogue and quest services, does not own story data
- Applies choice effects and returns to the calling scene

## Story Location Mapping

- `piazza_maggiore`: Marco Verdini, Donna Rosa
- `mercato_di_mezzo`: Lucia Ferrante
- `osteria_del_sole`: Giorgio Neri, Elena Bianchi
- `biblioteca_salaborsa`: Elena Bianchi
- `via_zamboni`: Prof. Conti
- `panetteria_rossi`: Panettiere Paolo
- `caffe_bologna`: Barista Giulia

## Migration Invariants

- Keep `quests.js`, `dialogues.js`, and `map.js` unchanged unless the content itself is being revised.
- Keep NPC ids stable.
- Keep location ids stable.
- Keep clue ids stable.
- Keep quest completion driven by NPC talks.
- Keep save data centered on day, player, and quest state.

## Regression Review Checklist

If story progression breaks, verify these in order:

1. The active quest id still points to the next incomplete quest.
2. The current quest objective npc id matches the scene interaction target.
3. The dialogue session starts from the correct day-aware node.
4. A dialogue choice still calls quest progression after selection.
5. Save/load restores `day`, `player`, and `quest` consistently.

## Intentional Migration Boundaries

- Old engine files are retained for reference only.
- Phaser is the only live scene runtime after cutover.
- Story data remains in content modules, not embedded in scenes.
