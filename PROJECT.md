# 365 Giorni in Italia

## Game Concept
A small RPG language-learning game set in Bologna. The player advances through daily Italian lessons and city exploration to reconstruct a legendary ragù recipe over about 30 in-game days.

## Core Gameplay Loop
1. Complete daily lesson (vocab + phrase + occasional grammar).
2. Explore the map.
3. Talk to NPCs (multiple-choice dialogue).
4. Complete quests.
5. Unlock recipe clues.
6. End day and progress.

## Systems Overview
- Game Engine: Canvas initialization, timing, update/render loop, scene orchestration.
- Scene Management: Menu, Map, Dialogue, Lesson scenes and transitions.
- Input: Keyboard state and routing to active scene.
- Event Bus: Lightweight pub/sub for loose coupling.
- Player System: Position, progression stats, daily flags, NPC relationship values.
- Day System: Day progression (1-30), day-start/day-end transitions, content gating.
- Quest System: Objective tracking, progression, rewards.
- Clue Tracking: Recipe clue fragments tied to quests/dialogue outcomes.
- Dialogue System: Branching dialogue and effects.
- Lesson System: Daily lesson content and answer validation.
- Save/Load System: LocalStorage persistence with schema versioning.

## Development Roadmap
- Step 1: Clean baseline reset and runtime target.
- Step 2: Core engine loop foundation.
- Step 3: Input and scene manager.
- Step 4: Map and player movement vertical base.
- Step 5: Day system and daily loop gates.
- Step 6: Lesson system.
- Step 7: Dialogue system.
- Step 8: Quest plus clue progression.
- Step 9: Event bus integration pass.
- Step 10: Save/load with LocalStorage.
- Step 11: Vertical slice completion target.
- Step 12: Hardening and polish.

## Architecture: File Map

```
src/
	main.js                     <- Bootstrap: creates Game, wires all systems into context
	engine/
		Game.js                   <- Canvas init, update/render loop, scene orchestration
		SceneManager.js           <- Active scene registry; scenes.go(id, game) transitions
		Scene.js                  <- Base class: enter(), update(), handleInput(), render()
		EventBus.js               <- Pub/sub (bus.emit / bus.on); Events enum lives here
		Clock.js                  <- Delta-time, frame counter
		Input.js                  <- Keyboard state; routes events to active scene
	scenes/
		MapScene.js               <- Player movement, location highlighting, NPC entry points
		DialogueScene.js          <- Branching dialogue renderer + choice navigation
		LessonScene.js            <- Vocab/phrase/grammar display + quiz UI
	systems/
		DaySystem.js              <- Day 1-30 calendar; lessonDone / explorationOn gates
		DialogueSystem.js         <- Loads dialogue scripts; applies choice effects
		QuestSystem.js            <- Tracks active quest; fires QUEST_COMPLETED + CLUE_UNLOCKED
		LessonSystem.js           <- Validates quiz answers; fires LESSON_COMPLETED
		PlayerSystem.js           <- languageXP, coins, day, NPC relation deltas
		EventFeedSystem.js        <- HUD event log (recent bus events shown as text)
		SaveSystem.js             <- LocalStorage save/load with schema versioning
	ui/
		Hud.js                    <- Top bar: Giorno N / location / XP (read-only render)
		ObjectivePanel.js         <- Shows active quest description + objective progress bar
		ClueNotebook.js           <- Displays up to 4 unlocked clues; shows "+N more" if truncated
	content/
		lessons.js                <- LESSONS[dayNumber]  vocab, phrase, grammar, quiz
		dialogues.js              <- DIALOGUES[npcId]    branching node trees per NPC
		quests.js                 <- QUESTS[questId]     objectives + rewards; CLUES[clueId]
		map.js                    <- MAP_CONFIG + LOCATIONS[] (tile positions, NPC slots)
	utils/
		math.js                   <- Shared math helpers
```

### Key data-flow rules
- **Content never imports systems.** Only systems import content files.
- **Systems communicate via EventBus**, never calling each other directly.
- **Scenes call systems** through `game.context` (injected on `enter()`).
- **QuestSystem.recordNpcTalk(npcId, context)** is called by `DialogueSystem.choose()` on every choice — primary quest progression trigger.
- **DaySystem.completeLesson(bus)** unlocks the map for exploration each day.

---

## Systems Reference

| System | Owns | Key events emitted |
|--------|------|--------------------|
| DaySystem | `currentDay`, `lessonDone`, `explorationOn` | `DAY_STARTED`, `DAY_ENDED`, `LESSON_COMPLETED` |
| QuestSystem | Active quest objectives, unlocked clue IDs | `QUEST_OBJECTIVE_PROGRESS`, `QUEST_COMPLETED`, `CLUE_UNLOCKED` |
| DialogueSystem | Active dialogue session, branch navigation | `DIALOGUE_CHOICE_SELECTED` |
| LessonSystem | Quiz state, answer validation | `LESSON_COMPLETED` |
| PlayerSystem | `languageXP`, `coins`, `day`, relations map | — |
| SaveSystem | LocalStorage serialisation | — |

---

## Content Schema Reference

### `LESSONS[day]`
```js
{
	day: Number,
	title: String,
	vocab: [{ it, en }],
	phrase: { it, en },
	grammar: { topic, note },   // optional
	quiz: [{ prompt, choices[], answerIndex }]
}
```

### `DIALOGUES[npcId]`
```js
{
	npcName: String,
	start: "nodeId",
	nodes: {
		nodeId: {
			speaker: String,
			text: String,           // Italian (inline comments show English translation)
			choices: [{
				text: String,         // Italian player response
				next: "nodeId",       // OR end: true
				effects: {
					relationDelta: Number,
					clueHint: String    // English hint shown in gold at bottom of screen
				}
			}]
		}
	}
}
```

### `QUESTS[questId]`
```js
{
	id: String,
	title: String,
	description: String,        // shown to player as the active objective
	dayMin: Number, dayMax: Number,
	objectives: [{ type: "talkToNpc", npcId: String, completed: Boolean }],
	rewards: { clueId: String, xp: Number }
}
```

### `CLUES[clueId]`
```js
{ id, title, text, source }   // text is Italian; shown in clue notebook
```

---

## NPC Roster

| NPC ID | Name | Location | Days active | Role |
|--------|------|----------|-------------|------|
| `marco_verdini` | Marco Verdini | Piazza Maggiore | 1+ | Opening hook; bread-ragu connection |
| `lucia_ferrante` | Lucia Ferrante | Mercato di Mezzo | 1+ | Soffritto base; trustworthy informant |
| `donna_rosa` | Donna Rosa | Piazza Maggiore | 2+ | 3-hour claim; suspicious of Giorgio |
| `giorgio_neri` | Giorgio Neri | Osteria del Sole | 2+ | 6-hour counter-claim; has seen the document |
| `prof_conti` | Prof. Conti | Via Zamboni | 3+ | Confirms archive document; names Giorgio |
| `elena_bianchi` | Elena Bianchi | Osteria del Sole | 3+ | Gate to the locked library archive |

---

## Locations

| ID | Label | Tile (tx,ty) | NPCs |
|----|-------|-------------|------|
| `piazza_maggiore` | Piazza Maggiore | 9,6 | marco_verdini, donna_rosa |
| `mercato_di_mezzo` | Mercato di Mezzo | 1,2 | lucia_ferrante |
| `osteria_del_sole` | Osteria del Sole | 18,3 | giorgio_neri, elena_bianchi |
| `biblioteca_salaborsa` | Biblioteca Salaborsa | 10,12 | *(locked — no NPC slots yet)* |
| `via_zamboni` | Via Zamboni | 1,11 | prof_conti |

---

## Day 1-3 Content Design

### Overarching player goal
> Reconstruct the legendary ragu recipe of Bologna.

### Ragu Clue Progression

| # | Clue ID | Title | Unlocked by | Story function |
|---|---------|-------|-------------|----------------|
| — | *(clueHint)* | bread hint | Marco dialogue | Hook: draws player toward the market |
| 1 | `clue_soffritto_base` | La Base del Ragu | Quest Day 1 complete | Ground truth of the recipe |
| 2 | `clue_tempo_contraddittorio` | Una Contraddizione | Quest Day 2 complete | Mystery: who is lying? |
| 3 | `clue_archivio_chiuso` | L'Archivio Segreto | Quest Day 3 complete | Curiosity: the answer is locked away |

### Day 1 — Sussurri del Mercato
- **Lesson:** greetings + market vocab + polite requests (vorrei)
- **Quest:** Talk to Marco (Piazza Maggiore) then Lucia (Mercato di Mezzo)
- **Twist:** Marco says the answer starts with the bread; points to Lucia
- **Clue earned:** soffritto base — cipolla, carota, sedano confirmed

### Day 2 — Voci Contraddittorie
- **Lesson:** directions (sinistra / destra / dritto) — used to navigate between districts
- **Quest:** Talk to Donna Rosa (Piazza Maggiore) then Giorgio (Osteria del Sole)
- **Conflict:** Donna Rosa says 3 hours; Giorgio says 6 hours; both are certain
- **Clue earned:** a contradiction — mystery established

### Day 3 — L'Archivio Chiuso
- **Lesson:** secrets + discovery vocab + passato prossimo intro (ho trovato)
- **Quest:** Talk to Prof. Conti (Via Zamboni)
- **Reveal:** written document from the 1800s at Biblioteca Salaborsa; archive locked; Giorgio has seen it; Elena Bianchi may have access
- **Clue earned:** the truth is written down but unreachable

---

## Coding Principles
- Keep it simple.
- Keep modules focused and readable.
- Avoid over-engineering.
- Build in small validated increments.
- Do not add new systems without a clear gameplay reason.

---

## Development Roadmap

### Completed
- [x] Step 1: Clean baseline reset and runtime target
- [x] Step 2: Core engine loop foundation
- [x] Step 3: Input and scene manager
- [x] Step 4: Map and player movement vertical base
- [x] Step 5: Day system and daily loop gates
- [x] Step 6: Lesson system
- [x] Step 7: Dialogue system
- [x] Step 8: Quest plus clue progression
- [x] Step 9: Event bus integration pass
- [x] Step 10: Save/load with LocalStorage
- [x] Step 11: Vertical slice completion target
- [x] Step 12: Hardening and polish
- [x] Step 13: Day 1-3 content design (quests, dialogues, lessons, clue arc)
- [x] Step 14: Objective UI — visible quest goal + progress bar on map
- [x] Step 15: Clue notebook UI — display unlocked clues in side panel

### Up next
- [ ] Step 16: Day 4-7 content (library access arc, Elena gate, document reveal)
- [ ] Step 17: Days 8-10 content (climax preparation, final clue reveal)
- [ ] Step 18+: Days 11-30 content (optional depth, side quests, alternate endings)
