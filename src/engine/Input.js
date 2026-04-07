// Input – captures keyboard state and routes events to the active scene.
// Centralised here so no scene needs its own addEventListener calls.
//
// Usage:
//   const input = new Input();
//   input.init(game);            // attach to window
//   input.isDown("ArrowRight")   // true while key held
//   input.wasPressed("Enter")    // true for one frame only, then cleared
//   input.destroy()              // remove listeners (cleanup)

export class Input {
  constructor() {
    this._held = new Set();    // keys currently held down
    this._pressed = new Set(); // keys pressed this frame (cleared each update)
    this._game = null;
    this._canvas = null;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Attach listeners to window and hold a reference to the running Game. */
  init(game) {
    this._game = game;
    this._canvas = game?.canvas ?? null;
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    if (this._canvas) {
      this._canvas.addEventListener("pointerdown", this._onPointerDown);
      this._canvas.addEventListener("touchstart", this._onTouchStart, { passive: false });
    }
  }

  /** Remove all listeners. */
  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    if (this._canvas) {
      this._canvas.removeEventListener("pointerdown", this._onPointerDown);
      this._canvas.removeEventListener("touchstart", this._onTouchStart);
    }

    this._canvas = null;
    this._game = null;
  }

  // ── Query API (called by scenes) ───────────────────────────────────────

  /** True while a key is physically held. */
  isDown(key) {
    return this._held.has(key);
  }

  /**
   * True the first frame a key was pressed.
   * Automatically cleared after Game calls input.flushFrame().
   */
  wasPressed(key) {
    return this._pressed.has(key);
  }

  /** Called by the Game at the start of each fixed update to clear one-shot flags. */
  flushFrame() {
    this._pressed.clear();
  }

  // ── Handlers ──────────────────────────────────────────────────────────

  _onKeyDown(event) {
    // Prevent default browser scroll for arrow keys while canvas is focused
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (!this._held.has(event.key)) {
      this._pressed.add(event.key); // only fires once per physical press
    }
    this._held.add(event.key);

    // Route raw event to the active scene
    if (this._game?._scene) {
      this._game._scene.handleInput(event);
    }
  }

  _onKeyUp(event) {
    this._held.delete(event.key);
  }

  _addCanvasCoords(event) {
    if (!this._canvas) return;
    const rect = this._canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const scaleX = this._canvas.width / rect.width;
    const scaleY = this._canvas.height / rect.height;
    event.canvasX = (clientX - rect.left) * scaleX;
    event.canvasY = (clientY - rect.top) * scaleY;
  }

  _onPointerDown(event) {
    this._addCanvasCoords(event);
    if (this._game?._scene) {
      this._game._scene.handleInput(event);
    }
  }

  _onTouchStart(event) {
    event.preventDefault();
    this._addCanvasCoords(event);
    if (this._game?._scene) {
      this._game._scene.handleInput(event);
    }
  }
}
