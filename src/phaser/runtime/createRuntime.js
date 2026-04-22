import * as Phaser from "../../vendor/phaser.esm.js";
import { DaySystem } from "../../systems/DaySystem.js";
import { LessonSystem } from "../../systems/LessonSystem.js";
import { PlayerSystem } from "../../systems/PlayerSystem.js";
import { DialogueSystem } from "../../systems/DialogueSystem.js";
import { QuestSystem } from "../../systems/QuestSystem.js";
import { SaveSystem } from "../../systems/SaveSystem.js";
import { DynamicDifficultySystem } from "../../systems/DynamicDifficultySystem.js";
import { SkillTreeSystem } from "../../systems/SkillTreeSystem.js";
import { VoicePronunciationSystem } from "../../systems/VoicePronunciationSystem.js";
import { EventFeedSystem } from "../../systems/EventFeedSystem.js";
import { VoiceOver } from "../../utils/VoiceOver.js";
import { Events } from "../../engine/EventBus.js";

export function createRuntime(dom) {
  const bus = new Phaser.Events.EventEmitter();
  const runtime = {
    bus,
    dom,
    lesson: new LessonSystem(),
    day: new DaySystem(),
    player: new PlayerSystem(),
    dialogue: new DialogueSystem(),
    quest: new QuestSystem(),
    save: new SaveSystem(),
    voice: new VoiceOver(),
    difficultySystem: new DynamicDifficultySystem(),
    skillTreeSystem: new SkillTreeSystem(),
    voiceSystem: new VoicePronunciationSystem(),
    eventFeed: new EventFeedSystem(),
    uiState: {
      latestXp: null,
      latestFeedback: null,
    },
    loaded: false,
    resumeSceneKey: "IntroScene",
    currentLocationId: null,
    currentNpcId: null,
    headerHidden: false,
    setStatus(message) {
      if (dom.statusPanel) {
        dom.statusPanel.textContent = message ?? "";
      }
    },
    setPrompt(message) {
      if (dom.promptPanel) {
        dom.promptPanel.textContent = message ?? "";
      }
    },
    setHeaderHidden(hidden) {
      runtime.headerHidden = !!hidden;
      dom.header?.classList.toggle("hidden", runtime.headerHidden);
    },
    clearUi() {
      runtime.setStatus("");
      runtime.setPrompt("");
    },
    startNewGame() {
      runtime.day.reset();
      runtime.player.reset();
      runtime.quest.reset();
      runtime.skillTreeSystem.reset();
      runtime.save.clear();
      runtime.eventFeed.messages = [];
      runtime.eventFeed.push("Benvenuto a Bologna.");
      runtime.eventFeed.push("Obiettivo: parla con Marco.");
      runtime.loaded = false;
      runtime.currentLocationId = null;
      runtime.currentNpcId = null;
      runtime.resumeSceneKey = "LessonScene";
      runtime.clearUi();
    },
    refreshResumeScene() {
      if (runtime.day.gameComplete || !runtime.day.canExplore()) {
        runtime.resumeSceneKey = "LessonScene";
      } else if (runtime.currentLocationId) {
        runtime.resumeSceneKey = "LocationScene";
      } else {
        runtime.resumeSceneKey = "OverworldScene";
      }
      return runtime.resumeSceneKey;
    },
    getResumeSceneData() {
      return runtime.resumeSceneKey === "LocationScene" && runtime.currentLocationId
        ? { locationId: runtime.currentLocationId }
        : undefined;
    },
    persistProgress() {
      runtime.loaded = true;
      runtime.refreshResumeScene();
      runtime.save.save(runtime);
    },
  };

  runtime.loaded = runtime.save.loadIntoContext(runtime);
  runtime.resumeSceneKey = runtime.loaded ? runtime.refreshResumeScene() : "IntroScene";
  runtime.eventFeed.attach(bus);

  bus.on(Events.DAY_STARTED, () => {
    runtime.quest.syncActiveQuest(runtime.day.currentDay);
  });

  if (runtime.loaded) {
    runtime.quest.syncActiveQuest(runtime.day.currentDay);
  }

  bus.on(Events.XP_AWARDED, (payload) => {
    runtime.uiState.latestXp = {
      ...payload,
      recordedAt: Date.now(),
    };
  });

  bus.on(Events.GRAMMAR_FEEDBACK, (payload) => {
    runtime.uiState.latestFeedback = {
      ...payload,
      recordedAt: Date.now(),
    };
  });

  const autosaveEvents = [
    Events.LESSON_COMPLETED,
    Events.QUEST_OBJECTIVE_PROGRESS,
    Events.QUEST_COMPLETED,
    Events.CLUE_UNLOCKED,
    Events.DAY_ENDED,
    Events.DAY_STARTED,
    Events.ITEM_PURCHASED,
  ];

  autosaveEvents.forEach((eventName) => {
    bus.on(eventName, () => {
      runtime.persistProgress();
    });
  });

  if (!runtime.voice.isSupported()) {
    runtime.setPrompt("Voice-over unavailable: your browser does not expose speech synthesis.");
  }

  if (runtime.loaded) {
    runtime.eventFeed.push(`Save loaded for day ${runtime.day.currentDay}.`);
  } else {
    runtime.eventFeed.push("Welcome to Bologna. Start your daily lesson.");
  }

  runtime.setHeaderHidden(false);

  return runtime;
}

export function unlockVoiceFromFirstGesture(runtime) {
  if (!runtime.voice?.isSupported()) return;

  const primeVoiceUnlock = () => {
    runtime.voice.unlockFromGesture();
    window.removeEventListener("pointerdown", primeVoiceUnlock, true);
    window.removeEventListener("touchstart", primeVoiceUnlock, true);
    window.removeEventListener("keydown", primeVoiceUnlock, true);
  };

  window.addEventListener("pointerdown", primeVoiceUnlock, { capture: true, passive: true });
  window.addEventListener("touchstart", primeVoiceUnlock, { capture: true, passive: true });
  window.addEventListener("keydown", primeVoiceUnlock, { capture: true });
}

export function getCurrentObjectiveNpcId(runtime) {
  const quest = runtime.quest.activeQuest;
  if (!quest) return null;

  const objective = quest.objectives.find((entry) => !entry.completed && entry.type === "talkToNpc");
  return objective?.npcId ?? null;
}

export function hardRefreshApp() {
  return (async () => {
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
      // Best effort only.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("hard_reset", String(Date.now()));
    window.location.replace(url.toString());
  })();
}
