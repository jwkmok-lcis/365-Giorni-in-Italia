const CACHE_NAME = "giorni-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./src/main.js",
  "./src/engine/Clock.js",
  "./src/engine/EventBus.js",
  "./src/engine/Game.js",
  "./src/engine/Input.js",
  "./src/engine/Scene.js",
  "./src/engine/SceneManager.js",
  "./src/scenes/DialogueScene.js",
  "./src/scenes/LessonScene.js",
  "./src/scenes/LocationScene.js",
  "./src/scenes/MapScene.js",
  "./src/systems/DaySystem.js",
  "./src/systems/DialogueSystem.js",
  "./src/systems/EventFeedSystem.js",
  "./src/systems/LessonSystem.js",
  "./src/systems/PlayerSystem.js",
  "./src/systems/QuestSystem.js",
  "./src/systems/SaveSystem.js",
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
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
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
