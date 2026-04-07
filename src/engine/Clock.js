// Clock – tracks real-time delta between frames.
// Safety: caps deltaTime at 250 ms to prevent a spiral-of-death
// when the tab is backgrounded or the user changes focus.

export class Clock {
  constructor() {
    this._lastTime = performance.now();
  }

  // Returns seconds elapsed since the last call. Call once per frame.
  tick(now = performance.now()) {
    const raw = (now - this._lastTime) / 1000;
    this._lastTime = now;
    return Math.min(raw, 0.25); // clamp to 250 ms max
  }

  reset(now = performance.now()) {
    this._lastTime = now;
  }
}
