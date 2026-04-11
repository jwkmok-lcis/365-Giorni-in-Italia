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
    this._onTouchCancel = this._onTouchCancel.bind(this);

    // Virtual joystick state (touch drag → arrow keys)
    this._joyOrigin = null;
    this._joyActive = false;
    this._joyKeys = new Set();
    this._joyTouchId = null;
    this._actionTouchId = null;
    this._joyCenter = null;
    this._joyRadiusPx = 54;
    this._pendingTapEvent = null;
    this._touchHandled = false;
    this._touchLayout = "right-action";
    if (typeof window !== "undefined") {
      const saved = window.localStorage?.getItem("touchLayout");
      if (saved === "right-action" || saved === "left-action") {
        this._touchLayout = saved;
      }
    }

    this._touchUi = {
      enabled: false,
      joyActive: false,
      joyX: 0,
      joyY: 0,
      joyWorldX: null,  // world-space anchor (null = use rest position)
      joyWorldY: null,
      joyRadiusWorld: 43, // world-space ring radius for renderer
      actionFlash: 0,
    };
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
      this._canvas.addEventListener("touchcancel", this._onTouchCancel);
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
      this._canvas.removeEventListener("touchcancel", this._onTouchCancel);
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
    this._touchUi.actionFlash = Math.max(0, this._touchUi.actionFlash - 1);
  }

  getTouchControlsState() {
    return {
      ...this._touchUi,
      enabled: this._isExploreTouchControlsScene(),
      layout: this._touchLayout,
    };
  }

  getTouchLayout() {
    return this._touchLayout;
  }

  setTouchLayout(layout) {
    if (layout !== "right-action" && layout !== "left-action") {
      return this._touchLayout;
    }
    this._touchLayout = layout;
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("touchLayout", this._touchLayout);
    }
    return this._touchLayout;
  }

  toggleTouchLayout() {
    return this.setTouchLayout(this._touchLayout === "right-action" ? "left-action" : "right-action");
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
    const rawX = (localX / renderW) * cw;
    const rawY = (localY / renderH) * ch;
    const padX = this._game?.context?._viewPadX || 0;
    const padY = this._game?.context?._viewPadY || 0;
    const scaleX = this._game?.context?._viewScaleX || 1;
    const scaleY = this._game?.context?._viewScaleY || 1;

    event.canvasX = (rawX - padX) / scaleX;
    event.canvasY = (rawY - padY) / scaleY;
  }

  _onPointerDown(event) {
    if (event.pointerType === "touch") return;

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

    if (this._isExploreTouchControlsScene()) {
      const rect = this._canvas?.getBoundingClientRect();
      if (!rect) return;

      const changed = Array.from(event.changedTouches || []);
      const minSide = Math.min(rect.width, rect.height);
      const joyRadius = Math.max(44, Math.min(64, Math.round(minSide * 0.12)));
      const zones = this._getTouchZones(rect);
      this._joyRadiusPx = joyRadius;

      for (const touch of changed) {
        const isJoyTouch = zones.joyMinX === null
          ? touch.clientX <= zones.joyMaxX
          : touch.clientX >= zones.joyMinX;
        const isActionTouch = zones.actionMaxX === null
          ? touch.clientX >= zones.actionMinX
          : touch.clientX <= zones.actionMaxX;
        const inJoyY = touch.clientY >= zones.joyMinY;
        const inActionY = touch.clientY >= zones.actionMinY;

        if (isJoyTouch && inJoyY && this._joyTouchId === null) {
          this._joyTouchId = touch.identifier;
          // Floating anchor: joystick centres wherever the thumb lands
          this._joyCenter = { x: touch.clientX, y: touch.clientY };
          const worldPt = this._screenToWorld(touch.clientX, touch.clientY);
          this._touchUi.joyWorldX = worldPt.x;
          this._touchUi.joyWorldY = worldPt.y;
          this._touchUi.joyRadiusWorld = this._pxToWorldRadius(joyRadius);
          this._setJoystickFromTouch(touch);
          continue;
        }

        if (isActionTouch && inActionY && this._actionTouchId === null) {
          this._actionTouchId = touch.identifier;
          this._dispatchActionButton();
          continue;
        }

        // Route non-control touches (e.g. top UI selectors) to the active scene.
        this._dispatchSceneTouch(touch.clientX, touch.clientY);
      }

      this._pendingTapEvent = null;
      return;
    }

    this._touchUi.enabled = false;

    const touch = event.touches[0];
    this._joyOrigin = { x: touch.clientX, y: touch.clientY };
    this._joyActive = false;

    // Compute canvas coords now (for potential tap on touchend)
    this._addCanvasCoords(event);
    this._pendingTapEvent = event;
  }

  _onTouchMove(event) {
    event.preventDefault();

    if (this._isExploreTouchControlsScene()) {
      if (this._joyTouchId === null) return;
      const touch = Array.from(event.touches || []).find((t) => t.identifier === this._joyTouchId);
      if (!touch) return;
      this._setJoystickFromTouch(touch);
      return;
    }

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

  _onTouchEnd(event) {
    if (this._isExploreTouchControlsScene()) {
      const changed = Array.from(event?.changedTouches || []);
      for (const touch of changed) {
        if (touch.identifier === this._joyTouchId) {
          this._joyTouchId = null;
          this._joyCenter = null;
          this._joyRadiusPx = 54;
          this._clearJoystickKeys();
          this._touchUi.joyActive = false;
          this._touchUi.joyX = 0;
          this._touchUi.joyY = 0;
          this._touchUi.joyWorldX = null;
          this._touchUi.joyWorldY = null;
        }
        if (touch.identifier === this._actionTouchId) {
          this._actionTouchId = null;
        }
      }

      if (this._joyTouchId === null && this._actionTouchId === null) {
        this._touchHandled = false;
      }
      return;
    }

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

  _onTouchCancel(event) {
    this._onTouchEnd(event);
  }

  _isExploreTouchControlsScene() {
    const sceneName = this._game?._scene?.constructor?.name;
    return sceneName === "MapScene" || sceneName === "LocationScene";
  }

  _clearJoystickKeys() {
    for (const k of this._joyKeys) this._held.delete(k);
    this._joyKeys.clear();
  }

  _setJoystickFromTouch(touch) {
    if (!this._joyCenter) return;

    const dx = touch.clientX - this._joyCenter.x;
    const dy = touch.clientY - this._joyCenter.y;
    const dist = Math.hypot(dx, dy);
    const radius = this._joyRadiusPx || 54;
    const DEAD_ZONE = radius * 0.28;
    const MAX_RADIUS = radius * 0.84;

    this._clearJoystickKeys();

    if (dist < DEAD_ZONE) {
      this._touchUi.joyActive = false;
      this._touchUi.joyX = 0;
      this._touchUi.joyY = 0;
      return;
    }

    this._joyActive = true;
    this._touchUi.joyActive = true;

    const nx = dx / dist;
    const ny = dy / dist;
    const clamped = Math.min(1, dist / MAX_RADIUS);
    this._touchUi.joyX = nx * clamped;
    this._touchUi.joyY = ny * clamped;

    if (nx < -0.32) { this._held.add("ArrowLeft"); this._joyKeys.add("ArrowLeft"); }
    if (nx >  0.32) { this._held.add("ArrowRight"); this._joyKeys.add("ArrowRight"); }
    if (ny < -0.32) { this._held.add("ArrowUp"); this._joyKeys.add("ArrowUp"); }
    if (ny >  0.32) { this._held.add("ArrowDown"); this._joyKeys.add("ArrowDown"); }
  }

  /** Convert screen-space (clientX/Y) to world-space coordinates. */
  _screenToWorld(clientX, clientY) {
    const rect = this._canvas?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const borderLeft = parseFloat(getComputedStyle(this._canvas).borderLeftWidth) || 0;
    const borderTop  = parseFloat(getComputedStyle(this._canvas).borderTopWidth)  || 0;
    const contentW = this._canvas.clientWidth;
    const contentH = this._canvas.clientHeight;
    const cw = this._canvas.width;
    const ch = this._canvas.height;
    const canvasAspect  = cw / ch;
    const contentAspect = contentW / contentH;
    let renderW, renderH;
    if (contentAspect > canvasAspect) {
      renderH = contentH;  renderW = contentH * canvasAspect;
    } else {
      renderW = contentW;  renderH = contentW / canvasAspect;
    }
    const offsetX = (contentW - renderW) / 2;
    const offsetY = (contentH - renderH) / 2;
    const localX = clientX - rect.left - borderLeft - offsetX;
    const localY = clientY - rect.top  - borderTop  - offsetY;
    const rawX = (localX / renderW) * cw;
    const rawY = (localY / renderH) * ch;
    const padX   = this._game?.context?._viewPadX   || 0;
    const padY   = this._game?.context?._viewPadY   || 0;
    const scaleX = this._game?.context?._viewScaleX || 1;
    const scaleY = this._game?.context?._viewScaleY || 1;
    return { x: (rawX - padX) / scaleX, y: (rawY - padY) / scaleY };
  }

  /**
   * Convert a screen-pixel radius to world-space units (using the X axis).
   * Used so the joystick ring is drawn at the same visual size as the touch zone.
   */
  _pxToWorldRadius(screenPx) {
    const rect = this._canvas?.getBoundingClientRect();
    if (!rect) return screenPx;
    const cw = this._canvas.width;
    const ch = this._canvas.height;
    const contentW = this._canvas.clientWidth;
    const contentH = this._canvas.clientHeight;
    const canvasAspect  = cw / ch;
    const contentAspect = contentW / contentH;
    const renderW = contentAspect > canvasAspect
      ? contentH * canvasAspect
      : contentW;
    const scaleX = this._game?.context?._viewScaleX || 1;
    return screenPx * (cw / renderW) / scaleX;
  }

  _dispatchActionButton() {
    this._touchUi.actionFlash = 8;
    if (this._game?._scene) {
      this._game._scene.handleInput({ type: "keydown", key: "Enter", isTouchAction: true });
    }
  }

  _dispatchSceneTouch(clientX, clientY) {
    if (!this._game?._scene) return;
    const world = this._screenToWorld(clientX, clientY);
    this._game._scene.handleInput({
      type: "touchstart",
      canvasX: world.x,
      canvasY: world.y,
      isTouchUiTap: true,
    });
  }

  _getTouchZones(rect) {
    const actionMinY = rect.top + rect.height * 0.42;
    const joyMinY = rect.top + rect.height * 0.26;

    if (this._touchLayout === "left-action") {
      return {
        actionMinX: rect.left,
        actionMaxX: rect.left + rect.width * 0.42,
        actionMinY,
        joyMinX: rect.left + rect.width * 0.42,
        joyMaxX: null,
        joyMinY,
      };
    }

    return {
      actionMinX: rect.left + rect.width * 0.62,
      actionMaxX: null,
      actionMinY,
      joyMinX: null,
      joyMaxX: rect.left + rect.width * 0.58,
      joyMinY,
    };
  }
}
