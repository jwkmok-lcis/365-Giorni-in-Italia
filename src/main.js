import { Game }         from "./engine/Game.js";
import { Input }        from "./engine/Input.js";
import { EventBus }     from "./engine/EventBus.js";
import { SceneManager } from "./engine/SceneManager.js";
import { MapScene }     from "./scenes/MapScene.js";
import { LessonScene }  from "./scenes/LessonScene.js";
import { DialogueScene } from "./scenes/DialogueScene.js";
import { LocationScene } from "./scenes/LocationScene.js";
import { DaySystem }    from "./systems/DaySystem.js";
import { LessonSystem } from "./systems/LessonSystem.js";
import { PlayerSystem } from "./systems/PlayerSystem.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { QuestSystem } from "./systems/QuestSystem.js";
import { EventFeedSystem } from "./systems/EventFeedSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { VoiceOver } from "./utils/VoiceOver.js";

// ── DOM guards ────────────────────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const statusPanel = document.getElementById("statusPanel");
const promptPanel = document.getElementById("promptPanel");

if (!(canvas instanceof HTMLCanvasElement) || !statusPanel || !promptPanel) {
  throw new Error("Bootstrap failed: required DOM nodes are missing.");
}

// ── Shared services (the game context bag) ────────────────────────────────────
const bus    = new EventBus();
const input  = new Input();
const scenes = new SceneManager();
const day    = new DaySystem();
const lesson = new LessonSystem();
const player = new PlayerSystem();
const dialogue = new DialogueSystem();
const quest = new QuestSystem();
const eventFeed = new EventFeedSystem();
const save = new SaveSystem();
const voice = new VoiceOver();

eventFeed.attach(bus);
eventFeed.push("Welcome to Bologna. Start your daily lesson.");

scenes.register("map", new MapScene());
scenes.register("lesson", new LessonScene());
scenes.register("dialogue", new DialogueScene());
scenes.register("location", new LocationScene());

// context is passed through to every scene via game.context.*
const game = new Game(canvas, { bus, input, scenes, day, lesson, player, dialogue, quest, eventFeed, save, voice });

const loaded = save.loadIntoContext(game.context);
if (loaded) {
  eventFeed.push(`Save loaded for day ${day.currentDay}.`);
}

const autosaveEvents = [
  "LESSON_COMPLETED",
  "QUEST_OBJECTIVE_PROGRESS",
  "QUEST_COMPLETED",
  "CLUE_UNLOCKED",
  "DAY_ENDED"
];
autosaveEvents.forEach((eventName) => {
  bus.on(eventName, () => {
    save.save(game.context);
  });
});

// Wire the input system so keydown events flow into the active scene
input.init(game);

// ── Landscape canvas resize ───────────────────────────────────────────────────
const GAME_W = 800;
const GAME_H = 512;

function fitCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw <= 840;

  if (!isMobile) {
    if (canvas.width !== GAME_W || canvas.height !== GAME_H) {
      canvas.width = GAME_W;
      canvas.height = GAME_H;
    }
    game.context._viewPadX = 0;
    return;
  }

  const viewAspect = vw / vh;
  const gameAspect = GAME_W / GAME_H;

  if (viewAspect > gameAspect) {
    // Landscape: widen buffer to match screen aspect (eliminates pillar-boxing)
    const newW = Math.round(GAME_H * viewAspect);
    if (canvas.width !== newW || canvas.height !== GAME_H) {
      canvas.width = newW;
      canvas.height = GAME_H;
    }
    game.context._viewPadX = Math.round((canvas.width - GAME_W) / 2);
  } else {
    // Portrait or near-square: standard size
    if (canvas.width !== GAME_W || canvas.height !== GAME_H) {
      canvas.width = GAME_W;
      canvas.height = GAME_H;
    }
    game.context._viewPadX = 0;
  }
}

fitCanvas();
window.addEventListener("resize", fitCanvas);
window.addEventListener("orientationchange", () => setTimeout(fitCanvas, 200));

// ── Start ─────────────────────────────────────────────────────────────────────
scenes.go(day.canExplore() ? "map" : "lesson", game);
game.start();

// Hide the title header once the game is running
const header = document.getElementById("gameHeader");
if (header) header.classList.add("hidden");
