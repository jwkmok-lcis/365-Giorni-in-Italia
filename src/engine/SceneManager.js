// SceneManager – named scene registry and transition helper.
// Scenes are registered by string ID; the Game engine does the actual
// setScene() call so the loop stays in one place.
//
// Usage:
//   manager.register("menu", new MenuScene());
//   manager.go("menu", game, { fromSave: false });

export class SceneManager {
  constructor() {
    this._scenes = new Map();
  }

  // ── Registry ───────────────────────────────────────────────────────────

  /** Register a scene instance under a string key. */
  register(id, scene) {
    this._scenes.set(id, scene);
  }

  /** Look up a scene without activating it. */
  get(id) {
    const scene = this._scenes.get(id);
    if (!scene) throw new Error(`SceneManager: unknown scene "${id}"`);
    return scene;
  }

  // ── Transitions ────────────────────────────────────────────────────────

  /**
   * Switch to a named scene.
   * @param {string} id          Scene key registered via register().
   * @param {import('./Game.js').Game} game
   * @param {object} [params]    Optional data forwarded to scene.enter().
   */
  go(id, game, params) {
    const scene = this.get(id);
    // Temporarily wrap enter so params reach the scene
    const originalEnter = scene.enter.bind(scene);
    scene.enter = (g) => originalEnter(g, params);
    game.setScene(scene);
    // Restore unpatched enter so future transitions work normally
    scene.enter = originalEnter;
  }
}
