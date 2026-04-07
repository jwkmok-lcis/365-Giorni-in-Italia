// Game – owns the canvas, runs the fixed-step update loop, and
// routes each frame to the currently active scene.
//
// Architecture notes:
//   - Fixed physics step:  1/60 s  (accumulator pattern)
//   - Variable render:     every rAF call with interpolation alpha
//   - Scenes are swapped via setScene(); only one scene is active
//   - Engine does not know about game logic (quests, lessons, etc.)

import { Clock } from "./Clock.js";

const FIXED_STEP = 1 / 60; // seconds per logic tick

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [context]  Optional bag of shared services (input, bus, scenes, systems).
   */
  constructor(canvas, context = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext("2d");
    // All shared services accessible to scenes via game.context.*
    this.context = context;

    this._clock       = new Clock();
    this._accumulator = 0;
    this._scene       = null;
    this._running     = false;
    this._rafId       = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Replace the active scene. Calls exit() on the old one and enter() on the new one. */
  setScene(scene) {
    if (this._scene && typeof this._scene.exit === "function") {
      this._scene.exit();
    }
    this._scene = scene;
    if (this._scene && typeof this._scene.enter === "function") {
      this._scene.enter(this);
    }
  }

  /** Start the animation loop. Safe to call once only. */
  start() {
    if (this._running) return;
    this._running = true;
    this._clock.reset();
    this._rafId = requestAnimationFrame((ts) => this._frame(ts));
  }

  /** Stop the loop (useful for tests or pause screens). */
  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  // ── Internal loop ──────────────────────────────────────────────────────

  _frame(now) {
    if (!this._running) return;

    const dt = this._clock.tick(now);
    this._accumulator += dt;

    // Fixed-step updates: catch up to real time in 1/60 s increments
    while (this._accumulator >= FIXED_STEP) {
      this.context.input?.flushFrame();             // clear one-shot key flags
      if (this._scene) this._scene.update(FIXED_STEP, this);
      this._accumulator -= FIXED_STEP;
    }

    // Render with alpha = fraction of step remaining (future: interpolation)
    const alpha = this._accumulator / FIXED_STEP;
    this._clearCanvas();
    if (this._scene) this._scene.render(this.ctx, alpha, this);

    this._rafId = requestAnimationFrame((ts) => this._frame(ts));
  }

  _clearCanvas() {
    this.ctx.fillStyle = "#121a23";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
