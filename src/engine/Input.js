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
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    // Virtual joystick state (touch drag → arrow keys)
    this._joyOrigin = null;
    this._joyActive = false;
    this._joyKeys = new Set();
    this._pendingTapEvent = null;
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
      this._canvas.addEventListener("touchmove", this._onTouchMove, { passive: false });
      this._canvas.addEventListener("touchend", this._onTouchEnd);
    }
  }

  /** Remove all listeners. */
  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    if (this._canvas) {
      this._canvas.removeEventListener("pointerdown", this._onPointerDown);
      this._canvas.removeEventListener("touchstart", this._onTouchStart);
      this._canvas.removeEventListener("touchmove", this._onTouchMove);
      this._canvas.removeEventListener("touchend", this._onTouchEnd);
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

    const borderLeft = parseFloat(getComputedStyle(this._canvas).borderLeftWidth) || 0;
    const borderTop = parseFloat(getComputedStyle(this._canvas).borderTopWidth) || 0;

    // Content area inside borders
    const contentW = this._canvas.clientWidth;
    const contentH = this._canvas.clientHeight;

    // Internal canvas buffer resolution
    const cw = this._canvas.width;
    const ch = this._canvas.height;

    // Account for object-fit: contain — the rendered content may be
    // letter-boxed or pillar-boxed inside the CSS content box.
    const canvasAspect = cw / ch;
    const contentAspect = contentW / contentH;

    let renderW, renderH;
    if (contentAspect > canvasAspect) {
      // Pillarboxed (bars on left & right)
      renderH = contentH;
      renderW = contentH * canvasAspect;
    } else {
      // Letterboxed (bars on top & bottom)
      renderW = contentW;
      renderH = contentW / canvasAspect;
    }
    const offsetX = (contentW - renderW) / 2;
    const offsetY = (contentH - renderH) / 2;

    const localX = clientX - rect.left - borderLeft - offsetX;
    const localY = clientY - rect.top - borderTop - offsetY;
    event.canvasX = (localX / renderW) * cw - (this._game?.context?._viewPadX || 0);
    event.canvasY = (localY / renderH) * ch;
  }

  _onPointerDown(event) {
    // Skip if a touchstart already handled this gesture
    if (this._touchHandled) return;
    this._addCanvasCoords(event);
    if (this._game?._scene) {
      this._game._scene.handleInput(event);
    }
  }

  _onTouchStart(event) {
    event.preventDefault();
    this._touchHandled = true;

    const touch = event.touches[0];
    this._joyOrigin = { x: touch.clientX, y: touch.clientY };
    this._joyActive = false;

    // Compute canvas coords now (for potential tap on touchend)
    this._addCanvasCoords(event);
    this._pendingTapEvent = event;
  }

  _onTouchMove(event) {
    event.preventDefault();
    if (!this._joyOrigin || !event.touches.length) return;

    const touch = event.touches[0];
    const dx = touch.clientX - this._joyOrigin.x;
    const dy = touch.clientY - this._joyOrigin.y;
    const dist = Math.hypot(dx, dy);

    const DEAD_ZONE = 15;
    if (dist < DEAD_ZONE) return;

    this._joyActive = true;
    this._pendingTapEvent = null;

    // Clear previous joystick directional keys
    for (const k of this._joyKeys) this._held.delete(k);
    this._joyKeys.clear();

    // Set direction keys based on drag angle
    const nx = dx / dist;
    const ny = dy / dist;
    if (nx < -0.38) { this._held.add("ArrowLeft");  this._joyKeys.add("ArrowLeft");  }
    if (nx >  0.38) { this._held.add("ArrowRight"); this._joyKeys.add("ArrowRight"); }
    if (ny < -0.38) { this._held.add("ArrowUp");    this._joyKeys.add("ArrowUp");    }
    if (ny >  0.38) { this._held.add("ArrowDown");  this._joyKeys.add("ArrowDown");  }
  }

  _onTouchEnd() {
    // Clear joystick keys
    for (const k of this._joyKeys) this._held.delete(k);
    this._joyKeys.clear();

    // If it was a tap (no drag), route to the active scene
    if (!this._joyActive && this._pendingTapEvent) {
      if (this._game?._scene) {
        this._game._scene.handleInput(this._pendingTapEvent);
      }
    }

    this._joyOrigin = null;
    this._joyActive = false;
    this._pendingTapEvent = null;

    // Clear touch-handled flag after this event cycle
    setTimeout(() => { this._touchHandled = false; }, 60);
  }
}
