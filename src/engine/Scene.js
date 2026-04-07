// Scene – base class that documents the lifecycle contract every scene must follow.
// Scenes do NOT have to extend this; duck-typing works fine.
// This exists purely as readable documentation and a safe no-op fallback.

export class Scene {
  /** Called once when the scene becomes active. @param {import('./Game.js').Game} game */
  // eslint-disable-next-line no-unused-vars
  enter(game) {}

  /** Called once when the scene is being replaced. */
  exit() {}

  /**
   * Fixed-step logic update.
   * @param {number} dt   seconds (always 1/60)
   * @param {import('./Game.js').Game} game
   */
  // eslint-disable-next-line no-unused-vars
  update(dt, game) {}

  /**
   * Variable render step.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} alpha  interpolation factor [0-1]
   * @param {import('./Game.js').Game} game
   */
  // eslint-disable-next-line no-unused-vars
  render(ctx, alpha, game) {}

  /**
   * Raw keyboard/pointer events routed from the Input system.
   * @param {KeyboardEvent|PointerEvent} event
   */
  // eslint-disable-next-line no-unused-vars
  handleInput(event) {}
}
