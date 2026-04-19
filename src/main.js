import { Game }         from "./engine/Game.js";
import { Input }        from "./engine/Input.js";
import { EventBus }     from "./engine/EventBus.js";
import { SceneManager } from "./engine/SceneManager.js";
import { MapScene }     from "./scenes/MapScene.js";
import { LessonScene }  from "./scenes/LessonScene.js";
import { DialogueScene } from "./scenes/DialogueScene.js";
import { LocationScene } from "./scenes/LocationScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { DaySystem }    from "./systems/DaySystem.js";
import { LessonSystem } from "./systems/LessonSystem.js";
import { PlayerSystem } from "./systems/PlayerSystem.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { QuestSystem } from "./systems/QuestSystem.js";
import { EventFeedSystem } from "./systems/EventFeedSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { VoiceOver } from "./utils/VoiceOver.js";
// New adaptive learning systems
import { DynamicDifficultySystem } from "./systems/DynamicDifficultySystem.js";
import { SkillTreeSystem } from "./systems/SkillTreeSystem.js";
import { VoicePronunciationSystem } from "./systems/VoicePronunciationSystem.js";

// ── DOM guards ────────────────────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const statusPanel = document.getElementById("statusPanel");
const promptPanel = document.getElementById("promptPanel");
const hardResetBtn = document.getElementById("hardResetBtn");

if (!(canvas instanceof HTMLCanvasElement) || !statusPanel || !promptPanel) {
  throw new Error("Bootstrap failed: required DOM nodes are missing.");
}

async function hardRefreshApp() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch {
    // Best effort: continue with reload even if clearing cache/SW fails.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("hard_reset", String(Date.now()));
  window.location.replace(url.toString());
}

if (hardResetBtn instanceof HTMLButtonElement) {
  hardResetBtn.addEventListener("click", async () => {
    const confirmed = window.confirm("Hard reset the app now? This will force a fresh reload.");
    if (!confirmed) return;

    hardResetBtn.disabled = true;
    hardResetBtn.textContent = "Resetting...";
    await hardRefreshApp();
  });
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
// New adaptive learning systems
const difficultySystem = new DynamicDifficultySystem();
const skillTreeSystem = new SkillTreeSystem();
const voiceSystem = new VoicePronunciationSystem();

eventFeed.attach(bus);
eventFeed.push("Welcome to Bologna. Start your daily lesson.");

scenes.register("map", new MapScene());
scenes.register("intro", new IntroScene());
scenes.register("lesson", new LessonScene());
scenes.register("dialogue", new DialogueScene());
scenes.register("location", new LocationScene());

// context is passed through to every scene via game.context.*
const game = new Game(canvas, { bus, input, scenes, day, lesson, player, dialogue, quest, eventFeed, save, voice, difficultySystem, skillTreeSystem, voiceSystem });
game.context._worldW = 800;
game.context._worldH = 512;
game.context._viewPadX = 0;
game.context._viewPadY = 0;
game.context._viewScaleX = 1;
game.context._viewScaleY = 1;
game.context._safeInsetsPx = { top: 0, right: 0, bottom: 0, left: 0 };
game.context._safeInsetsWorld = { top: 0, right: 0, bottom: 0, left: 0 };
game.context._touchDeviceProfile = {
  id: "default-mobile",
  actionScale: 1,
  actionEdgeX: 16,
  actionEdgeBottom: 18,
  joyEdgeX: 18,
  joyEdgeBottom: 20,
  selectorRight: 148,
  selectorTop: 10,
  coachLift: 0,
};

if (!voice.isSupported()) {
  eventFeed.push("Voice-over unavailable in this browser.");
  promptPanel.textContent = "Voice-over unavailable: your browser does not expose speech synthesis.";
} else {
  const primeVoiceUnlock = () => {
    voice.unlockFromGesture();
    window.removeEventListener("pointerdown", primeVoiceUnlock, true);
    window.removeEventListener("touchstart", primeVoiceUnlock, true);
    window.removeEventListener("keydown", primeVoiceUnlock, true);
  };

  // Prime voice once from the first genuine user gesture.
  window.addEventListener("pointerdown", primeVoiceUnlock, { capture: true, passive: true });
  window.addEventListener("touchstart", primeVoiceUnlock, { capture: true, passive: true });
  window.addEventListener("keydown", primeVoiceUnlock, { capture: true });
}

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
const WORLD_W = 800;
const WORLD_H = 512;
const TARGET_RATIO = 20 / 9;
const DESKTOP_W = 1000;
const DESKTOP_H = 450;

function parsePx(value) {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function readSafeInsetsPx() {
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    top: parsePx(rootStyle.getPropertyValue("--safe-top")),
    right: parsePx(rootStyle.getPropertyValue("--safe-right")),
    bottom: parsePx(rootStyle.getPropertyValue("--safe-bottom")),
    left: parsePx(rootStyle.getPropertyValue("--safe-left")),
  };
}

function syncSafeInsets() {
  const px = readSafeInsetsPx();
  const scaleX = game.context._viewScaleX || 1;
  const scaleY = game.context._viewScaleY || 1;

  game.context._safeInsetsPx = px;
  game.context._safeInsetsWorld = {
    top: px.top / scaleY,
    right: px.right / scaleX,
    bottom: px.bottom / scaleY,
    left: px.left / scaleX,
  };
}

function computeTouchProfile(vw, vh) {
  const ua = navigator.userAgent || "";
  const ratio = vh > 0 ? vw / vh : 1;
  const isIPhone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSamsung = /SM-|Samsung/i.test(ua);

  if (isIPhone) {
    return {
      id: "iphone-notch",
      actionScale: 1.06,
      actionEdgeX: 18,
      actionEdgeBottom: 20,
      joyEdgeX: 20,
      joyEdgeBottom: 22,
      selectorRight: 152,
      selectorTop: 12,
      coachLift: 8,
    };
  }

  if (isSamsung || (isAndroid && ratio < 0.47)) {
    return {
      id: "samsung-tall",
      actionScale: 1.04,
      actionEdgeX: 15,
      actionEdgeBottom: 22,
      joyEdgeX: 17,
      joyEdgeBottom: 24,
      selectorRight: 148,
      selectorTop: 11,
      coachLift: 10,
    };
  }

  if (isAndroid) {
    return {
      id: "android-gesture",
      actionScale: 1.03,
      actionEdgeX: 16,
      actionEdgeBottom: 22,
      joyEdgeX: 18,
      joyEdgeBottom: 24,
      selectorRight: 148,
      selectorTop: 10,
      coachLift: 8,
    };
  }

  return {
    id: "default-mobile",
    actionScale: 1,
    actionEdgeX: 16,
    actionEdgeBottom: 18,
    joyEdgeX: 18,
    joyEdgeBottom: 20,
    selectorRight: 148,
    selectorTop: 10,
    coachLift: 0,
  };
}

function applyViewBuffer(bufferW, bufferH) {
  if (canvas.width !== bufferW || canvas.height !== bufferH) {
    canvas.width = bufferW;
    canvas.height = bufferH;
  }

  // Keep the world aspect stable and center it inside the 20:9 backbuffer.
  const scale = Math.min(bufferW / WORLD_W, bufferH / WORLD_H);
  const renderW = WORLD_W * scale;
  const renderH = WORLD_H * scale;

  game.context._viewPadX = Math.floor((bufferW - renderW) / 2);
  game.context._viewPadY = Math.floor((bufferH - renderH) / 2);
  game.context._viewScaleX = scale;
  game.context._viewScaleY = scale;
  syncSafeInsets();
}

function fitCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw <= 840;
  game.context._touchDeviceProfile = computeTouchProfile(vw, vh);

  if (!isMobile) {
    applyViewBuffer(DESKTOP_W, DESKTOP_H);
    return;
  }

  const viewAspect = vw / vh;
  if (viewAspect > TARGET_RATIO) {
    applyViewBuffer(Math.round(vh * TARGET_RATIO), vh);
  } else {
    applyViewBuffer(vw, Math.round(vw / TARGET_RATIO));
  }
}

fitCanvas();
window.addEventListener("resize", fitCanvas);
window.addEventListener("orientationchange", () => setTimeout(fitCanvas, 200));
window.visualViewport?.addEventListener("resize", fitCanvas);

// ── Start ─────────────────────────────────────────────────────────────────────
const entryScene = "intro"; // Force intro for testing
scenes.go(entryScene, game);
game.start();
game.canvas.focus(); // Focus canvas for keyboard input

// Hide the title header once the game is running
const header = document.getElementById("gameHeader");
if (header) header.classList.add("hidden");
