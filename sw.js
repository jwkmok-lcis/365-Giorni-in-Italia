const CACHE_NAME = "giorni-v19";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./src/main.js",
  "./src/vendor/phaser.esm.js",
  "./src/phaser/createGame.js",
  "./src/phaser/runtime/createRuntime.js",
  "./src/phaser/runtime/dialogueFlow.js",
  "./src/phaser/content/bolognaMeta.js",
  "./src/phaser/scenes/BootScene.js",
  "./src/phaser/scenes/IntroScene.js",
  "./src/phaser/scenes/LessonScene.js",
  "./src/phaser/scenes/DialogueScene.js",
  "./src/phaser/scenes/OverworldScene.js",
  "./src/phaser/scenes/LocationScene.js",
  "./src/engine/EventBus.js",
  "./src/systems/DaySystem.js",
  "./src/systems/DialogueSystem.js",
  "./src/systems/DynamicDifficultySystem.js",
  "./src/systems/EventFeedSystem.js",
  "./src/systems/LessonSystem.js",
  "./src/systems/PlayerSystem.js",
  "./src/systems/QuestSystem.js",
  "./src/systems/SaveSystem.js",
  "./src/systems/SkillTreeSystem.js",
  "./src/systems/VoicePronunciationSystem.js",
  "./src/systems/buildings.js",
  "./src/systems/camera.js",
  "./src/systems/input.js",
  "./src/systems/player.js",
  "./src/content/dialogues.js",
  "./src/content/glossary.js",
  "./src/content/idleDialogues.js",
  "./src/content/lessons.js",
  "./src/content/map.js",
  "./src/content/questHints.js",
  "./src/content/quests.js",
  "./src/content/shops.js",
  "./src/ui/ClueNotebook.js",
  "./src/ui/Hud.js",
  "./src/ui/ObjectivePanel.js",
  "./src/utils/math.js",
  "./src/utils/VoiceOver.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
