import { createPhaserGame } from "./phaser/createGame.js";
import { createRuntime, hardRefreshApp, unlockVoiceFromFirstGesture } from "./phaser/runtime/createRuntime.js";

const canvas = document.getElementById("gameCanvas");
const header = document.getElementById("gameHeader");
const infoDrawer = document.getElementById("infoDrawer");
const statusPanel = document.getElementById("statusPanel");
const promptPanel = document.getElementById("promptPanel");
const hardResetBtn = document.getElementById("hardResetBtn");

if (!(canvas instanceof HTMLCanvasElement) || !statusPanel || !promptPanel) {
  throw new Error("Bootstrap failed: required DOM nodes are missing.");
}

const debugOverlay = (() => {
  const overlay = document.createElement("div");
  overlay.id = "appDebugOverlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.top = "0";
  overlay.style.zIndex = "9999";
  overlay.style.padding = "0.75rem 1rem";
  overlay.style.fontFamily = "system-ui, sans-serif";
  overlay.style.fontSize = "0.9rem";
  overlay.style.color = "#fff";
  overlay.style.background = "rgba(220, 38, 38, 0.9)";
  overlay.style.whiteSpace = "pre-wrap";
  overlay.style.display = "none";
  overlay.style.maxHeight = "45vh";
  overlay.style.overflowY = "auto";
  overlay.textContent = "Initializing...";
  document.body.appendChild(overlay);
  return overlay;
})();

function showDebugMessage(message, isError = false) {
  if (promptPanel) promptPanel.textContent = message;
  if (debugOverlay) {
    debugOverlay.textContent = message;
    debugOverlay.style.display = isError ? "block" : "none";
  }
  if (isError && canvas) {
    canvas.style.backgroundColor = "#330000";
  }
}

window.addEventListener("error", (event) => {
  const msg = `Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
  console.error(msg, event.error);
  showDebugMessage(msg, true);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  const msg = `Unhandled promise rejection: ${reason}`;
  console.error(msg, event.reason);
  showDebugMessage(msg, true);
});

if (hardResetBtn instanceof HTMLButtonElement) {
  hardResetBtn.addEventListener("click", async () => {
    const confirmed = window.confirm("Hard reset the app now? This will force a fresh reload.");
    if (!confirmed) return;

    hardResetBtn.disabled = true;
    hardResetBtn.textContent = "Resetting...";
    await hardRefreshApp();
  });
}

const runtime = createRuntime({ canvas, header, infoDrawer, statusPanel, promptPanel });
unlockVoiceFromFirstGesture(runtime);

try {
  showDebugMessage("Booting game...");
  const game = createPhaserGame({ canvas, runtime });
  const applyViewportSize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    game.scale.resize(width, height);
    game.canvas.style.width = `${width}px`;
    game.canvas.style.height = `${height}px`;
  };
  applyViewportSize();
  window.addEventListener("resize", () => {
    applyViewportSize();
  });
  window.__giorniGame = game;
  canvas.focus();
  showDebugMessage("Game started successfully.");
} catch (error) {
  const msg = `Startup failed: ${error?.message ?? String(error)}`;
  console.error(msg, error);
  showDebugMessage(msg, true);
}
